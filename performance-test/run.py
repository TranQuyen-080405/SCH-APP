"""Run only against a fresh localhost instance; preserve raw evidence for every stage."""
import argparse
import csv
import datetime as dt
import importlib.metadata
import json
import os
import platform
import secrets
import socket
import statistics
import subprocess
import sys
import time
from pathlib import Path

import psutil

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TZ = dt.timezone(dt.timedelta(hours=7))


def save(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding='utf-8')


def counters():
    disk = psutil.disk_io_counters()
    network = psutil.net_io_counters()
    return {**{f'disk_{k}': getattr(disk, k) if disk else None
               for k in ('read_bytes', 'write_bytes')},
            **{f'network_{k}': getattr(network, k) if network else None
               for k in ('bytes_sent', 'bytes_recv')}}


def run_stage(directory, users, args):
    directory.mkdir()
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    env = {**os.environ, 'PORT': str(port), 'SESSION_SECRET': secrets.token_hex(32),
           'CLIENT_ORIGIN': f'http://127.0.0.1:{port}', 'SESSION_COOKIE_SECURE': 'false',
           'SESSION_COOKIE_SAME_SITE': 'lax', 'NODE_ENV': 'production',
           'DATABASE_PATH': str(directory / 'benchmark.db'), 'PTM_USERS': str(users),
           'PTM_SPAWN_RATE': str(args.spawn_rate), 'PTM_MARKER_DIR': str(directory),
           'PTM_WARMUP_SECONDS': str(args.warmup), 'PTM_MEASURE_SECONDS': str(args.seconds)}
    samples = []
    load = None
    backend = None
    started = None
    baseline = None
    with (directory / 'server.log').open('w') as server_log, (directory / 'locust.log').open('w') as load_log:
        try:
            backend = subprocess.Popen(['node', str(HERE / 'server.mjs')], cwd=ROOT,
                                       env=env, stdin=subprocess.PIPE, stdout=server_log,
                                       stderr=subprocess.STDOUT, text=True)
            server = psutil.Process(backend.pid)
            deadline = time.monotonic() + 120
            while True:
                if backend.poll() is not None or time.monotonic() > deadline:
                    raise RuntimeError(f'Backend startup failed: {directory / "server.log"}')
                try:
                    with socket.create_connection(('127.0.0.1', port), timeout=.3):
                        break
                except OSError:
                    time.sleep(.2)
            command = [sys.executable, '-m', 'locust', '-f', str(HERE / 'locustfile.py'),
                       '--headless', '-H', f'http://127.0.0.1:{port}', '-u', str(users),
                       '-r', str(args.spawn_rate), '-t', str(int(args.seconds + args.warmup + users / args.spawn_rate + 240)),
                       '--stop-timeout', '5', '--only-summary', '--html', str(directory / 'report.html'),
                       '--csv', str(directory / 'locust'), '--csv-full-history']
            save(directory / 'config.json', {'users': users, 'spawn_rate': args.spawn_rate,
                 'warmup_seconds': args.warmup, 'measurement_seconds': args.seconds,
                 'host': f'http://127.0.0.1:{port}', 'command': command,
                 'fixtures': {'accounts': users, 'tasks_per_account': 20,
                              'projects_per_account': 3, 'notes_per_account': 5}})
            print(f'START users={users}; warmup={args.warmup}s; measure={args.seconds}s', flush=True)
            load = subprocess.Popen(command, cwd=ROOT, env=env, stdout=load_log, stderr=subprocess.STDOUT)
            generator = psutil.Process(load.pid)
            # Windows venv python.exe is a launcher; measure the real interpreter.
            time.sleep(1)
            children = generator.children(recursive=True)
            if children:
                generator = max(children, key=lambda child: child.memory_info().rss)
            next_sample = 0
            last_progress = 0
            final_counters = None
            while load.poll() is None:
                if (directory / 'measurement-start.json').exists() and started is None:
                    started = json.loads((directory / 'measurement-start.json').read_text())['epoch']
                    backend.stdin.write(json.dumps({'action': 'reset'}) + '\n')
                    backend.stdin.flush()
                    baseline = counters()
                    server.cpu_percent()
                    generator.cpu_percent()
                    psutil.cpu_percent()
                    print(f'MEASURE users={users}; all sessions ready', flush=True)
                if (directory / 'measurement-end.json').exists() and final_counters is None:
                    final_counters = counters()
                    backend.stdin.write(json.dumps({'action': 'snapshot', 'path': str(directory / 'database.json')}) + '\n')
                    backend.stdin.flush()
                now = time.time()
                if started and final_counters is None and now >= next_sample:
                    samples.append({'epoch': now, 'elapsed_seconds': now - started,
                        'server_cpu_percent_one_core': server.cpu_percent(),
                        'server_rss_mib': server.memory_info().rss / 2**20,
                        'generator_cpu_percent_one_core': generator.cpu_percent(),
                        'generator_rss_mib': generator.memory_info().rss / 2**20,
                        'host_cpu_percent': psutil.cpu_percent(),
                        'host_memory_percent': psutil.virtual_memory().percent, **counters()})
                    next_sample = now + 1
                    if now - last_progress >= 30:
                        print(f'PROGRESS users={users}; measured={now - started:.0f}s', flush=True)
                        last_progress = now
                time.sleep(.1)
            if (directory / 'invalid.json').exists() or not (directory / 'measurement-end.json').exists():
                raise RuntimeError(f'Incomplete stage: {directory / "locust.log"}')
            if load.returncode not in (0, 1):
                raise RuntimeError(f'Locust exited {load.returncode}')
            if not samples:
                raise RuntimeError('No resource samples collected')
            if final_counters is None:
                final_counters = counters()
                backend.stdin.write(json.dumps({'action': 'snapshot', 'path': str(directory / 'database.json')}) + '\n')
                backend.stdin.flush()
            with (directory / 'resources.csv').open('w', newline='') as out:
                writer = csv.DictWriter(out, fieldnames=samples[0].keys())
                writer.writeheader()
                writer.writerows(samples)
            end = json.loads((directory / 'measurement-end.json').read_text())['epoch']
            seconds = end - started
            with (directory / 'locust_stats.csv').open(newline='', encoding='utf-8') as source:
                total = next(row for row in csv.DictReader(source) if row['Name'] == 'Aggregated')
            result = {'users': users, 'duration_seconds': seconds,
                      'requests': int(total['Request Count']), 'failures': int(total['Failure Count']),
                      'rps': float(total['Requests/s']), 'avg_ms': float(total['Average Response Time']),
                      **{f'p{p}_ms': float(total[f'{p}%']) for p in (50, 95, 99)},
                      'start_local': dt.datetime.fromtimestamp(started, TZ).isoformat(),
                      'end_local': dt.datetime.fromtimestamp(end, TZ).isoformat()}
            result['error_percent'] = 100 * result['failures'] / result['requests'] if result['requests'] else None
            for key in ('server_cpu_percent_one_core', 'server_rss_mib', 'host_cpu_percent',
                        'host_memory_percent', 'generator_cpu_percent_one_core', 'generator_rss_mib'):
                result[key + '_avg'] = statistics.mean(row[key] for row in samples[1:] or samples)
                result[key + '_max'] = max(row[key] for row in samples[1:] or samples)
            for key, initial in baseline.items():
                final = (final_counters or counters())[key]
                result[key + '_kib_s'] = (final - initial) / seconds / 1024 if final is not None and initial is not None else None
            deadline = time.monotonic() + 10
            while not (directory / 'database.json').exists() and time.monotonic() < deadline:
                time.sleep(.1)
            result['database'] = json.loads((directory / 'database.json').read_text())
            save(directory / 'summary.json', result)
            print(f'DONE users={users}; requests={result["requests"]}; RPS={result["rps"]:.2f}; P95={result["p95_ms"]}ms; errors={result["error_percent"]:.2f}%', flush=True)
            return result
        finally:
            if load and load.poll() is None:
                load.terminate()
                load.wait(timeout=20)
            if backend and backend.poll() is None:
                backend.stdin.write('{"action":"stop"}\n')
                backend.stdin.flush()
                try:
                    backend.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    backend.kill()
                    backend.wait()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--users', nargs='+', type=int, default=[100, 300, 500, 1000])
    parser.add_argument('--seconds', type=int, default=300)
    parser.add_argument('--warmup', type=int, default=30)
    parser.add_argument('--spawn-rate', type=float, default=10)
    parser.add_argument('--label', default='benchmark')
    args = parser.parse_args()
    if min(args.users) < 1 or args.seconds < 1 or args.warmup < 0 or args.spawn_rate <= 0:
        parser.error('Invalid load or duration')
    stamp = dt.datetime.now(TZ).strftime('%Y%m%d-%H%M%S')
    directory = HERE / 'reports' / f'{stamp}-{args.label}'
    directory.mkdir(parents=True)
    save(directory / 'environment.json', {
        'local_date': dt.datetime.now(TZ).isoformat(), 'timezone': 'Asia/Saigon',
        'platform': platform.platform(), 'processor': platform.processor(),
        'logical_cpus': psutil.cpu_count(), 'physical_cpus': psutil.cpu_count(logical=False),
        'ram_gib': psutil.virtual_memory().total / 2**30,
        'python': platform.python_version(), 'node': subprocess.check_output(['node', '--version'], text=True).strip(),
        'locust': importlib.metadata.version('locust'), 'psutil': importlib.metadata.version('psutil'),
        'git_head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'working_tree_dirty': bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True)),
        'scope': 'Localhost; generator and backend share host; one Node process, embedded SQLite; no container',
        'application_contract': '2026-11-09',
        'sampling_seconds': 1,
        'io_scope': 'Host-wide disk and NIC counters; other processes included; NIC counters may exclude localhost',
        'query_scope': 'Statement get/all/run execution incl. binding and result materialization; excludes prepare and HTTP queue time',
    })
    results = []
    for users in args.users:
        results.append(run_stage(directory / f'users-{users}', users, args))
        save(directory / 'summary.json', results)
    print(f'REPORTS {directory}', flush=True)


if __name__ == '__main__':
    main()

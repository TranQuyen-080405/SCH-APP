"""One account/session per virtual user; task weights describe business actions."""
import itertools
import json
import os
import time
from pathlib import Path

import gevent
from locust import HttpUser, between, events, task
from locust.exception import StopUser

ACCOUNT_IDS = itertools.count(1)
READY = 0
SETUP_FAILURES = 0


class ApplicationUser(HttpUser):
    wait_time = between(1, 3)

    def request(self, method, path, status=200, key=None, name=None, **kwargs):
        with self.client.request(method, path, name=name or f"{method} {path}",
                                 catch_response=True, timeout=30, **kwargs) as response:
            if response.status_code != status:
                response.failure(f"Expected {status}; HTTP {response.status_code}")
                return None
            if key is None:
                return True
            try:
                value = response.json()[key]
                if not isinstance(value, (dict, list)):
                    raise ValueError("Unexpected response shape")
                return value
            except (ValueError, KeyError):
                response.failure(f"Invalid JSON or missing {key}")
                return None

    def on_start(self):
        global READY, SETUP_FAILURES
        account_id = next(ACCOUNT_IDS)
        user = self.request('POST', '/api/auth/login', key='user', json={
            'email': f'bench-{account_id}@example.test', 'password': 'Benchmark-password-123'})
        tasks = self.request('GET', '/api/tasks', key='tasks') if user else None
        if not tasks:
            SETUP_FAILURES += 1
            raise StopUser()
        self.task_id = tasks[0]['id']
        READY += 1

    @task(6)
    def list_tasks(self):
        self.request('GET', '/api/tasks?sort=deadline&order=asc', key='tasks',
                     name='GET /api/tasks [sort]')

    @task(3)
    def filtered_tasks(self):
        self.request('GET', '/api/tasks?status=done&priority=high', key='tasks',
                     name='GET /api/tasks [filter]')

    @task(3)
    def dashboard(self):
        self.request('GET', '/api/dashboard', key='dashboard',
                     name='GET /api/dashboard [7d]')

    @task(2)
    def projects(self):
        self.request('GET', '/api/projects', key='projects')

    @task(2)
    def notes(self):
        self.request('GET', '/api/notes', key='notes')

    @task(1)
    def profile(self):
        self.request('GET', '/api/auth/me', key='user')

    @task(2)
    def update_task(self):
        self.request('PATCH', f'/api/tasks/{self.task_id}', key='task',
                     name='PATCH /api/tasks/:id', json={'status': 'doing'})

    @task(1)
    def task_lifecycle(self):
        value = self.request('POST', '/api/tasks', status=201, key='task',
                             json={'title': 'Temporary benchmark task', 'priority': 'low'})
        if value:
            self.request('DELETE', f"/api/tasks/{value['id']}", status=204,
                         name='DELETE /api/tasks/:id')


@events.init.add_listener
def configure_measurement(environment, **kwargs):
    """The CLI's run-time is a safety limit; this controls the steady-state window."""
    if not os.environ.get('PTM_MARKER_DIR'):
        return
    directory = Path(os.environ['PTM_MARKER_DIR'])
    target = int(os.environ['PTM_USERS'])

    def measure():
        deadline = time.monotonic() + target / float(os.environ['PTM_SPAWN_RATE']) + 180
        while READY < target:
            if SETUP_FAILURES or time.monotonic() > deadline:
                (directory / 'invalid.json').write_text(json.dumps({
                    'ready': READY, 'expected': target, 'setup_failures': SETUP_FAILURES}))
                environment.process_exit_code = 2
                environment.runner.quit()
                return
            gevent.sleep(.2)
        gevent.sleep(float(os.environ['PTM_WARMUP_SECONDS']))
        environment.stats.reset_all()
        environment.stats.errors.clear()
        (directory / 'measurement-start.json').write_text(json.dumps({
            'epoch': time.time(), 'ready': READY, 'setup_failures': SETUP_FAILURES}))
        gevent.sleep(float(os.environ['PTM_MEASURE_SECONDS']))
        environment.runner.stop()
        (directory / 'measurement-end.json').write_text(json.dumps({'epoch': time.time()}))
        environment.runner.quit()

    gevent.spawn(measure)

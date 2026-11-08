"""Filter completed benchmark evidence into the concise QA LaTeX section."""
import csv
import json
import math
import sys
from pathlib import Path


def main():
    folder = Path(sys.argv[1]).resolve()
    data = json.loads((folder / 'summary.json').read_text(encoding='utf-8'))
    environment = json.loads((folder / 'environment.json').read_text(encoding='utf-8'))
    assert [row['users'] for row in data] == [100, 300, 500, 1000], 'Four completed stages required'
    for row in data:
        assert row['requests'] > 0 and 0 <= row['failures'] <= row['requests']
        assert row['duration_seconds'] >= 300, 'Do not report a short smoke test as a full run'
        assert row['p50_ms'] <= row['p95_ms'] <= row['p99_ms']
        assert math.isclose(row['error_percent'], row['failures'] / row['requests'] * 100)
        assert row['database']['queries'] > 0 and row['database']['connections'] == 1
        with (folder / f'users-{row["users"]}' / 'locust_stats.csv').open(encoding='utf-8', newline='') as source:
            entries = list(csv.DictReader(source))
        individual = [entry for entry in entries if entry['Name'] != 'Aggregated']
        assert sum(int(entry['Request Count']) for entry in individual) == row['requests']
        assert sum(int(entry['Failure Count']) for entry in individual) == row['failures']
        assert len([entry for entry in individual if int(entry['Request Count']) > 0]) == 9
        start = json.loads((folder / f'users-{row["users"]}' / 'measurement-start.json').read_text())
        assert start['ready'] == row['users'] and start['setup_failures'] == 0
    def table(headers, rows, columns):
        return '\n'.join([
            r'\begin{center}\small',
            r'\setlength{\tabcolsep}{3pt}',
            r'\begin{tabular}{@{}' + columns + r'@{}}', r'\toprule',
            ' & '.join(r'\textbf{' + h + '}' for h in headers) + r' \\', r'\midrule',
            *[' & '.join(row) + r' \\' for row in rows],
            r'\bottomrule', r'\end{tabular}', r'\end{center}',
        ])
    def num(value, digits=2):
        return '--' if value is None else f'{value:.{digits}f}'
    lines = [r'\subsection{Kiểm thử hiệu năng}',
        f"Ngày đo: {data[0]['start_local'][:10]}; Locust {environment['locust']}.",
        r'Mỗi mức đặt thời gian đo 300 giây; chờ tối đa 5 giây để request dở dang kết thúc. '
        r'Cột giây ghi thời gian thực tế, gồm phần chờ kết thúc. Không tính đăng nhập và warm-up.',
        r'P50/P95/P99 là phân vị latency (ms), được Locust làm tròn theo histogram.',
        r'\subsubsection*{A. Application performance}',
        table(['Users', 'Giây', 'Requests', 'RPS', 'TB (ms)', 'P50', 'P95', 'P99', r'Lỗi (\%)'],
              [[str(r['users']), num(r['duration_seconds']), str(r['requests']), num(r['rps']), num(r['avg_ms']),
                num(r['p50_ms'], 0), num(r['p95_ms'], 0), num(r['p99_ms'], 0),
                num(r['error_percent'])] for r in data], 'rrrrrrrrr'),
        'Ở 1.000 users, P95 là ' + num(data[-1]['p95_ms'], 0) + ' ms, so với '
        + num(data[0]['p95_ms'], 0) + ' ms ở 100 users. '
        + 'Tổng số request lỗi trong bốn mức tải: ' + str(sum(r['failures'] for r in data)) + '.',
        r'\subsubsection*{B. Infrastructure performance}',
        table(['Users', r'CPU TB/đỉnh (\%)', 'RSS TB/đỉnh (MiB)', r'CPU máy TB (\%)'],
              [[str(r['users']), num(r['server_cpu_percent_one_core_avg']) + '/' + num(r['server_cpu_percent_one_core_max']),
                num(r['server_rss_mib_avg']) + '/' + num(r['server_rss_mib_max']),
                num(r['host_cpu_percent_avg'])] for r in data], 'rrrr'),
        r'CPU/RSS thuộc tiến trình Node (gồm SQLite); CPU 100\% tương đương một logical CPU.',
        table(['Users', 'Disk đọc/ghi (KiB/s)', 'NIC nhận/gửi (KiB/s)'],
              [[str(r['users']), num(r['disk_read_bytes_kib_s']) + '/' + num(r['disk_write_bytes_kib_s']),
                num(r['network_bytes_recv_kib_s']) + '/' + num(r['network_bytes_sent_kib_s'])]
               for r in data], 'rrr'),
        r'Disk/NIC là trung bình toàn máy, gồm tiến trình khác; NIC có thể không đếm localhost.',
        r'Không coi NIC là băng thông API. Container CPU/RAM: chưa đo (Docker daemon không chạy).',
        r'\subsubsection*{C. Database performance}',
        table(['Users', 'Queries', 'TB (ms)', 'P95 (ms)', 'P99 (ms)', r'Chậm $\geq$100 ms'],
              [[str(r['users']), str(r['database']['queries']), num(r['database']['avg_ms'], 3),
                num(r['database']['p95_ms'], 3), num(r['database']['p99_ms'], 3),
                str(r['database']['slow_count'])] for r in data], 'rrrrrr'),
        r'SQLite dùng một kết nối chia sẻ; connection pool và CPU/RAM database riêng: không áp dụng.',
        r'Query latency đo thực thi statement và trả kết quả; không gồm prepare, hàng đợi HTTP.',
        r'Ngưỡng slow query 100 ms chỉ phục vụ thống kê, chưa phải tiêu chuẩn nghiệm thu.',
        r'\paragraph{Giới hạn đo.}',
        r'Máy sinh tải dùng chung máy với server; số liệu chịu ảnh hưởng tải nền và instrumentation.',
        'CPU toàn máy trung bình giữa các mức tải nằm trong khoảng '
        + num(min(r['host_cpu_percent_avg'] for r in data)) + r'--'
        + num(max(r['host_cpu_percent_avg'] for r in data)) + r'\%; '
        + 'RAM toàn máy trung bình ' + num(min(r['host_memory_percent_avg'] for r in data))
        + r'--' + num(max(r['host_memory_percent_avg'] for r in data)) + r'\%. '
        + r'Tải nền thay đổi nên latency không nhất thiết tăng theo số users.',
        r'Chưa kiểm thử production, container, trình duyệt hoặc tải đăng nhập đồng thời.',
        r'Không dùng kết quả localhost để cam kết năng lực production.',
        r'\paragraph{Dữ liệu đối chiếu.}',
        r'Báo cáo HTML/CSV, mẫu CPU/RAM mỗi giây và query metrics:',
        r'\texttt{performance-test/reports/}\allowbreak\texttt{' + folder.name + r'/}.',
        r'Test chức năng: \texttt{latex/QA-test/evidence/}.',
    ]
    target = Path(__file__).resolve().parents[1] / 'latex/QA-test/chapters/performance-results.tex'
    if environment.get('application_contract') != '2026-11-09':
        lines.insert(1, r'\textbf{Kết quả lịch sử trước refactor 09/11/2026.} '
                     r'Chưa đo lại bốn mức tải cho phiên bản hiện tại; không dùng các số này để nghiệm thu bản mới.')
    target.write_text('\n\n'.join(lines) + '\n', encoding='utf-8')
    print(target)


if __name__ == '__main__':
    main()

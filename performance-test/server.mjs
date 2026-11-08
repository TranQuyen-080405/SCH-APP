// Instrumentation belongs only to this local benchmark launcher.
import fs from 'node:fs';
import readline from 'node:readline';
import { performance } from 'node:perf_hooks';
import { getDb, closeDb } from '../server/src/db/connection.js';
import { hashPassword } from '../server/src/services/password.js';

if (!process.env.DATABASE_PATH || fs.existsSync(process.env.DATABASE_PATH)) {
  throw new Error('Benchmark requires a new, isolated DATABASE_PATH');
}
const db = getDb();
const hash = await hashPassword('Benchmark-password-123');
const users = Number(process.env.PTM_USERS);
const insertUser = db.prepare('INSERT INTO users(email,password_hash) VALUES (?,?)');
const insertProject = db.prepare('INSERT INTO projects(user_id,name) VALUES (?,?)');
const insertTask = db.prepare(`INSERT INTO tasks
  (user_id,project_id,title,description,deadline,priority,status,completed_at)
  VALUES (?,?,?,?,?,?,?,?)`);
const insertNote = db.prepare('INSERT INTO notes(user_id,title,content,noted_on) VALUES (?,?,?,?)');
db.transaction(() => {
  for (let i = 1; i <= users; i++) {
    const id = Number(insertUser.run(`bench-${i}@example.test`, hash).lastInsertRowid);
    const projects = Array.from({length: 3}, (_, n) =>
      Number(insertProject.run(id, `Project ${n + 1}`).lastInsertRowid));
    for (let n = 0; n < 20; n++) {
      const status = ['todo', 'doing', 'done'][n % 3];
      insertTask.run(id, projects[n % 3], `Task ${n + 1}`, 'Benchmark fixture',
        `2026-11-${String(n + 1).padStart(2, '0')}`, ['low', null, 'high'][n % 3],
        status, status === 'done' ? '2026-11-08T03:00:00.000Z' : null);
    }
    for (let n = 0; n < 5; n++) insertNote.run(id, `Note ${n + 1}`, 'Benchmark fixture', '2026-11-08');
  }
})();

let durations = [];
let slowQueries = new Map();
let started = performance.now();
const originalPrepare = db.prepare;
db.prepare = function (sql) {
  const statement = originalPrepare.call(this, sql);
  for (const method of ['get', 'all', 'run']) {
    const original = statement[method];
    statement[method] = function (...args) {
      const start = performance.now();
      try { return original.apply(this, args); }
      finally {
        const ms = performance.now() - start;
        durations.push(ms);
        if (ms >= 100) {
          const key = sql.replace(/\s+/g, ' ').trim();
          const value = slowQueries.get(key) || {count: 0, max_ms: 0};
          value.count++;
          value.max_ms = Math.max(value.max_ms, ms);
          slowQueries.set(key, value);
        }
      }
    };
  }
  return statement;
};

const { default: app } = await import('../server/src/app.js');
const server = app.listen(Number(process.env.PORT), '127.0.0.1', () => {
  console.log(JSON.stringify({ready: true, pid: process.pid, users,
    sqlite_version: db.prepare('SELECT sqlite_version() AS version').get().version,
    journal_mode: db.pragma('journal_mode', {simple: true})}));
});
readline.createInterface({input: process.stdin}).on('line', line => {
  const command = JSON.parse(line);
  if (command.action === 'reset') {
    durations = [];
    slowQueries = new Map();
    started = performance.now();
  } else if (command.action === 'snapshot') {
    const elapsed = (performance.now() - started) / 1000;
    const sorted = durations.toSorted((a, b) => a - b);
    const percentile = p => sorted.length ? sorted[Math.ceil(p * sorted.length) - 1] : null;
    fs.writeFileSync(command.path, JSON.stringify({
      duration_seconds: elapsed, queries: sorted.length,
      avg_ms: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : null,
      p50_ms: percentile(.5), p95_ms: percentile(.95), p99_ms: percentile(.99),
      max_ms: sorted.at(-1) ?? null, slow_threshold_ms: 100,
      slow_count: [...slowQueries.values()].reduce((n, v) => n + v.count, 0),
      slow_queries: [...slowQueries].map(([sql, value]) => ({sql, ...value})),
      connections: 1, connection_pool: null,
    }, null, 2));
  } else if (command.action === 'stop') {
    server.close(() => { closeDb(); process.exit(0); });
  }
});

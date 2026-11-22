#!/usr/bin/env node
/**
 * Libera los puertos de desarrollo (API 3000 y Metro 8081).
 * Útil cuando se cerró la terminal a lo bruto y los procesos quedaron vivos.
 * Funciona en Windows (netstat + taskkill) y en macOS/Linux (lsof + kill).
 */
import { execFileSync } from 'node:child_process';

const PORTS = [3000, 8081];
const ATTEMPTS = 3;
const isWindows = process.platform === 'win32';

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function listeners(port) {
  try {
    if (isWindows) {
      const out = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
      const pids = out.split(/\r?\n/).flatMap((line) => {
        const cols = line.trim().split(/\s+/);
        if (cols.length < 5 || cols[3] !== 'LISTENING') return [];
        return cols[1].endsWith(`:${port}`) ? [cols[4]] : [];
      });
      return [...new Set(pids)];
    }

    const out = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
    });
    return [...new Set(out.split(/\s+/).filter(Boolean))];
  } catch {
    return [];
  }
}

function kill(pid) {
  try {
    if (isWindows) {
      // /T incluye los hijos del proceso (watchers, bundlers).
      execFileSync('taskkill', ['/F', '/T', '/PID', pid], { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGTERM');
    }
    return true;
  } catch {
    return false;
  }
}

let killed = 0;

for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
  const found = PORTS.flatMap((port) => listeners(port).map((pid) => ({ port, pid })));

  if (found.length === 0) break;

  for (const { port, pid } of found) {
    const ok = kill(pid);
    console.log(`${ok ? 'terminado' : 'no se pudo terminar'}  puerto ${port}  pid ${pid}`);
    if (ok) killed += 1;
  }

  sleep(1500);
}

const left = PORTS.flatMap((port) => listeners(port).map((pid) => `:${port} (pid ${pid})`));

if (left.length > 0) {
  console.error(`Siguen ocupados: ${left.join(', ')}. Revisa el administrador de tareas.`);
  process.exit(1);
}

console.log(
  killed === 0
    ? 'Nada que parar: 3000 y 8081 ya estaban libres.'
    : `Listo: ${killed} proceso(s) terminado(s). 3000 y 8081 libres.`,
);

#!/usr/bin/env node
/**
 * Levanta API y cliente en paralelo durante el desarrollo.
 * Uso: npm run dev
 */
import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['run', 'dev', '-w', '@mapatianguis/api'], { stdio: 'inherit' }),
  spawn(npm, ['run', 'dev', '-w', '@mapatianguis/web'], { stdio: 'inherit' })
];

let stopping = false;

function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!stopping) {
      stop();
      process.exitCode = code ?? 1;
    }
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stop(signal);
    setTimeout(() => process.exit(0), 200);
  });
}

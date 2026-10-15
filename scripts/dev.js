import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { freePortIfStale } from './run-backend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'backend');

/**
 * Checks if FastAPI backend is already responsive on port 8000.
 */
function isBackendHealthy(port = 8000, timeout = 2000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Kills process and all its children across platforms (using taskkill on Windows).
 */
function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-proc.pid, 'SIGKILL');
    }
  } catch {}
}

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
  console.log('\x1b[36m%s\x1b[0m', '  TamilOCRGOV v2.4 — Combined Development Environment Runner  ');
  console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');

  let backendProc = null;
  let frontendProc = null;
  let isShuttingDown = false;

  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n\x1b[33m[TamilOCR] Shutting down frontend and backend processes...\x1b[0m');
    killProcessTree(frontendProc);
    killProcessTree(backendProc);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);

  // 1. Check or start Python backend
  const backendAlreadyHealthy = await isBackendHealthy(8000);
  if (backendAlreadyHealthy) {
    console.log('\x1b[32m[TamilOCR]\x1b[0m Backend already active and responsive on http://127.0.0.1:8000');
  } else {
    // Ensure port 8000 is free of any stale zombie processes
    freePortIfStale(8000);

    console.log('\x1b[33m[TamilOCR]\x1b[0m Starting Python inference backend on port 8000...');
    const runnerScript = path.resolve(__dirname, 'run-backend.js');
    backendProc = spawn(process.execPath, [runnerScript], {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, PYTHONUNBUFFERED: '1', TAMILOCR_MANAGED_BY_DEV_RUNNER: '1' }
    });

    backendProc.stdout.on('data', (data) => {
      process.stdout.write(`\x1b[33m[Backend]\x1b[0m ${data}`);
    });

    backendProc.stderr.on('data', (data) => {
      process.stderr.write(`\x1b[33m[Backend]\x1b[0m ${data}`);
    });

    backendProc.on('error', (err) => {
      console.error('\x1b[31m[Backend Error]\x1b[0m', err);
    });

    backendProc.on('exit', (code) => {
      if (!isShuttingDown && code !== 0) {
        console.warn(`\x1b[33m[Backend]\x1b[0m Exited with code ${code}`);
      }
    });

    // Wait up to 25 seconds for backend to become healthy
    let attempts = 0;
    while (attempts < 50) {
      await new Promise(r => setTimeout(r, 500));
      if (await isBackendHealthy(8000, 1000)) {
        console.log('\x1b[32m[TamilOCR]\x1b[0m Backend health verified on http://127.0.0.1:8000/api/health');
        break;
      }
      attempts++;
    }
    if (attempts >= 50) {
      console.warn('\x1b[33m[TamilOCR]\x1b[0m Warning: Backend warmup took longer than 25s, proceeding to start frontend...');
    }
  }

  // 2. Start Frontend (Vite)
  console.log('\x1b[36m[TamilOCR]\x1b[0m Starting Vite frontend dev server...');
  const viteBin = path.resolve(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  if (fs.existsSync(viteBin)) {
    frontendProc = spawn(process.execPath, [viteBin], {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, PORT: process.env.PORT || '3000', TAMILOCR_MANAGED_BY_DEV_RUNNER: '1' }
    });
  } else {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    frontendProc = spawn(npxCmd, ['vite'], {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: { ...process.env, PORT: process.env.PORT || '3000', TAMILOCR_MANAGED_BY_DEV_RUNNER: '1' }
    });
  }

  frontendProc.stdout.on('data', (data) => {
    process.stdout.write(`\x1b[36m[Frontend]\x1b[0m ${data}`);
  });

  frontendProc.stderr.on('data', (data) => {
    process.stderr.write(`\x1b[36m[Frontend]\x1b[0m ${data}`);
  });

  frontendProc.on('error', (err) => {
    console.error('\x1b[31m[Frontend Error]\x1b[0m', err);
  });

  frontendProc.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`\x1b[36m[Frontend]\x1b[0m Vite server stopped (code ${code})`);
      shutdown();
    }
  });
}

main().catch((err) => {
  console.error('[TamilOCR Runner Error]', err);
  process.exit(1);
});

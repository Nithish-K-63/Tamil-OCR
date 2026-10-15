import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'backend');

/**
 * Discovers the Python executable that has PyTorch and required packages installed.
 * Prioritizes Python 3.12 where torch is installed over Python 3.14 preview/unsupported releases.
 */
export function getPythonCommand() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = [
    process.env.PYTHON_PATH,
    path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
    path.resolve(rootDir, '.venv', 'Scripts', 'python.exe'),
    path.resolve(rootDir, 'venv', 'Scripts', 'python.exe'),
    path.resolve(rootDir, '.venv', 'bin', 'python'),
    path.resolve(rootDir, 'venv', 'bin', 'python'),
    'py -3.12',
    'python3.12',
    'python',
    'python3',
  ].filter(Boolean);

  for (const cand of candidates) {
    try {
      if (cand.includes(path.sep) && !fs.existsSync(cand)) {
        continue;
      }
      const testCmd = cand.startsWith('py ')
        ? `${cand} -c "import uvicorn"`
        : `"${cand}" -c "import uvicorn"`;
      execSync(testCmd, { stdio: 'ignore', timeout: 15000 });
      return cand;
    } catch {
      // Cand doesn't exist or uvicorn failed to import
    }
  }

  return process.platform === 'win32' ? 'py -3.12' : 'python3';
}

export function parsePythonExecutable(cmd) {
  if (cmd.startsWith('py ')) {
    const parts = cmd.split(' ');
    return {
      exec: parts[0],
      initialArgs: parts.slice(1),
    };
  }
  return {
    exec: cmd,
    initialArgs: [],
  };
}

import http from 'node:http';

function isPortActive(port = 8000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

export function freePortIfStale(port = 8000) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1]?.trim();
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          try {
            execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
            console.log(`[TamilOCR] Cleared stale process PID ${pid} on port ${port}`);
          } catch {}
        }
      }
    } catch {}
  }
}

// When executed directly (e.g., via `npm run backend`)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  (async () => {
    const active = await isPortActive(8000);
    if (active) {
      console.log('[TamilOCR] Inference backend already active and healthy on http://127.0.0.1:8000');
      // If run standalone, keep process alive so caller can monitor or press Ctrl+C
      process.stdin.resume();
      const exitHandler = () => process.exit(0);
      process.on('SIGINT', exitHandler);
      process.on('SIGTERM', exitHandler);
      return;
    }

    // Ensure port 8000 is not held by a stale non-responsive process
    freePortIfStale(8000);

    const selectedPython = getPythonCommand();
    console.log(`[TamilOCR] Starting backend with Python: ${selectedPython}`);

    const { exec, initialArgs } = parsePythonExecutable(selectedPython);
    const args = [
      ...initialArgs,
      '-m',
      'uvicorn',
      'app.main:app',
      '--host',
      '127.0.0.1',
      '--port',
      '8000',
      '--reload',
      '--reload-dir',
      'app',
    ];

    const child = spawn(exec, args, {
      cwd: backendDir,
      stdio: 'inherit',
      shell: false,
    });

    const cleanup = () => {
      if (child && child.pid) {
        try {
          if (process.platform === 'win32') {
            execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
          } else {
            child.kill('SIGTERM');
          }
        } catch {}
      }
    };

    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });

    child.on('error', (err) => {
      console.error('[TamilOCR] Failed to start backend:', err);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code ?? 0);
    });
  })();
}

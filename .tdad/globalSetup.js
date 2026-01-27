// @ts-check
// TDAD Global Setup - Starts dev server in visible window if not already running

const { spawn } = require('child_process');
const http = require('http');

const SERVER_URL = 'http://localhost:3000';
const PROJECT_ROOT = 'D:\\source\\repos\\zekeriyademir\\IsItJustMe';

/**
 * Check if server is responding on the given URL
 */
async function isServerRunning(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url, maxAttempts = 60, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const running = await isServerRunning(url);
    if (running) {
      return true;
    }
    console.log(`Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * Start server in a new visible CMD window (detached)
 */
function startServerInNewWindow() {
  console.log('Starting dev server in new window...');

  // Use 'start' command to open a new CMD window
  // The new window runs npm run dev and stays open
  const child = spawn('cmd', ['/c', 'start', 'cmd', '/k',
    `cd /d ${PROJECT_ROOT} && title IsItJustMe Dev Server && npm run dev`
  ], {
    detached: true,
    stdio: 'ignore',
    shell: true
  });

  // Unref so the parent process can exit independently
  child.unref();
}

/**
 * Global setup function called by Playwright before tests
 */
async function globalSetup() {
  console.log('Checking if dev server is running...');

  const alreadyRunning = await isServerRunning(SERVER_URL);

  if (alreadyRunning) {
    console.log('Server is already running. Leaving it untouched.');
    return;
  }

  console.log('Server is not running. Starting in new window...');
  startServerInNewWindow();

  // Wait for server to be ready
  const ready = await waitForServer(SERVER_URL);

  if (!ready) {
    throw new Error('Server failed to start within timeout period');
  }

  console.log('Server is ready!');
}

module.exports = globalSetup;

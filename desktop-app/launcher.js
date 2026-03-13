const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const BACKEND_PORT = 0; // 0 means random available port
const BACKEND_PATH = path.join(__dirname, 'backend', 'llmfit-backend.exe');

let backendProcess = null;

function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting LLMFit backend...');
    
    backendProcess = spawn(BACKEND_PATH, ['--port', '0'], {
      stdio: 'pipe',
      windowsHide: true
    });

    let port = null;
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Backend:', output);
      
      // Try to extract port from output
      const portMatch = output.match(/port\s+(\d+)/i) || output.match(/:(\d+)/);
      if (portMatch && !port) {
        port = parseInt(portMatch[1]);
        console.log(`Backend started on port ${port}`);
        resolve(port);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('Backend error:', data.toString());
    });

    backendProcess.on('error', (err) => {
      reject(err);
    });

    // Fallback: try default port after 3 seconds
    setTimeout(() => {
      if (!port) {
        port = 8000;
        console.log(`Assuming backend on default port ${port}`);
        resolve(port);
      }
    }, 3000);
  });
}

function waitForBackend(port) {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(checkInterval);
          console.log('Backend is ready!');
          resolve();
        }
      }).on('error', () => {
        // Backend not ready yet, keep waiting
      });
    }, 500);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Backend failed to start within 30 seconds'));
    }, 30000);
  });
}

function openBrowser(port) {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Opening browser: ${url}`);
  
  const { exec } = require('child_process');
  exec(`start ${url}`);
}

async function main() {
  try {
    const port = await startBackend();
    await waitForBackend(port);
    openBrowser(port);
    
    console.log('LLMFit is running. Press Ctrl+C to stop.');
    
    // Keep the script running
    process.stdin.resume();
    
    // Handle cleanup
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      if (backendProcess) {
        backendProcess.kill();
      }
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      if (backendProcess) {
        backendProcess.kill();
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start LLMFit:', error);
    process.exit(1);
  }
}

main();

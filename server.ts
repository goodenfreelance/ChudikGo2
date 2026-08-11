import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { spawn, ChildProcess, execSync } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3000;
const GO_PORT = process.env.GO_PORT || '8089';

let goProcess: ChildProcess | null = null;

function killExistingGoServer() {
  try {
    execSync('pkill -9 -f go-server || true', { stdio: 'ignore' });
  } catch (e) {
    // ignore
  }
}

function startGoBackend() {
  killExistingGoServer();

  const goBinPath = path.join(process.cwd(), 'dist', 'go-server');
  console.log(`[Node Server] Launching Go Backend from ${goBinPath} on port ${GO_PORT}...`);

  goProcess = spawn(goBinPath, [], {
    env: { ...process.env, GO_PORT: String(GO_PORT) },
    stdio: 'inherit',
  });

  goProcess.on('error', (err) => {
    console.error('[Node Server] Failed to start Go process:', err);
  });

  goProcess.on('exit', (code, signal) => {
    console.log(`[Node Server] Go process exited with code ${code}, signal ${signal}.`);
  });
}

// Ensure child processes are terminated when Node exits
process.on('exit', () => {
  if (goProcess) {
    try { goProcess.kill('SIGKILL'); } catch (e) {}
  }
  killExistingGoServer();
});

process.on('SIGINT', () => {
  if (goProcess) {
    try { goProcess.kill('SIGKILL'); } catch (e) {}
  }
  killExistingGoServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (goProcess) {
    try { goProcess.kill('SIGKILL'); } catch (e) {}
  }
  killExistingGoServer();
  process.exit(0);
});

async function startServer() {
  // Start Go Server executable
  startGoBackend();

  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Proxy /api/go to Go backend
  const apiProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${GO_PORT}`,
    changeOrigin: true,
    pathRewrite: { '^/api/go': '' },
  });

  app.use('/api/go', apiProxy);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      nodeServer: 'running',
      goPort: GO_PORT,
    });
  });

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Handle WebSockets with ws WebSocketServer
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/ws')) {
      wss.handleUpgrade(req, socket, head, (clientWs) => {
        const goUrl = `ws://127.0.0.1:${GO_PORT}${req.url}`;
        const goWs = new WebSocket(goUrl);

        const pendingMessages: Array<{ data: any; isBinary: boolean }> = [];

        clientWs.on('message', (data, isBinary) => {
          if (goWs.readyState === WebSocket.OPEN) {
            goWs.send(data, { binary: isBinary });
          } else if (goWs.readyState === WebSocket.CONNECTING) {
            pendingMessages.push({ data, isBinary });
          }
        });

        goWs.on('open', () => {
          while (pendingMessages.length > 0) {
            const msg = pendingMessages.shift();
            if (msg && goWs.readyState === WebSocket.OPEN) {
              goWs.send(msg.data, { binary: msg.isBinary });
            }
          }
        });

        goWs.on('message', (data, isBinary) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data, { binary: isBinary });
          }
        });

        clientWs.on('close', () => {
          if (goWs.readyState === WebSocket.OPEN || goWs.readyState === WebSocket.CONNECTING) {
            try { goWs.close(); } catch (e) {}
          }
        });
        goWs.on('close', () => {
          if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
            try { clientWs.close(); } catch (e) {}
          }
        });
        clientWs.on('error', () => {
          try { goWs.close(); } catch (e) {}
        });
        goWs.on('error', () => {
          try { clientWs.close(); } catch (e) {}
        });
      });
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Unified App Server listening on http://0.0.0.0:${PORT}`);
    console.log(`🔗 WebSockets proxied to Go backend at ws://127.0.0.1:${GO_PORT}/ws`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
});


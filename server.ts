import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const sessions = new Map<string, any>();
  const sessionTimeouts = new Map<string, NodeJS.Timeout>();

  const cleanupSession = (sessionId: string) => {
    console.log(`Cleaning up session: ${sessionId}`);
    sessions.delete(sessionId);
    sessionTimeouts.delete(sessionId);
    broadcastPublicSessions();
  };

  const broadcastPublicSessions = () => {
    const publicSessions = Array.from(sessions.entries())
      .filter(([_, s]) => s.status === 'waiting')
      .map(([id, s]) => ({
        id,
        subject: s.subject,
        hostName: s.hostName || 'অজানা শিক্ষার্থী'
      }));
    
    const msg = JSON.stringify({ type: 'PUBLIC_SESSIONS', sessions: publicSessions });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  };

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    broadcastPublicSessions();

    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, sessionId, payload } = message;

        console.log(`Received message: ${type} for session: ${sessionId}`);

        // Clear any cleanup timeout if host/guest reconnects
        if (sessionId && sessionTimeouts.has(sessionId)) {
          clearTimeout(sessionTimeouts.get(sessionId)!);
          sessionTimeouts.delete(sessionId);
        }

        switch (type) {
          case 'CREATE_SESSION':
            sessions.set(sessionId, { 
              ...payload, 
              host: ws, 
              status: 'waiting',
              hostName: payload.hostName || 'অজানা শিক্ষার্থী'
            });
            ws.send(JSON.stringify({ type: 'SESSION_CREATED', sessionId }));
            broadcastPublicSessions();
            break;
          case 'JOIN_SESSION':
            const session = sessions.get(sessionId);
            console.log(`Join attempt for session: ${sessionId}. Found: ${!!session}`);
            if (session) {
              // Update guest or host reference if they are reconnecting
              if (session.status === 'waiting' || session.status === 'active') {
                // If it's a new connection, it's the guest
                session.guest = ws;
                session.status = 'active';
                
                const startMsg = JSON.stringify({ 
                  type: 'BATTLE_START', 
                  payload: { 
                    questions: session.questions, 
                    subject: session.subject,
                    sessionId: sessionId 
                  } 
                });
                
                console.log(`Starting battle for session: ${sessionId}`);
                if (session.host && session.host.readyState === WebSocket.OPEN) {
                  session.host.send(startMsg);
                }
                if (session.guest && session.guest.readyState === WebSocket.OPEN) {
                  session.guest.send(startMsg);
                }
                broadcastPublicSessions();
              }
            } else {
              console.log(`Session not found: ${sessionId}`);
              ws.send(JSON.stringify({ 
                type: 'ERROR', 
                message: `ব্যাটেল কোড (${sessionId}) সঠিক নয় বা এটি শেষ হয়ে গেছে।` 
              }));
            }
            break;
          case 'UPDATE_SCORE':
            const s = sessions.get(sessionId);
            if (s) {
              const updateMsg = JSON.stringify({ type: 'SCORE_UPDATED', payload });
              if (s.host && s.host.readyState === WebSocket.OPEN) s.host.send(updateMsg);
              if (s.guest && s.guest.readyState === WebSocket.OPEN) s.guest.send(updateMsg);
            }
            break;
          case 'PING':
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Instead of immediate delete, wait 5 minutes
      for (const [id, s] of sessions.entries()) {
        if (s.host === ws || s.guest === ws) {
          const timeout = setTimeout(() => cleanupSession(id), 300000);
          sessionTimeouts.set(id, timeout);
        }
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // Fallback for SPA in dev mode if vite middleware misses it
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();

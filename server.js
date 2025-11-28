const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        });
        res.end();
        return;
      }
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["*"]
    },
    transports: ['websocket'], // Use websocket only to avoid XHR polling errors
    allowEIO3: true,
    pingTimeout: 20000,
    pingInterval: 10000,
    connectTimeout: 10000, // 10 second connection timeout
    maxHttpBufferSize: 1e6
  });

  // Make io instance available to API routes via global and process
  global.io = io;
  if (typeof process !== 'undefined') {
    process.io = io;
  }

  // Store user socket connections
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their user ID
    socket.on('join', (userId) => {
      socket.userId = userId;
      userSockets.set(userId, socket.id);
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined`);
    });

    // Handle sending messages (this is just for real-time updates, actual persistence happens in API route)
    socket.on('send-message', async (data) => {
      const { conversationId, senderId, content, messageId, createdAt, sender } = data;
      
      console.log('Received send-message event:', data);
      
      // Broadcast to all users in the conversation (including sender for confirmation)
      const messageData = {
        id: messageId || `temp-${Date.now()}`,
        conversationId,
        senderId,
        content,
        createdAt: createdAt || new Date().toISOString(),
        sender: sender || null,
      };
      
      io.to(`conversation:${conversationId}`).emit('new-message', messageData);
      console.log(`Broadcasted message to conversation:${conversationId}`, messageData);
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      const room = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}. Room now has ${room ? room.size : 0} socket(s)`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});


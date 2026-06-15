import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { parse } from 'cookie';
import prisma from './src/lib/prisma';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  
  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parse(socket.request.headers.cookie || '');
      const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];

      if (!sessionToken) {
        return next(new Error('Authentication error'));
      }

      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
      });

      if (!session || session.expires < new Date()) {
        return next(new Error('Authentication error'));
      }

      socket.data.user = {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      };
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Join a specific chat room
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`Socket ${socket.id} joined chat_${chatId}`);
    });

    // Handle typing indicators (collision prevention)
    socket.on('typing', ({ chatId }) => {
      socket.to(`chat_${chatId}`).emit('agent_typing', { agentName: socket.data.user.name });
    });

    socket.on('stop_typing', ({ chatId }) => {
      socket.to(`chat_${chatId}`).emit('agent_stop_typing');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Make io accessible to our Express routes if needed
  server.set('io', io);

  // Handle all other Next.js routes
  server.use((req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});

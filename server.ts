import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { getToken } from "next-auth/jwt";

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
      const token = await getToken({
        req: socket.request as any,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token) return next(new Error("Authentication error"));
      socket.data.user = {
        id: token.id,
        name: token.name,
        role: token.role,
        workspaceId: token.workspaceId,
      };
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Join a specific chat room
    socket.on('join_chat', async (chatId) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: {
            id: chatId,
            workspaceId: socket.data.user.workspaceId,
          }
        });
        
        if (contact) {
          socket.join(`chat_${chatId}`);
          console.log(`Socket ${socket.id} joined chat_${chatId}`);
        } else {
          console.log(`Socket ${socket.id} rejected from joining chat_${chatId}`);
        }
      } catch (error) {
        console.error('Error joining chat:', error);
      }
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

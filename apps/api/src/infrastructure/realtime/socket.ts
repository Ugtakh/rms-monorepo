import type { Server as HttpServer } from "http";
import type { JwtClaims } from "@rms/shared";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

let io: Server | null = null;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.APP_ORIGIN,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtClaims;
      socket.data.user = claims;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as JwtClaims;

    if (user.tenantId) {
      socket.join(`tenant:${user.tenantId}`);
    }

    if (user.branchId) {
      socket.join(`branch:${user.branchId}`);
    }
  });

  return io;
};

export const getIo = (): Server => {
  if (!io) {
    throw new Error("Socket not initialized");
  }

  return io;
};

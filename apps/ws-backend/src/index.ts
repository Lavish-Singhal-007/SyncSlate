import "./env";
import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({
  port: 8080,
});

interface UserSocket {
  socket: WebSocket;
  userId: string;
  rooms: number[];
}

interface DecodedToken extends JwtPayload {
  userId: string;
}

const users: UserSocket[] = [];

wss.on("connection", async (ws, request) => {
  try {
    const url = request.url;

    if (!url) {
      ws.close();
      return;
    }

    const queryParams = new URLSearchParams(url.split("?")[1]);

    const token = queryParams.get("token");

    if (!token) {
      ws.close();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    const userId = decoded.userId;

    if (!userId) {
      ws.close();
      return;
    }

    const currentUser: UserSocket = {
      socket: ws,
      userId,
      rooms: [],
    };

    users.push(currentUser);

    console.log(`Connected: ${userId}`);

    ws.on("message", async (data) => {
      try {
        const parsedData = JSON.parse(data.toString());

        // JOIN ROOM
        if (parsedData.type === "join_room") {
          currentUser.rooms.push(parsedData.roomId);

          ws.send(
            JSON.stringify({
              type: "joined",
              roomId: parsedData.roomId,
            }),
          );

          return;
        }

        // SEND CHAT
        if (parsedData.type === "chat") {
          const roomId = parsedData.roomId;
          const message = parsedData.message;

          const chat = await prismaClient.chat.create({
            data: {
              roomId,
              message,
              userId,
            },
          });

          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              user.socket.send(
                JSON.stringify({
                  type: "chat",
                  roomId,
                  message,
                  userId,
                  chatId: chat.id,
                  createdAt: chat.createdAt,
                }),
              );
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    ws.on("close", () => {
      const index = users.findIndex((u) => u.socket === ws);

      if (index !== -1) {
        users.splice(index, 1);
      }

      console.log(`Disconnected: ${userId}`);
    });
  } catch (err) {
    console.error(err);
    ws.close();
  }
});

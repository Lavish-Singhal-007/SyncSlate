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
          currentUser.rooms.push(Number(parsedData.roomId));

          ws.send(
            JSON.stringify({
              type: "joined",
              roomId: Number(parsedData.roomId),
            }),
          );

          return;
        }

        // SEND SHAPE
        if (parsedData.type === "shape") {
          const roomId = Number(parsedData.roomId);
          const shape = parsedData.shape;

          if (!currentUser.rooms.includes(roomId)) {
            return;
          }

          const currShape = await prismaClient.shape.upsert({
            where: {
              shapeId: shape.id,
            },
            update: {
              shape: shape,
            },
            create: {
              shapeId: shape.id,
              roomId: roomId,
              userId: userId,
              shape: shape,
            },
          });

          users.forEach((user) => {
            if (user.rooms.includes(roomId) && user.socket !== ws) {
              user.socket.send(
                JSON.stringify({
                  type: "shape",
                  roomId,
                  shape,
                  userId,
                  currShapeId: currShape.id,
                  createdAt: currShape.createdAt,
                }),
              );
            }
          });
        }

        // CLEAR BOARD
        if (parsedData.type === "clear") {
          const roomId = parsedData.roomId;
          if (!currentUser.rooms.includes(roomId)) {
            return;
          }

          await prismaClient.shape.deleteMany({
            where: {
              roomId,
            },
          });

          users.forEach((user) => {
            if (user.rooms.includes(roomId) && user.socket !== ws) {
              user.socket.send(
                JSON.stringify({
                  type: "clear",
                  roomId,
                }),
              );
            }
          });
        }

        // DELETE SHAPE
        if (parsedData.type === "deleteShape") {
          const shapeId = parsedData.shapeId;
          const roomId = parsedData.roomId;

          if (!currentUser.rooms.includes(roomId)) {
            return;
          }

          await prismaClient.shape.deleteMany({
            where: {
              shapeId,
            },
          });

          users.forEach((user) => {
            if (user.rooms.includes(roomId) && user.socket !== ws) {
              user.socket.send(
                JSON.stringify({
                  type: "deleteShape",
                  shapeId,
                }),
              );
            }
          });
        }

        // DRAG SHAPE
        if (parsedData.type === "dragShape") {
          const shapeId = parsedData.shapeId;
          const roomId = parsedData.roomId;
          const shape = parsedData.shape;

          if (!currentUser.rooms.includes(roomId)) {
            return;
          }

          await prismaClient.shape.update({
            where: {
              shapeId,
            },
            data: {
              shape,
            },
          });

          users.forEach((user) => {
            if (user.rooms.includes(roomId) && user.socket !== ws) {
              user.socket.send(
                JSON.stringify({
                  type: "dragShape",
                  shapeId,
                  shape,
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

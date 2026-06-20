import "./env";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";
import { CreateUserSchema, SigninSchema } from "@repo/common/config";
import { middleware } from "./middleware";
import cors from "cors";
import crypto from "crypto";
import { FRONTEND_URL, HTTP_PORT } from "./env";

const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    const data = CreateUserSchema.safeParse(req.body);

    if (!data.success) {
      return res.status(400).json({
        message: "Incorrect inputs",
      });
    }

    const { email, password, name } = data.data;

    const existingUser = await prismaClient.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prismaClient.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.json({
      message: "User created",
      userId: user.id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const data = SigninSchema.safeParse(req.body);

    if (!data.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const { email, password } = data.data;

    const user = await prismaClient.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(403).json({
        message: "Invalid credentials",
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      return res.status(403).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      token,
    });
  } catch (e) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/room", middleware, async (req, res) => {
  try {
    const slug = req.body.slug || crypto.randomUUID();

    const existingRoom = await prismaClient.room.findFirst({
      where: {
        slug,
        adminId: req.userId,
      },
    });

    if (existingRoom) {
      return res.status(409).json({
        message: "Room already exists",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const room = await prismaClient.room.create({
      data: {
        slug,
        adminId: req.userId,
      },
    });

    // Return the integer roomId for the frontend to route to
    res.json({
      roomId: room.id,
      slug: room.slug, // Returning the generated slug just in case you need it later
    });
  } catch (e) {
    res.status(500).json({
      message: "Could not create room",
    });
  }
});

app.get("/rooms", middleware, async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch all rooms where the user is the admin
    const rooms = await prismaClient.room.findMany({
      where: {
        adminId: req.userId,
      },
      orderBy: {
        createdAt: "desc", // Shows the newest boards first
      },
    });

    res.json({
      rooms: rooms.map((room) => ({
        id: room.id,
        slug: room.slug, // We are using the slug as the visual title
        thumbnail: room.thumbnail,
        createdAt: room.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Could not fetch rooms" });
  }
});

app.delete("/room/:roomId", middleware, async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);

    const room = await prismaClient.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    if (room.adminId !== req.userId) {
      return res.status(403).json({
        message: "Forbidden: You are not the admin of this room",
      });
    }

    await prismaClient.shape.deleteMany({
      where: {
        roomId: roomId,
      },
    });

    await prismaClient.room.delete({
      where: {
        id: roomId,
      },
    });

    res.json({
      message: "Room deleted successfully",
    });
  } catch (e) {
    console.error("Delete room error:", e);
    res.status(500).json({
      message: "Could not delete room",
    });
  }
});

app.get("/shapes/:roomId", middleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const user = await prismaClient.user.findUnique({
      where: {
        id: req.userId,
      },
      include: {
        rooms: true,
      },
    });

    // const hasAccess = user?.rooms.some((room) => room.id === Number(roomId));

    // if (!hasAccess) {
    //   return res.status(403).json({
    //     message: "Forbidden",
    //   });
    // }

    const shapes = await prismaClient.shape.findMany({
      where: {
        roomId: Number(roomId),
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(shapes);
  } catch (e) {
    res.status(500).json({
      message: "Could not fetch shapes",
    });
    console.log("Could not fetch shapes");
  }
});

app.put("/room/:roomId/thumbnail", middleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { thumbnail } = req.body;

    if (!thumbnail) {
      return res.status(400).json({
        message: "No thumbnail provided",
      });
    }

    // const user = await prismaClient.user.findUnique({
    //   where: {
    //     id: req.userId,
    //   },
    //   include: {
    //     rooms: true,
    //   },
    // });

    // const hasAccess = user?.rooms.some((room) => room.id === Number(roomId));

    // if (!hasAccess) {
    //   return res.status(403).json({
    //     message: "Forbidden",
    //   });
    // }

    await prismaClient.room.update({
      where: {
        id: Number(roomId),
      },
      data: {
        thumbnail,
      },
    });

    res.json({
      message: "Thumbnail updated",
    });
  } catch (e) {
    res.status(500).json({
      message: "Could not update thumbnail",
    });
  }
});

app.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`);
});

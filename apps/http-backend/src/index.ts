import "./env";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";
import { CreateUserSchema, SigninSchema } from "@repo/common/config";
import { middleware } from "./middleware";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
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
    const { slug } = req.body;

    const existingRoom = await prismaClient.room.findUnique({
      where: {
        slug,
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

    res.json({
      roomId: room.id,
    });
  } catch (e) {
    res.status(500).json({
      message: "Could not create room",
    });
  }
});

app.get("/chats/:roomId", middleware, async (req, res) => {
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

    const hasAccess = user?.rooms.some((room) => room.id === Number(roomId));

    if (!hasAccess) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const chats = await prismaClient.chat.findMany({
      where: {
        roomId: Number(roomId),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    res.json({
      chats: chats.reverse(),
    });
  } catch (e) {
    res.status(500).json({
      message: "Could not fetch chats",
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

    const shape = await prismaClient.shape.findMany();
    console.log(shape);

    res.json(shapes);
  } catch (e) {
    res.status(500).json({
      message: "Could not fetch shapes",
    });
    console.log("Could not fetch shapes");
  }
});

app.post("/shapes", async (req, res) => {
  try {
    console.log(req.body);

    const { roomId, shape } = req.body;

    const createdShape = await prismaClient.shape.create({
      data: {
        roomId,
        shape,
      },
    });

    res.json(createdShape);
  } catch (e) {
    console.error("POST /shapes error:", e);

    res.status(500).json({
      message: "Failed to create shape",
    });
  }
});

app.post("/clear", async (req, res) => {
  try {
    const { roomId } = req.body;

    await prismaClient.shape.deleteMany({
      where: {
        roomId,
      },
    });

    res.json({
      message: "Board cleared",
    });
  } catch (e) {
    console.error("POST /clear error:", e);

    res.status(500).json({
      message: "Failed to clear board",
    });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});

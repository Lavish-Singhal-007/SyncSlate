import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";
import { CreateUserSchema } from "@repo/common/config";
import { middleware } from "./middleware";

const app = express();

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
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

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

app.post("/room", middleware, async (req: any, res) => {
  try {
    const { slug } = req.body;

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

app.listen(3001, () => {
  console.log("Server running on port 3001");
});

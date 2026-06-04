import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface DecodedToken extends JwtPayload {
  userId: string;
}

export function middleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (!decoded.userId) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.userId = decoded.userId;

    next();
  } catch (err) {
    res.status(403).json({
      message: "Unauthorized",
    });
  }
}

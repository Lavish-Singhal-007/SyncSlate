import { Shape, Tool } from "./types";
import { getDistance } from "./geometry";

export function createShape(
  tool: Tool,
  startX: number,
  startY: number,
  currentWidth: number,
  currentHeight: number,
  color: string,
  strokeWidth: number,
): Shape {
  switch (tool) {
    case "rect":
      return {
        id: crypto.randomUUID(),
        type: "rect",
        x: startX,
        y: startY,
        width: currentWidth,
        height: currentHeight,
        color,
        strokeWidth,
      };

    case "circle":
      const radius = getDistance(
        startX,
        startY,
        startX + currentWidth,
        startY + currentHeight,
      );

      return {
        id: crypto.randomUUID(),
        type: "circle",
        centerX: startX,
        centerY: startY,
        radius,
        color,
        strokeWidth,
      };

    case "line":
      return {
        id: crypto.randomUUID(),
        type: "line",
        startX: startX,
        startY: startY,
        endX: startX + currentWidth,
        endY: startY + currentHeight,
        color,
        strokeWidth,
      };
    case "pencil":
      return {
        id: crypto.randomUUID(),
        type: "pencil",
        points: [],
        color,
        strokeWidth,
      };
    case "eraser":
      throw new Error("Eraser does not create shapes");
  }
}

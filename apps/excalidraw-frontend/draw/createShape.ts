import { Shape, Tool } from "./types";
import { getDistance } from "./geometry";

export function createShape(
  tool: Tool,
  startX: number,
  startY: number,
  currentWidth: number,
  currentHeight: number,
): Shape {
  switch (tool) {
    case "rect":
      return {
        type: "rect",
        x: startX,
        y: startY,
        width: currentWidth,
        height: currentHeight,
      };

    case "circle":
      const radius = getDistance(
        startX,
        startY,
        startX + currentWidth,
        startY + currentHeight,
      );

      return {
        type: "circle",
        centerX: startX,
        centerY: startY,
        radius,
      };

    case "line":
      return {
        type: "line",
        startX: startX,
        startY: startY,
        endX: startX + currentWidth,
        endY: startY + currentHeight,
      };
    case "pencil":
      return {
        type: "pencil",
        points: [],
      };
  }
}

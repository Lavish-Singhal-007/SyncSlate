import { Shape } from "./types";
import { pointToLineDistance } from "./geometry";

export function getShapeAt(
  x: number,
  y: number,
  existingShapes: Shape[],
): Shape | undefined {
  for (let i = existingShapes.length - 1; i >= 0; i--) {
    const shape = existingShapes[i];

    if (shape.type === "rect") {
      const left = Math.min(shape.x, shape.x + shape.width);
      const right = Math.max(shape.x, shape.x + shape.width);

      const top = Math.min(shape.y, shape.y + shape.height);
      const bottom = Math.max(shape.y, shape.y + shape.height);

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return shape;
      }
    }

    if (shape.type === "circle") {
      const distance = Math.sqrt(
        (x - shape.centerX) ** 2 + (y - shape.centerY) ** 2,
      );

      if (distance <= shape.radius) {
        return shape;
      }
    }

    if (shape.type === "line") {
      const distance = pointToLineDistance(
        x,
        y,
        shape.startX,
        shape.startY,
        shape.endX,
        shape.endY,
      );

      if (distance <= 8) {
        return shape;
      }
    }

    if (shape.type === "pencil") {
      for (let j = 0; j < shape.points.length - 1; j++) {
        const p1 = shape.points[j];
        const p2 = shape.points[j + 1];

        const distance = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);

        if (distance <= 8) {
          return shape;
        }
      }
    }
  }

  return undefined;
}

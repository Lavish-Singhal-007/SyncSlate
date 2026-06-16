import { Shape } from "./types";

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (shape.type) {
    case "rect":
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      break;

    case "circle":
      ctx.beginPath();

      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);

      ctx.stroke();
      break;

    case "line":
      ctx.beginPath();

      ctx.moveTo(shape.startX, shape.startY);

      ctx.lineTo(shape.endX, shape.endY);

      ctx.stroke();
      break;

    case "pencil":
      if (shape.points.length < 2) return;
      ctx.beginPath();

      const first = shape.points[0];

      ctx.moveTo(first.x, first.y);

      for (const point of shape.points) {
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
      break;
  }
}

import { Shape } from "./types";

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  isSelected = false,
) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Variables to track the bounding box for the selection indicator
  let bounds = { x: 0, y: 0, width: 0, height: 0 };

  switch (shape.type) {
    case "rect":
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      bounds = {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
      break;

    case "circle":
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
      ctx.stroke();

      bounds = {
        x: shape.centerX - shape.radius,
        y: shape.centerY - shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2,
      };
      break;

    case "line":
      ctx.beginPath();
      ctx.moveTo(shape.startX, shape.startY);
      ctx.lineTo(shape.endX, shape.endY);
      ctx.stroke();

      bounds = {
        x: Math.min(shape.startX, shape.endX),
        y: Math.min(shape.startY, shape.endY),
        width: Math.abs(shape.endX - shape.startX),
        height: Math.abs(shape.endY - shape.startY),
      };
      break;

    case "pencil":
      if (shape.points.length < 2) return;
      ctx.beginPath();
      const first = shape.points[0];
      ctx.moveTo(first.x, first.y);

      let minX = first.x,
        maxX = first.x;
      let minY = first.y,
        maxY = first.y;

      for (const point of shape.points) {
        ctx.lineTo(point.x, point.y);

        // Calculate bounds as we draw
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
      }
      ctx.stroke();

      bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
      break;
  }

  // Draw the selection box if the shape is selected
  if (isSelected) {
    ctx.save();

    // Set styles specific to the selection box so it doesn't look like a drawn shape
    ctx.strokeStyle = "#635BFF"; // Your SyncSlate brand purple
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);

    // We add a padding of 4px around the bounding box so it doesn't overlap the shape perfectly
    ctx.strokeRect(
      bounds.x - 4,
      bounds.y - 4,
      bounds.width + 8,
      bounds.height + 8,
    );

    ctx.restore();
  }
}

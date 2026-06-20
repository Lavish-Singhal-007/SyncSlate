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

  if (isSelected) {
    ctx.save();

    const pad = 4;
    const minX = bounds.x - pad;
    const minY = bounds.y - pad;
    const maxX = bounds.x + bounds.width + pad;
    const maxY = bounds.y + bounds.height + pad;

    // Selection box
    ctx.strokeStyle = "#635BFF";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);

    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    // Reset dash for the handles
    ctx.setLineDash([]);

    // Calculate midpoints for the 8 handles
    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;

    // Array of all 8 handle center coordinates
    const handles = [
      { x: minX, y: minY }, // Top-Left
      { x: midX, y: minY }, // Top-Center
      { x: maxX, y: minY }, // Top-Right
      { x: minX, y: midY }, // Middle-Left
      { x: maxX, y: midY }, // Middle-Right
      { x: minX, y: maxY }, // Bottom-Left
      { x: midX, y: maxY }, // Bottom-Center
      { x: maxX, y: maxY }, // Bottom-Right
    ];

    const handleSize = 10;

    // Set styles once before the loop
    ctx.fillStyle = "#635BFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;

    // Draw all 8 handles
    handles.forEach((handle) => {
      const handleX = handle.x - handleSize / 2;
      const handleY = handle.y - handleSize / 2;

      ctx.fillRect(handleX, handleY, handleSize, handleSize);
      ctx.strokeRect(handleX, handleY, handleSize, handleSize);
    });

    ctx.restore();
  }
}

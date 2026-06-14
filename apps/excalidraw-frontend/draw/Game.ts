import { Shape, Tool } from "./types";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[] = [];

  private selectedTool: Tool = "rect";

  public setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  private isDrawing = false;

  private startX = 0;
  private startY = 0;

  private currentWidth = 0;
  private currentHeight = 0;

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();

    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;

    this.isDrawing = true;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    this.currentWidth = currentX - this.startX;
    this.currentHeight = currentY - this.startY;

    this.redraw();

    if (this.selectedTool === "rect") {
      this.ctx.strokeRect(
        this.startX,
        this.startY,
        this.currentWidth,
        this.currentHeight,
      );
    }

    if (this.selectedTool === "circle") {
      const radius = Math.sqrt(
        this.currentWidth * this.currentWidth +
          this.currentHeight * this.currentHeight,
      );

      this.ctx.beginPath();

      this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);

      this.ctx.stroke();
    }

    if (this.selectedTool === "line") {
      this.ctx.beginPath();

      this.ctx.moveTo(this.startX, this.startY);

      this.ctx.lineTo(currentX, currentY);

      this.ctx.stroke();
    }
  };

  private handleMouseUp = () => {
    if (!this.isDrawing) return;

    if (this.selectedTool === "rect") {
      this.existingShapes.push({
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: this.currentWidth,
        height: this.currentHeight,
      });
    }

    if (this.selectedTool === "circle") {
      const radius = Math.sqrt(
        this.currentWidth * this.currentWidth +
          this.currentHeight * this.currentHeight,
      );

      this.existingShapes.push({
        type: "circle",
        centerX: this.startX,
        centerY: this.startY,
        radius,
      });
    }

    if (this.selectedTool === "line") {
      this.existingShapes.push({
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: this.startX + this.currentWidth,
        endY: this.startY + this.currentHeight,
      });
    }

    this.redraw();
    this.isDrawing = false;
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Context not found");
    }

    this.ctx = ctx;

    this.init();
  }

  private init() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);

    this.canvas.addEventListener("mousemove", this.handleMouseMove);

    this.canvas.addEventListener("mouseup", this.handleMouseUp);
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const shape of this.existingShapes) {
      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }

      if (shape.type === "circle") {
        this.ctx.beginPath();

        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          shape.radius,
          0,
          Math.PI * 2,
        );

        this.ctx.stroke();
      }

      if (shape.type === "line") {
        this.ctx.beginPath();

        this.ctx.moveTo(shape.startX, shape.startY);

        this.ctx.lineTo(shape.endX, shape.endY);

        this.ctx.stroke();
      }
    }
  }

  destroy() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);

    this.canvas.addEventListener("mousemove", this.handleMouseMove);

    this.canvas.addEventListener("mouseup", this.handleMouseUp);
  }
}

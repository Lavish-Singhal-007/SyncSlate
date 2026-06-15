import { Shape, Tool } from "./types";
import { createShape } from "./createShape";
import { drawShape } from "./drawShape";

// Simple Point type used for pencil tool points
interface Point {
  x: number;
  y: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[] = [];
  private onShapeCreated: (shape: Shape) => void;
  private selectedTool: Tool = "rect";
  private currentPencilPoints: Point[] = [];

  public setTool(tool: Tool) {
    this.selectedTool = tool;
  }
  public clearBoard() {
    this.existingShapes = [];
    this.redraw();
  }

  public addShape(shape: Shape) {
    this.existingShapes.push(shape);
    this.redraw();
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

    if (this.selectedTool === "pencil") {
      this.currentPencilPoints = [{ x: this.startX, y: this.startY }];
    }

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

    if (this.selectedTool === "pencil") {
      this.currentPencilPoints.push({ x: currentX, y: currentY });

      const pencilShape: Shape = {
        type: "pencil",
        points: this.currentPencilPoints,
      };

      drawShape(this.ctx, pencilShape);
      return;
    }

    const newShape = createShape(
      this.selectedTool,
      this.startX,
      this.startY,
      this.currentWidth,
      this.currentHeight,
    );

    drawShape(this.ctx, newShape);
  };

  private handleMouseUp = async () => {
    if (!this.isDrawing) return;

    if (this.selectedTool === "pencil") {
      const pencilShape: Shape = {
        type: "pencil",
        points: this.currentPencilPoints,
      };
      this.existingShapes.push(pencilShape);
      this.onShapeCreated(pencilShape);
      this.redraw();
      this.isDrawing = false;
      return;
    }

    const newShape = createShape(
      this.selectedTool,
      this.startX,
      this.startY,
      this.currentWidth,
      this.currentHeight,
    );

    this.existingShapes.push(newShape);
    this.onShapeCreated(newShape);

    this.redraw();
    this.isDrawing = false;
  };

  constructor(
    canvas: HTMLCanvasElement,
    shapes: Shape[],
    onShapeCreated: (shape: Shape) => void,
  ) {
    this.canvas = canvas;
    this.existingShapes = shapes;
    this.onShapeCreated = onShapeCreated;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Context not found");
    }

    this.ctx = ctx;
    this.redraw();

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
      drawShape(this.ctx, shape);
    }
  }

  destroy() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);

    this.canvas.addEventListener("mousemove", this.handleMouseMove);

    this.canvas.addEventListener("mouseup", this.handleMouseUp);
  }
}

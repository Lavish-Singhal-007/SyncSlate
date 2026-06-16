import { Shape, Tool } from "./types";
import { createShape } from "./createShape";
import { drawShape } from "./drawShape";
import { getShapeAt } from "./getShape";

// Simple Point type used for pencil tool points
interface Point {
  x: number;
  y: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[] = [];
  private redoStack: Shape[] = [];
  private undoStack: Shape[] = [];
  private onShapeCreated: (shape: Shape) => void;
  private onDelete: (shapeId: string) => void;
  private selectedTool: Tool = "rect";
  private currentPencilPoints: Point[] = [];
  private selectedColor: string = "#000000FF";
  private selectedStrokeWidth: number = 2;
  private onStackChange?: (undoSize: number, redoSize: number) => void;

  public setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  public setColor(color: string) {
    this.selectedColor = color;
  }

  public setStrokeWidth(strokeWidth: number) {
    this.selectedStrokeWidth = strokeWidth;
  }

  public clearBoard() {
    this.existingShapes = [];
    this.redraw();
  }

  public addShape(shape: Shape) {
    this.existingShapes.push(shape);
    this.redraw();
  }

  public deleteShape(shapeId: string) {
    this.existingShapes = this.existingShapes.filter(
      (shape) => shape.id !== shapeId,
    );
    this.redraw();
  }

  public doUndo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(this.undoStack[this.undoStack.length - 1]);
    this.deleteShape(this.undoStack[this.undoStack.length - 1].id);
    this.onDelete(this.undoStack[this.undoStack.length - 1].id);
    this.undoStack.pop();
    this.redraw();
    this.emitStackChange();
  }

  public doRedo() {
    if (this.redoStack.length === 0) return;
    this.existingShapes.push(this.redoStack[this.redoStack.length - 1]);
    this.onShapeCreated(this.redoStack[this.redoStack.length - 1]);
    this.undoStack.push(this.redoStack[this.redoStack.length - 1]);
    this.redoStack.pop();
    this.redraw();
    this.emitStackChange();
  }

  private emitStackChange() {
    if (this.onStackChange) {
      this.onStackChange(this.undoStack.length, this.redoStack.length);
    }
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

    this.redoStack = [];
    this.emitStackChange();

    if (this.selectedTool === "eraser") {
      const shape = getShapeAt(this.startX, this.startY, this.existingShapes);

      if (!shape) return;

      this.onDelete(shape.id);
      this.deleteShape(shape.id);
      return;
    }

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
        id: crypto.randomUUID(),
        type: "pencil",
        points: this.currentPencilPoints,
        color: this.selectedColor,
        strokeWidth: this.selectedStrokeWidth,
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
      this.selectedColor,
      this.selectedStrokeWidth,
    );

    drawShape(this.ctx, newShape);
  };

  private handleMouseUp = async () => {
    if (!this.isDrawing) return;

    if (this.selectedTool === "pencil") {
      const pencilShape: Shape = {
        id: crypto.randomUUID(),
        type: "pencil",
        points: this.currentPencilPoints,
        color: this.selectedColor,
        strokeWidth: this.selectedStrokeWidth,
      };
      this.existingShapes.push(pencilShape);
      this.onShapeCreated(pencilShape);
      this.undoStack.push(pencilShape);
      this.emitStackChange();
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
      this.selectedColor,
      this.selectedStrokeWidth,
    );

    this.existingShapes.push(newShape);
    this.onShapeCreated(newShape);
    this.undoStack.push(newShape);
    this.emitStackChange();

    this.redraw();
    this.isDrawing = false;
  };

  constructor(
    canvas: HTMLCanvasElement,
    shapes: Shape[],
    onShapeCreated: (shape: Shape) => void,
    onDelete: (shapeId: string) => void,
    onStackChange?: (undoSize: number, redoSize: number) => void,
  ) {
    this.canvas = canvas;
    this.existingShapes = shapes;
    this.onShapeCreated = onShapeCreated;
    this.onDelete = onDelete;
    this.onStackChange = onStackChange;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Context not found");
    }

    this.ctx = ctx;
    this.redraw();

    this.init();
    this.emitStackChange();
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

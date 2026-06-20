import { Shape, Tool } from "./types";
import { createShape } from "./createShape";
import { drawShape } from "./drawShape";
import { getShapeAt } from "./getShape";

// Simple Point type used for pencil tool points
interface Point {
  x: number;
  y: number;
}

type ResizeDirection = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

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
  private onChangeShape?: (
    shapeId: string,
    shape: Shape,
    flag: boolean,
  ) => void;
  private selectedShape: Shape | null = null;
  private isDragging = false;
  private lastSent = 0;
  private isResizing = false;
  private resizeDirection: ResizeDirection | null = null;

  private dragStartX = 0;
  private dragStartY = 0;

  private isDrawing = false;

  private startX = 0;
  private startY = 0;

  private currentWidth = 0;
  private currentHeight = 0;

  public setTool(tool: Tool) {
    this.selectedTool = tool;
    if (tool !== "select") this.selectedShape = null;
    this.redraw();
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

  public dragShape(shapeId: string, shape: Shape) {
    const index = this.existingShapes.findIndex((s) => s.id === shapeId);
    if (index === -1) return;
    this.existingShapes[index] = shape;
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

  private isResizeHandleClicked(
    mouseX: number,
    mouseY: number,
    shape: Shape,
  ): ResizeDirection | null {
    if (shape.type !== "rect") return null;

    const pad = 4;
    const minX = shape.x - pad;
    const minY = shape.y - pad;
    const maxX = shape.x + shape.width + pad;
    const maxY = shape.y + shape.height + pad;

    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;

    const handles = [
      { dir: "nw", x: minX, y: minY },
      { dir: "n", x: midX, y: minY },
      { dir: "ne", x: maxX, y: minY },
      { dir: "w", x: minX, y: midY },
      { dir: "e", x: maxX, y: midY },
      { dir: "sw", x: minX, y: maxY },
      { dir: "s", x: midX, y: maxY },
      { dir: "se", x: maxX, y: maxY },
    ] as const;

    const hitSize = 30;

    for (const handle of handles) {
      const handleStartX = handle.x - hitSize / 2;
      const handleStartY = handle.y - hitSize / 2;

      if (
        mouseX >= handleStartX &&
        mouseX <= handleStartX + hitSize &&
        mouseY >= handleStartY &&
        mouseY <= handleStartY + hitSize
      ) {
        return handle.dir as ResizeDirection;
      }
    }

    return null;
  }

  public getThumbnail(): string {
    const scale = 0.2;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width * scale;
    tempCanvas.height = this.canvas.height * scale;

    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      tempCtx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      return tempCanvas.toDataURL("image/jpeg", 0.6);
    }

    return this.canvas.toDataURL("image/jpeg", 0.5);
  }

  private emitStackChange() {
    if (this.onStackChange) {
      this.onStackChange(this.undoStack.length, this.redoStack.length);
    }
  }

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();

    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;

    if (this.selectedTool === "select") {
      const shape = getShapeAt(this.startX, this.startY, this.existingShapes);
      this.selectedShape = shape ?? null;

      if (shape) {
        const handleDir = this.isResizeHandleClicked(
          this.startX,
          this.startY,
          shape,
        );
        if (handleDir) {
          this.isResizing = true;
          this.resizeDirection = handleDir;
          this.redraw();
          return;
        }
      }

      if (shape) {
        this.isDragging = true;
        this.dragStartX = this.startX;
        this.dragStartY = this.startY;
      }

      this.redraw();
      return;
    }

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
    if (
      this.selectedTool === "select" &&
      this.isDragging &&
      this.selectedShape
    ) {
      const rect = this.canvas.getBoundingClientRect();

      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const dx = currentX - this.dragStartX;
      const dy = currentY - this.dragStartY;

      const shape = this.selectedShape;
      if (shape.type === "rect") {
        shape.x += dx;
        shape.y += dy;
      }
      if (shape.type === "circle") {
        shape.centerX += dx;
        shape.centerY += dy;
      }

      if (shape.type === "line") {
        shape.startX += dx;
        shape.startY += dy;

        shape.endX += dx;
        shape.endY += dy;
      }
      if (shape.type === "pencil") {
        shape.points = shape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }));
      }
      this.dragStartX = currentX;
      this.dragStartY = currentY;

      const now = Date.now();

      if (now - this.lastSent > 30) {
        if (this.onChangeShape)
          this.onChangeShape(this.selectedShape.id, this.selectedShape, false);
        this.lastSent = now;
      }

      this.redraw();

      return;
    }

    if (
      this.isResizing &&
      this.resizeDirection &&
      this.selectedTool === "select" &&
      this.selectedShape &&
      this.selectedShape.type === "rect"
    ) {
      const rect = this.canvas.getBoundingClientRect();

      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const shape = this.selectedShape;

      // Adjust Width and X based on East/West
      if (this.resizeDirection.includes("e")) {
        shape.width = currentX - shape.x;
      }
      if (this.resizeDirection.includes("w")) {
        shape.width += shape.x - currentX;
        shape.x = currentX;
      }

      // Adjust Height and Y based on North/South
      if (this.resizeDirection.includes("s")) {
        shape.height = currentY - shape.y;
      }
      if (this.resizeDirection.includes("n")) {
        shape.height += shape.y - currentY;
        shape.y = currentY;
      }

      const now = Date.now();

      if (now - this.lastSent > 30) {
        if (this.onChangeShape)
          this.onChangeShape(this.selectedShape.id, this.selectedShape, false);
        this.lastSent = now;
      }
      this.redraw();

      return;
    }

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
    if (this.isDragging) {
      this.isDragging = false;
      if (this.selectedShape === null) return;
      if (this.onChangeShape)
        this.onChangeShape(this.selectedShape.id, this.selectedShape, true);
      return;
    }

    if (this.isResizing) {
      this.isResizing = false;
      this.resizeDirection = null;
      if (this.selectedShape === null) return;
      if (this.onChangeShape)
        this.onChangeShape(this.selectedShape.id, this.selectedShape, true);
      return;
    }

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
    onChangeShape?: (shapeId: string, shape: Shape, flag: boolean) => void,
  ) {
    this.canvas = canvas;
    this.existingShapes = shapes;
    this.onShapeCreated = onShapeCreated;
    this.onDelete = onDelete;
    this.onStackChange = onStackChange;
    this.onChangeShape = onChangeShape;

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

  public redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const shape of this.existingShapes) {
      drawShape(this.ctx, shape, shape.id === this.selectedShape?.id);
    }

    // draw cursors
    if ((window as any).remoteCursors) {
      const cursors = (window as any).remoteCursors;

      this.ctx.save();

      for (const userId in cursors) {
        const c = cursors[userId];
        const cursorColor = c.color || "#635BFF"; // Fallback to SyncSlate purple

        // 1. Draw the Custom Mouse Pointer (Arrow)
        this.ctx.beginPath();
        this.ctx.moveTo(c.x, c.y); // Point 1: The exact click tip
        this.ctx.lineTo(c.x + 12, c.y + 12); // Point 2: The right wing
        this.ctx.lineTo(c.x + 5, c.y + 12); // Point 3: The inner notch
        this.ctx.lineTo(c.x, c.y + 18); // Point 4: The bottom tail
        this.ctx.closePath(); // Back to the tip

        // 2. Fill it with the user's color
        this.ctx.fillStyle = cursorColor;
        this.ctx.fill();

        // 3. Give it a crisp white outline so it stands out against dark shapes
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // 4. Draw the User ID label
        this.ctx.font = "500 12px system-ui, sans-serif";
        this.ctx.fillStyle = "#1E293B";

        // Shift the text nicely out of the way of the newly drawn arrow
        this.ctx.fillText(userId.slice(0, 4), c.x + 16, c.y + 24);
      }

      this.ctx.restore();
    }
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);

    this.canvas.removeEventListener("mousemove", this.handleMouseMove);

    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
  }
}

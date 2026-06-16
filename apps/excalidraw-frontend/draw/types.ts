export type Shape =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      strokeWidth: number;
    }
  | {
      id: string;
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
      color: string;
      strokeWidth: number;
    }
  | {
      id: string;
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color: string;
      strokeWidth: number;
    }
  | {
      id: string;
      type: "pencil";
      points: {
        x: number;
        y: number;
      }[];
      color: string;
      strokeWidth: number;
    };

export type Tool = "rect" | "circle" | "line" | "pencil" | "eraser";

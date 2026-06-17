"use client";

import { useState, useEffect, useRef } from "react";
import { Game } from "@/draw/Game";
import { Tool } from "@/draw/types";
import { api } from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  Square,
  Circle,
  Minus,
  Pencil,
  Trash2,
  Eraser,
  Undo2,
  Redo2,
  Loader2,
  AlertTriangle,
  MousePointer,
} from "lucide-react";

export default function CanvasPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [tool, setTool] = useState<Tool>("rect");
  const wsRef = useRef<WebSocket | null>(null);
  const [color, setColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Loading and Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = [
    "#000000",
    "#e03131",
    "#2f9e44",
    "#1971c2",
    "#6741d9",
    "#f08c00",
  ];

  const params = useParams();
  const roomId = Number(params.roomId);

  async function getShapes(roomId: number) {
    const res = await api.get(`/shapes/${roomId}`);
    return res.data;
  }

  function handleClear() {
    wsRef.current?.send(JSON.stringify({ type: "clear", roomId }));
    gameRef.current?.clearBoard();
  }

  function handleUndo() {
    gameRef.current?.doUndo();
  }
  function handleRedo() {
    gameRef.current?.doRedo();
  }

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      try {
        const dbShapes = await getShapes(roomId);

        // Anti-Ghost Check
        if (!isMounted) return;

        const shapes = dbShapes.map((item: any) => item.shape);
        const token = localStorage.getItem("token");
        const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "join_room", roomId }));
        };

        wsRef.current = ws;

        const game = new Game(
          canvas,
          shapes,
          async (shape) => {
            wsRef.current?.send(
              JSON.stringify({ type: "shape", roomId, shape }),
            );
          },
          async (shapeId) => {
            wsRef.current?.send(
              JSON.stringify({ type: "deleteShape", roomId, shapeId }),
            );
          },
          (undoSize, redoSize) => {
            setCanUndo(undoSize > 0);
            setCanRedo(redoSize > 0);
          },
          (shapeId, shape) => {
            wsRef.current?.send(
              JSON.stringify({ type: "dragShape", roomId, shapeId, shape }),
            );
          },
        );

        gameRef.current = game;

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "shape") gameRef.current?.addShape(data.shape);
          if (data.type === "clear") gameRef.current?.clearBoard();
          if (data.type === "deleteShape")
            gameRef.current?.deleteShape(data.shapeId);
          if (data.type === "dragShape")
            gameRef.current?.dragShape(data.shapeId, data.shape);
        };

        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;

        console.error("Failed to load room:", err);
        if (err.response?.status === 403) {
          setError("You don't have permission to access this whiteboard.");
        } else if (err.response?.status === 404) {
          setError("This whiteboard could not be found.");
        } else {
          setError("Failed to load the whiteboard. Please try again.");
        }
        setIsLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      gameRef.current?.destroy();
      if (wsRef.current) wsRef.current.close();
    };
  }, [roomId]);

  useEffect(() => {
    gameRef.current?.setTool(tool);
  }, [tool]);
  useEffect(() => {
    gameRef.current?.setColor(color);
  }, [color]);
  useEffect(() => {
    gameRef.current?.setStrokeWidth(strokeWidth);
  }, [strokeWidth]);

  useEffect(() => {
    if (isLoading || error) return;

    const autoSaveInterval = setInterval(() => {
      if (!gameRef.current) return;
      try {
        const thumbnailBase64 = gameRef.current.getThumbnail();
        api.put(`/room/${roomId}/thumbnail`, { thumbnail: thumbnailBase64 });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [roomId, isLoading, error]);

  const getToolClass = (isActive: boolean) =>
    `p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
      isActive
        ? "bg-[#EEF0FF] text-[#635BFF] shadow-sm"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#F7F6FF]">
      {/* 1. LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-[#F7F6FF] text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#635BFF] mb-4" />
          <p className="font-medium text-slate-700">Loading your canvas...</p>
        </div>
      )}

      {/* 2. ERROR OVERLAY */}
      {error && (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-[#F7F6FF] px-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-500 mb-8">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-[#635BFF] text-white py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 3. FLOATING TOP TOOLBAR */}
      <div
        className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl ${isLoading || error ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <button
          className={getToolClass(tool === "select")}
          onClick={() => setTool("select")}
          title="Select"
        >
          <MousePointer className="w-5 h-5" />
        </button>
        <button
          className={getToolClass(tool === "pencil")}
          onClick={() => setTool("pencil")}
          title="Pencil"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          className={getToolClass(tool === "rect")}
          onClick={() => setTool("rect")}
          title="Rectangle"
        >
          <Square className="w-5 h-5" />
        </button>
        <button
          className={getToolClass(tool === "circle")}
          onClick={() => setTool("circle")}
          title="Circle"
        >
          <Circle className="w-5 h-5" />
        </button>
        <button
          className={getToolClass(tool === "line")}
          onClick={() => setTool("line")}
          title="Line"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          className={getToolClass(tool === "eraser")}
          onClick={() => setTool("eraser")}
          title="Eraser"
        >
          <Eraser className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ${color === c ? "ring-2 ring-offset-2 ring-[#635BFF]" : ""}`}
              style={{ backgroundColor: c }}
              title={`Select color ${c}`}
            />
          ))}
        </div>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        <div className="flex items-center gap-1">
          {[
            { width: 2, label: "Thin", dotClass: "w-1.5 h-1.5" },
            { width: 4, label: "Medium", dotClass: "w-2.5 h-2.5" },
            { width: 8, label: "Thick", dotClass: "w-4 h-4" },
          ].map((stroke) => (
            <button
              key={stroke.width}
              onClick={() => setStrokeWidth(stroke.width)}
              title={`${stroke.label} Stroke`}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${strokeWidth === stroke.width ? "bg-[#EEF0FF] text-[#635BFF]" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <div className={`rounded-full bg-current ${stroke.dotClass}`} />
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        <button
          disabled={!canUndo}
          onClick={handleUndo}
          title="Undo"
          className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          disabled={!canRedo}
          onClick={handleRedo}
          title="Redo"
          className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        <button
          onClick={handleClear}
          title="Clear Canvas"
          className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* 4. ACTUAL CANVAS */}
      <canvas
        ref={canvasRef}
        className={`block w-full h-full touch-none ${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`}
      />
    </div>
  );
}

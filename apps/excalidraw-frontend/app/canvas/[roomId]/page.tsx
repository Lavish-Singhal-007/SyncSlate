"use client";

import { useState, useEffect, useRef } from "react";
import { Game } from "@/draw/Game";
import { Shape, Tool } from "@/draw/types";
import { api } from "@/lib/axios";
import { jsPDF } from "jspdf";
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
  MousePointer2,
  Share2,
  Check,
  Download, // <-- Added Download icon
  FileText,
} from "lucide-react";

export default function CanvasPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [tool, setTool] = useState<Tool>("rect");
  const wsRef = useRef<WebSocket | null>(null);
  const [color, setColor] = useState<string>("#1E293B");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const sendMouse = useRef<number>(0);
  const cursorsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Loading, Error, and Share States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const colors = [
    "#1E293B", // Slate 800
    "#EF4444", // Red 500
    "#22C55E", // Green 500
    "#3B82F6", // Blue 500
    "#635BFF", // Brand Purple
    "#F59E0B", // Amber 500
  ];

  const params = useParams();
  const roomId = Number(params.roomId);

  async function getShapes(roomId: number): Promise<{ shape: Shape }[]> {
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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // NEW: Export to PNG Function (Fixed for White Background)
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Create a temporary "invisible" canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // 2. Fill it with a solid white background (or #FAFAFA to match your app)
    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 3. Draw your original transparent canvas directly on top of the white background
    tempCtx.drawImage(canvas, 0, 0);

    // 4. Export the combined temporary canvas
    const dataUrl = tempCanvas.toDataURL("image/png");

    // 5. Trigger the download
    const link = document.createElement("a");
    link.download = `SyncSlate-Board-${roomId}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NEW: Export to PDF Function
  const handleExportPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Create the temporary white-background canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    // 2. Get the image data (JPEG is usually lighter for PDFs)
    const imgData = tempCanvas.toDataURL("image/jpeg", 1.0);

    // 3. Initialize jsPDF. We set the PDF size to exactly match the canvas!
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    // 4. Add the image to the PDF and trigger download
    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save(`SyncSlate-Board-${roomId}.pdf`);
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      try {
        const dbShapes = await getShapes(roomId);

        if (!isMounted) return;

        const shapes = dbShapes.map((item) => item.shape);
        const token = localStorage.getItem("token");
        const wsBackendUrl =
          process.env.NEXT_PUBLIC_WS_BACKEND_URL || "ws://localhost:8080";
        const ws = new WebSocket(`${wsBackendUrl}?token=${token}`);

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
          (shapeId, shape, flag) => {
            wsRef.current?.send(
              JSON.stringify({
                type: "dragShape",
                roomId,
                shapeId,
                shape,
                flag,
              }),
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
          if (data.type === "mouse_move") {
            cursorsRef.current[data.userId] = {
              x: data.x,
              y: data.y,
            };
            (
              window as Window & {
                remoteCursors?: Record<string, { x: number; y: number }>;
              }
            ).remoteCursors = cursorsRef.current;
            gameRef.current?.redraw();
          }
        };

        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to load room:", err);
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (status === 403) {
          setError("You don't have permission to access this whiteboard.");
        } else if (status === 404) {
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - sendMouse.current < 20) return; // ~50fps
      sendMouse.current = now;

      const rect = canvas.getBoundingClientRect();

      wsRef.current?.send(
        JSON.stringify({
          type: "mouse_move",
          roomId,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }),
      );
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
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
    `p-2 rounded-lg transition-all duration-200 active:scale-95 flex items-center justify-center ${
      isActive
        ? "bg-white text-[#635BFF] shadow-sm ring-1 ring-slate-200"
        : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
    }`;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAFAFA]">
      {/* BACKGROUND DOT GRID */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #635BFF 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* BRANDING LOGO */}
      <div className="absolute bottom-6 left-6 z-50 flex items-center gap-2.5 select-none pointer-events-none">
        <div className="w-9 h-9 bg-linear-to-br from-[#635BFF] to-[#4B44D4] rounded-xl flex items-center justify-center shadow-sm border border-indigo-500/20">
          <span className="text-white font-bold text-lg leading-none tracking-tighter">
            S
          </span>
        </div>
        <span className="font-extrabold text-xl text-slate-800 tracking-tight">
          Sync<span className="text-[#635BFF]">Slate</span>
        </span>
      </div>

      {/* 1. LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-[#FAFAFA]/80 backdrop-blur-sm text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#635BFF] mb-4" />
          <p className="font-medium text-slate-700">Loading your canvas...</p>
        </div>
      )}

      {/* 2. ERROR OVERLAY */}
      {error && (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-[#FAFAFA]/80 backdrop-blur-sm px-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-500 mb-8">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-[#635BFF] text-white py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors active:scale-[0.98]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 3. FLOATING TOP TOOLBAR */}
      <div
        className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-2 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-indigo-900/5 rounded-2xl ${
          isLoading || error
            ? "opacity-0 -translate-y-4 pointer-events-none"
            : "opacity-100 translate-y-0"
        } transition-all duration-500 ease-out`}
      >
        {/* GROUP 1: Primary Tools */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
          <button
            className={getToolClass(tool === "select")}
            onClick={() => setTool("select")}
            title="Select (V)"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button
            className={getToolClass(tool === "pencil")}
            onClick={() => setTool("pencil")}
            title="Pencil (P)"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className={getToolClass(tool === "rect")}
            onClick={() => setTool("rect")}
            title="Rectangle (R)"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            className={getToolClass(tool === "circle")}
            onClick={() => setTool("circle")}
            title="Circle (C)"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            className={getToolClass(tool === "line")}
            onClick={() => setTool("line")}
            title="Line (L)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            className={getToolClass(tool === "eraser")}
            onClick={() => setTool("eraser")}
            title="Eraser (E)"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-200 rounded-full" />

        {/* GROUP 2: Stroke Properties */}
        <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl">
          {[
            { width: 2, label: "Thin", dotClass: "w-1.5 h-1.5" },
            { width: 4, label: "Medium", dotClass: "w-2.5 h-2.5" },
            { width: 8, label: "Thick", dotClass: "w-4 h-4" },
          ].map((stroke) => (
            <button
              key={stroke.width}
              onClick={() => setStrokeWidth(stroke.width)}
              title={`${stroke.label} Stroke`}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95 ${
                strokeWidth === stroke.width
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-400 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <div className={`rounded-full bg-current ${stroke.dotClass}`} />
            </button>
          ))}

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Custom Thickness Slider */}
          <div
            className="flex items-center gap-2 px-1"
            title={`Custom Thickness: ${strokeWidth}px`}
          >
            <input
              type="range"
              min="1"
              max="24"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#635BFF]"
            />
            <span className="text-xs font-medium text-slate-500 w-4 text-center">
              {strokeWidth}
            </span>
          </div>
        </div>

        {/* GROUP 3: Colors */}
        <div className="flex items-center gap-1.5 pl-1 pr-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="relative w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              title={`Select color ${c}`}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: c }}
              />
              {color === c && (
                <span
                  className="absolute -inset-1 rounded-full border-2"
                  style={{ borderColor: c }}
                />
              )}
            </button>
          ))}

          <div
            className="relative w-6 h-6 rounded-full shadow-sm ring-1 ring-slate-200 transition-transform hover:scale-110 active:scale-95 cursor-pointer ml-1 flex items-center justify-center"
            title="Custom Color Palette"
            style={{
              background:
                "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
            }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm pointer-events-none" />
            {!colors.includes(color) && (
              <span
                className="absolute -inset-1 rounded-full border-2 pointer-events-none"
                style={{ borderColor: color }}
              />
            )}
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 rounded-full" />

        {/* GROUP 4: Actions */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
          <button
            disabled={!canUndo}
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            className="p-2 text-slate-500 hover:bg-white hover:text-slate-900 rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            disabled={!canRedo}
            onClick={handleRedo}
            title="Redo (Ctrl+Y)"
            className="p-2 text-slate-500 hover:bg-white hover:text-slate-900 rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          {/* NEW: Export to PNG Button */}
          <button
            onClick={handleExportPNG}
            title="Export as PNG"
            className="p-2 text-slate-500 hover:bg-white hover:text-[#635BFF] rounded-lg transition-all duration-200 active:scale-95"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Export to PDF Button */}
          <button
            onClick={handleExportPDF}
            title="Export as PDF"
            className="p-2 text-slate-500 hover:bg-white hover:text-red-500 rounded-lg transition-all duration-200 active:scale-95"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            title="Clear Canvas"
            className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-200 rounded-full" />

        {/* GROUP 5: SHARE LINK */}
        <div className="flex items-center bg-slate-50 p-1 rounded-xl">
          <button
            onClick={handleShare}
            title="Copy Share Link"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
              isCopied
                ? "bg-green-100 text-green-700"
                : "bg-[#EEF0FF] text-[#635BFF] hover:bg-indigo-100"
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. ACTUAL CANVAS */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none relative z-10"
        style={{
          cursor:
            tool === "select"
              ? "default"
              : tool === "eraser"
                ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%231E293B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>') 4 18, pointer`
                : tool === "pencil"
                  ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%231E293B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>') 0 20, crosshair`
                  : "crosshair",
        }}
      />
    </div>
  );
}

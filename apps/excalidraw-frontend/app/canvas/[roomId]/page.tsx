"use client";

import { useState, useEffect, useRef } from "react";
import { Game } from "@/draw/Game";
import { Tool } from "@/draw/types";
import { api } from "@/lib/axios";
import { useParams } from "next/navigation";

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [tool, setTool] = useState<Tool>("rect");
  const wsRef = useRef<WebSocket | null>(null);

  const params = useParams();
  const roomId = Number(params.roomId);

  async function getShapes(roomId: number) {
    const res = await api.get(`/shapes/${roomId}`);

    return res.data;
  }

  function handleClear() {
    wsRef.current?.send(
      JSON.stringify({
        type: "clear",
        roomId,
      }),
    );

    gameRef.current?.clearBoard();
  }

  useEffect(() => {
    const init = async () => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const dbShapes = await getShapes(roomId);

      const shapes = dbShapes.map((item: any) => item.shape);

      const token = localStorage.getItem("token");

      const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "join_room",
            roomId,
          }),
        );
      };

      wsRef.current = ws;

      const game = new Game(canvas, shapes, async (shape) => {
        wsRef.current?.send(
          JSON.stringify({
            type: "shape",
            roomId,
            shape,
          }),
        );
      });

      gameRef.current = game;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "shape") {
          gameRef.current?.addShape(data.shape);
        }
        if (data.type === "clear") {
          gameRef.current?.clearBoard();
        }
      };
    };

    init();

    return () => {
      gameRef.current?.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    gameRef.current?.setTool(tool);
  }, [tool]);

  const getButtonStyle = (isActive: boolean) => ({
    padding: "8px 16px",
    margin: "0 4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    // Differentiate active vs inactive states
    backgroundColor: isActive ? "#e3f2fd" : "#ffffff",
    color: isActive ? "#0d47a1" : "#4b5563",
    border: isActive ? "1px solid #90caf9" : "1px solid #e5e7eb",
    boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
  });

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 100,
        }}
      >
        <button
          style={getButtonStyle(tool === "rect")}
          onClick={() => setTool("rect")}
        >
          Rectangle
        </button>

        <button
          style={getButtonStyle(tool === "circle")}
          onClick={() => setTool("circle")}
        >
          Circle
        </button>

        <button
          style={getButtonStyle(tool === "line")}
          onClick={() => setTool("line")}
        >
          Line
        </button>
        <button
          style={getButtonStyle(tool === "pencil")}
          onClick={() => setTool("pencil")}
        >
          Pencil
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-200 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          background: "white",
          display: "block",
        }}
      />
    </>
  );
}

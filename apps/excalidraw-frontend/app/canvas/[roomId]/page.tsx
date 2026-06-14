"use client";

import { useState, useEffect, useRef } from "react";
import { Game } from "@/draw/Game";
import { Tool } from "@/draw/types";

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [tool, setTool] = useState<Tool>("rect");

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game(canvas);
    gameRef.current = game;

    return () => {
      game.destroy();
    };
  }, []);

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

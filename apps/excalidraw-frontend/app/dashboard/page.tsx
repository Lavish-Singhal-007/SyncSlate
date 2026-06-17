"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import {
  Pencil,
  Plus,
  Trash2,
  Clock,
  LayoutGrid,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import axios from "axios";

interface Room {
  id: number;
  slug: string;
  createdAt: string;
  thumbnail?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State for the inline creation form
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/rooms");
        setRooms(res.data.rooms || []);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError("");

    try {
      // Send the name as the slug. If empty, the backend will auto-generate one.
      const res = await api.post("/room", {
        slug: newRoomName.trim() || undefined,
      });
      router.push(`/canvas/${res.data.roomId}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setCreateError(
          "A board with this name already exists. Please choose another.",
        );
      } else {
        setCreateError("Failed to create board. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setRooms(rooms.filter((room) => room.id !== id));
    try {
      await api.delete(`/room/${id}`);
    } catch (error) {
      console.error("Failed to delete room", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TOP NAVIGATION */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-[#635BFF] p-2 rounded-xl">
            <Pencil className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SyncSlate</span>
        </div>

        <button
          className="text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-medium transition-colors"
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/signin");
          }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your Whiteboards</h1>
            <p className="text-slate-500 text-sm">
              Manage and revisit your previously saved collaborative sessions.
            </p>
          </div>

          {/* DYNAMIC NEW BOARD CONTROLS */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-[#635BFF] hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Board
            </button>
          ) : (
            <form
              onSubmit={handleCreateRoom}
              className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#635BFF] shadow-sm"
            >
              <input
                type="text"
                placeholder="Name your board (optional)..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="px-3 py-1.5 outline-none bg-transparent text-sm w-56"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#635BFF] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setCreateError("");
                  setNewRoomName("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* ERROR MESSAGE */}
        {createError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center">
            {createError}
          </div>
        )}

        {/* ROOMS GRID */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => router.push(`/canvas/${room.id}`)}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-[#BDB7FF] transition-all group flex flex-col cursor-pointer"
              >
                {/* Visual Thumbnail Area */}
                <div className="bg-[#F7F6FF] h-32 rounded-xl mb-4 flex items-center justify-center border border-[#EEF0FF] group-hover:border-[#BDB7FF] transition-colors overflow-hidden relative">
                  {room.thumbnail ? (
                    <img
                      src={room.thumbnail}
                      alt={`Preview of ${room.slug}`}
                      className="w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    />
                  ) : (
                    <LayoutGrid className="w-8 h-8 text-[#635BFF] opacity-40 group-hover:opacity-60 transition-opacity" />
                  )}
                </div>

                {/* Card Info */}
                <div className="flex-1">
                  {/* Removed the Link wrapper, added group-hover color change to signify it's clickable */}
                  <h3
                    className="text-lg font-semibold text-slate-800 mb-1 truncate group-hover:text-[#635BFF] transition-colors"
                    title={room.slug}
                  >
                    {room.slug}
                  </h3>
                  <div className="flex items-center text-xs text-slate-500 gap-1.5 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Created {timeAgo(room.createdAt)}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 truncate max-w-30">
                    ID: {room.id}
                  </span>

                  <button
                    onClick={(e) => handleDelete(e, room.id)}
                    className="p-2 rounded-lg transition-colors text-red-500 bg-red-50 "
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {rooms.length === 0 && !isCreating && (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <Pencil className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  No whiteboards yet
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  Create your first canvas to start drawing, brainstorming, and
                  collaborating with your team.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-[#635BFF] text-white px-5 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create your first board
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

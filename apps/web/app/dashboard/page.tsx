"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

export default function Dashboard() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  async function createRoom() {
    try {
      const res = await api.post("/room", {
        slug,
      });

      router.push(`/chats/${res.data.roomId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create room");
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <input
        placeholder="Room Name"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <button onClick={createRoom}>Create Room</button>
    </div>
  );
}

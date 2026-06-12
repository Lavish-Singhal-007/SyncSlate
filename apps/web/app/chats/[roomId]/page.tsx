"use client";

import { api } from "@/lib/axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Chat {
  id: number;
  message: string;
  userId: string;
}

export default function ChatPage() {
  const params = useParams();
  const roomId = Number(params.roomId);
  const router = useRouter();

  const [messages, setMessages] = useState<Chat[]>([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Load old messages
  useEffect(() => {
    async function loadChats() {
      try {
        const res = await api.get(`/chats/${roomId}`);
        setMessages(res.data.chats);
      } catch (err: any) {
        if (err.response?.status === 403) {
          alert("Access denied");
          router.push("/dashboard");
          return;
        }

        console.error(err);
      }
    }

    if (roomId) {
      loadChats();
    }
  }, [roomId, router]);

  // Connect websocket
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !roomId) {
      return;
    }

    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket Connected");

      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.chatId,
            message: data.message,
            userId: data.userId,
          },
        ]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomId]);

  function sendMessage() {
    if (!socket) {
      alert("Socket not connected");
      return;
    }

    if (!message.trim()) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "chat",
        roomId,
        message,
      }),
    );

    setMessage("");
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1>Room {roomId}</h1>

      <div
        style={{
          border: "1px solid gray",
          minHeight: "500px",
          padding: "10px",
          marginTop: "20px",
          marginBottom: "20px",
          overflowY: "auto",
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((chat) => (
            <div
              key={chat.id}
              style={{
                marginBottom: "10px",
                padding: "8px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <strong>{chat.userId}</strong>
              <br />
              {chat.message}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "10px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

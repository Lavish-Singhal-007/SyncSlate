"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  async function handleSignin() {
    try {
      const res = await api.post("/signin", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Signin failed");
    }
  }

  return (
    <div>
      <h1>Signin</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />

      <button onClick={handleSignin}>Signin</button>
    </div>
  );
}

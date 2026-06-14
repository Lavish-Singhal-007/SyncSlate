"use client";
import { useState } from "react";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import axios from "axios";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input } from "@/components/ui/Input";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/signin", { email, password });
      localStorage.setItem("token", res.data.token);
      router.push("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Sign in failed",
        );
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="text-center">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900 justify-center">
          Welcome back
        </h1>
        <p className="mt-3 text-[17px] leading-7 text-slate-500 justify-center">
          Sign in to your account to continue collaborating on your infinite
          canvas.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSignin} className="mt-8 space-y-4">
        <Input
          label="Email Address"
          placeholder="lavish@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          {/* Custom wrapper here to add the Forgot Password link inline with your label styling */}
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-[15px] font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-[#635BFF] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            label="" // Passed as empty string since we customized the label above
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#635BFF] py-3.5 font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign in"}
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </form>

      <p className="mt-8 text-center text-slate-500">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[#635BFF] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

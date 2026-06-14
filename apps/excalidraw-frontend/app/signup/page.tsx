"use client";
import { useState } from "react";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import axios from "axios";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await api.post("/signup", {
        name,
        email,
        password,
      });

      router.push("/signin");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Signup failed",
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
          Create your account
        </h1>

        <p className="mt-3 text-[17px] leading-7 text-slate-500 justify-center">
          Join SyncSlate and start collaborating on an infinite canvas with your
          team in real time.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSignup} className="space-y-4 mt-6">
        <Input
          label="Full Name"
          placeholder="Lavish Singhal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Email Address"
          placeholder="lavish@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          placeholder="At least 8 characters"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
          />
          <p className="text-[13px] text-slate-500">
            I agree to the{" "}
            <span className="font-medium text-[#635BFF] hover:underline cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="font-medium text-[#635BFF] hover:underline cursor-pointer">
              Privacy Policy
            </span>
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#635BFF] py-3.5 font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create account"}
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </form>

      <p className="mt-8 text-center text-slate-500">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-semibold text-[#635BFF] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

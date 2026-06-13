"use client";

import { useState } from "react";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, ArrowRight, Eye, EyeOff } from "lucide-react";
import axios from "axios";

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
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[55%_45%]">
        {/* LEFT SECTION */}
        <div className="hidden lg:flex flex-col bg-[#F7F6FF] px-10 pt-8 pb-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#635BFF] text-white">
              <Pencil size={24} />
            </div>

            <h1 className="text-[32px] font-bold tracking-tight text-[#1E1B4B]">
              SyncSlate
            </h1>
          </div>

          {/* Illustration */}
          <div className="mt-6 flex justify-center">
            <div className="relative h-55 w-105">
              {/* Main card */}
              <div className="absolute left-10 top-10 h-40 w-64 rounded-3xl border border-[#E8E6FF] bg-white p-5">
                <div className="h-3 w-28 rounded-full bg-slate-200" />
                <div className="mt-5 h-2 w-44 rounded-full bg-slate-200" />
                <div className="mt-3 h-2 w-36 rounded-full bg-slate-200" />
                <div className="mt-3 h-2 w-24 rounded-full bg-slate-200" />

                <div className="mt-8 h-5 w-20 rounded-full bg-[#635BFF]" />
              </div>

              {/* Yellow sticky */}
              <div className="absolute right-28 top-0 h-24 w-28 rotate-6 rounded-2xl border border-yellow-300 bg-yellow-100 p-3">
                <div className="h-2 w-14 rounded bg-yellow-300" />
                <div className="mt-3 h-2 w-16 rounded bg-yellow-300" />
                <div className="mt-2 h-2 w-10 rounded bg-yellow-300" />
              </div>

              {/* Green sticky */}
              <div className="absolute right-6 top-36 h-24 w-28 -rotate-3 rounded-2xl border border-green-300 bg-green-100 p-3">
                <div className="h-2 w-12 rounded bg-green-300" />
                <div className="mt-3 h-2 w-16 rounded bg-green-300" />
                <div className="mt-2 h-2 w-10 rounded bg-green-300" />
              </div>

              {/* Circle */}
              <div className="absolute bottom-10 left-72 h-24 w-24 rounded-full border-[6px] border-[#BDB7FF]" />

              {/* Connector */}
              <svg className="absolute inset-0" width="420" height="220">
                <path
                  d="M280 120 C340 120 360 60 450 60"
                  stroke="#BDB7FF"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8 8"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="mt-10">
            <div className="text-center ">
              <h2 className="text-[38px] font-bold leading-11 tracking-tight text-[#1E1B4B]">
                Think together,
                <br />
                <span className="text-[#635BFF]">draw together</span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-[20px] leading-8 text-[#6D6A8A]">
                A shared infinite canvas where ideas come alive in real time.
                Brainstorm, sketch and collaborate seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg">
            {/* Mobile Logo */}
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF] text-white">
                  <Pencil size={18} />
                </div>

                <span className="text-2xl font-bold">SyncSlate</span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-[44px] font-bold tracking-tight text-slate-900 justify-center">
                Create your account
              </h1>

              <p className="mt-3 text-[17px] leading-7 text-slate-500 justify-center">
                Join SyncSlate and start collaborating on an infinite canvas
                with your team in real time.
              </p>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* <button className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white py-3.5 font-medium text-slate-800 transition-all hover:border-slate-400 hover:bg-slate-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 10-2 13.5-5.4l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.1-7.9l-6.5 5C9.8 39.6 16.4 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.7-6.2 7.4l6.2 5.2C39.5 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
                />
              </svg>
              Continue with Google
            </button> */}

            {/* <div className="my-8 flex items-center">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="px-4 text-[13px] text-slate-400">
                or sign up with email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div> */}

            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              <Input
                label="Full Name"
                placeholder="Lavish Singhal"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Email Address"
                placeholder="Lavish@example.com"
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
                <input type="checkbox" className="mt-1 h-4 w-4 rounded" />

                <p className="text-[13px] text-slate-500">
                  I agree to the{" "}
                  <span className="font-medium text-[#635BFF]">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-[#635BFF]">
                    Privacy Policy
                  </span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#635BFF] py-3.5 font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label className="mb-2 block text-[15px] font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={currentType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-slate-900 placeholder:text-slate-500 outline-none transition-all hover:border-slate-400 focus:border-[#635BFF] focus:bg-white focus:ring-4 focus:ring-[#635BFF]/15"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-[#ECEAFB] bg-white px-5 py-3.5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF0FF] text-[#635BFF]">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold text-[#1E1B4B]">{title}</h3>

          <p className="mt-1 text-[13px] text-[#6D6A8A]">{description}</p>
        </div>
      </div>
    </div>
  );
}

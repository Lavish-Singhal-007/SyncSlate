"use client";

import Link from "next/link";
import { Pencil, ArrowRight, Users, Zap, Shield, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F6FF] font-sans text-slate-900">
      {/* NAVIGATION */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-[#F7F6FF] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF] text-white">
              <Pencil size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1E1B4B]">
              SyncSlate
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-slate-500">
            <Link
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="hidden md:block font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-[#635BFF] px-5 py-2.5 font-semibold text-white transition-all hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="mx-auto max-w-4xl text-[44px] font-bold leading-[1.1] tracking-tight text-[#1E1B4B] md:text-[64px]">
            The infinite canvas for <br />
            <span className="text-[#635BFF]">limitless collaboration</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[18px] leading-8 text-slate-500 md:text-[20px]">
            Bring your team's ideas into a single, real-time shared workspace.
            Brainstorm, sketch, wireframe, and build together without
            boundaries.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#635BFF] px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#635BFF]/25 sm:w-auto"
            >
              Start drawing for free
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="#demo"
              className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto"
            >
              Watch demo
            </Link>
          </div>
        </div>

        {/* Abstract Hero Illustration Area */}
        <div className="mx-auto mt-20 max-w-5xl px-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-slate-200 bg-[#F7F6FF] shadow-2xl shadow-slate-200/50">
            {/* Decorative Canvas Elements */}
            <div className="absolute left-20 top-20 h-48 w-72 rounded-3xl border border-[#E8E6FF] bg-white p-6 shadow-sm">
              <div className="h-4 w-32 rounded-full bg-slate-200" />
              <div className="mt-6 h-3 w-56 rounded-full bg-slate-100" />
              <div className="mt-4 h-3 w-48 rounded-full bg-slate-100" />
              <div className="mt-10 h-8 w-24 rounded-full bg-[#635BFF]" />
            </div>

            <div className="absolute right-32 top-10 h-32 w-36 rotate-6 rounded-2xl border border-yellow-300 bg-yellow-100 p-4 shadow-sm">
              <div className="h-3 w-20 rounded-full bg-yellow-300" />
              <div className="mt-4 h-3 w-24 rounded-full bg-yellow-300" />
            </div>

            <div className="absolute bottom-20 right-48 h-32 w-36 -rotate-3 rounded-2xl border border-green-300 bg-green-100 p-4 shadow-sm">
              <div className="h-3 w-16 rounded-full bg-green-300" />
              <div className="mt-4 h-3 w-20 rounded-full bg-green-300" />
            </div>

            {/* Connecting Lines */}
            <svg
              className="absolute inset-0 h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 380 180 C 500 180, 600 100, 750 120"
                stroke="#BDB7FF"
                strokeWidth="4"
                fill="none"
                strokeDasharray="8 8"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1E1B4B] md:text-4xl">
              Everything you need to think visually
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[17px] text-slate-500">
              Powerful tools packaged in an intuitive, distraction-free
              interface.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Users size={24} />}
              title="Real-time Multiplayer"
              description="See cursors move instantly. Collaborate with dozens of teammates on the same canvas without any lag."
            />
            <FeatureCard
              icon={<Zap size={24} />}
              title="Lightning Fast"
              description="Built on modern web technologies ensuring your canvas stays smooth even with thousands of elements."
            />
            <FeatureCard
              icon={<Globe size={24} />}
              title="Share Anywhere"
              description="Generate a secure link and invite anyone to view or edit your canvas. No account required for guests."
            />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-[40px] bg-[#635BFF] px-8 py-16 text-center shadow-xl shadow-[#635BFF]/20 md:px-16 md:py-20">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ready to clear the slate?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[18px] text-white/80">
              Join thousands of teams already using SyncSlate to brainstorm,
              plan, and design together.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/signup"
                className="rounded-2xl bg-white px-8 py-4 font-bold text-[#635BFF] transition-transform hover:scale-105"
              >
                Create your free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#635BFF] text-white">
              <Pencil size={14} />
            </div>
            <span className="text-lg font-bold text-[#1E1B4B]">SyncSlate</span>
          </div>

          <div className="text-[14px] text-slate-500">
            © {new Date().getFullYear()} SyncSlate Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable Feature Card component maintaining the established aesthetic
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
    <div className="rounded-3xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg hover:shadow-slate-100">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#635BFF]">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-[#1E1B4B]">{title}</h3>
      <p className="leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

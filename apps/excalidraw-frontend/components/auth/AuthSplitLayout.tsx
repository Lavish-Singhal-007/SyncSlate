import { Pencil } from "lucide-react";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
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
            <div className="text-center">
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

            {/* Dynamic Page Content Injected Here */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

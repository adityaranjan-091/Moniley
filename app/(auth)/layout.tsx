import Image from "next/image";
import React from "react";
import { TrendingUp, Star } from "lucide-react";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="flex min-h-screen w-full bg-background">
            {/* ── Left — Form Panel ─────────────────────────────── */}
            <section className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 xl:w-[45%]">
                {/* Subtle top gradient wash */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.04] to-transparent" />

                {/* Logo — centered at top */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                    <Image
                        src="/logo.png"
                        alt="Moniley"
                        width={270}
                        height={90}
                        className="h-20 w-auto"
                    />
                </div>

                {/* Form slot */}
                <div className="relative z-10 w-full max-w-sm mt-12">
                    {children}
                </div>

                {/* Bottom gradient wash */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary/[0.03] to-transparent" />
            </section>

            {/* ── Right — Marketing Panel (desktop only) ─────────── */}
            <section className="auth-marketing-panel relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col items-center justify-between overflow-hidden rounded-l-[2rem] my-3 mr-3">
                {/* Starry sky background */}
                <Image
                    src="/auth-bg.png"
                    alt="background"
                    fill
                    className="object-cover"
                    priority
                />

                {/* Overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/70 via-[#0a0e1a]/30 to-[#0a1a1a]/85" />

                {/* Animated grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Decorative glow orbs */}
                <div className="auth-orb-1 absolute top-[15%] right-[20%] h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
                <div className="auth-orb-2 absolute bottom-[25%] left-[10%] h-48 w-48 rounded-full bg-cyan-500/8 blur-[80px]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-between h-full w-full p-12 text-white">

                    {/* Center — Headline + Widget */}
                    <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
                        {/* Headline */}
                        <div className="space-y-4">
                            <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] max-w-md tracking-tight">
                                Track spend, ask anything.{" "}
                                <br className="hidden xl:block" />
                                <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 bg-clip-text text-transparent">
                                    Own your wealth.
                                </span>
                            </h1>

                            {/* Social proof badge */}
                            <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/[0.07] backdrop-blur-xl px-5 py-2.5 text-sm font-medium shadow-lg shadow-black/10">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="size-3.5 fill-yellow-300 text-yellow-300" />
                                    ))}
                                </div>
                                <span className="text-white/70 text-xs">Trusted by early users</span>
                            </div>
                        </div>

                        {/* Mock spending widget */}
                        <div className="auth-float-card w-full max-w-xs rounded-2xl border border-white/[0.12] bg-white/[0.07] backdrop-blur-2xl p-6 shadow-2xl shadow-black/20 text-left">
                            {/* Card header */}
                            <div className="flex items-center justify-between mb-5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
                                    Spending This Month
                                </span>
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-white/50 transition-colors hover:bg-white/10 hover:text-white/80 cursor-pointer">
                                    <span className="text-sm font-bold leading-none">+</span>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="mb-6">
                                <p className="text-[2rem] font-bold tracking-tight leading-none">$2,132</p>
                                <p className="text-xs text-white/45 mt-1.5 flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400 font-medium">
                                        <TrendingUp className="size-3" />
                                        +4.2%
                                    </span>
                                    vs last month
                                </p>
                            </div>

                            {/* Mini sparkline chart */}
                            <div className="relative h-20">
                                <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                                        </linearGradient>
                                        <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.4" />
                                            <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M0,55 C20,52 40,45 60,42 C80,39 100,35 120,28 C140,21 160,14 180,8 L200,4 L200,60 L0,60 Z"
                                        fill="url(#sparkGrad)"
                                    />
                                    <path
                                        d="M0,55 C20,52 40,45 60,42 C80,39 100,35 120,28 C140,21 160,14 180,8 L200,4"
                                        fill="none"
                                        stroke="url(#sparkLine)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    {/* Animated endpoint dot */}
                                    <circle cx="200" cy="4" r="3" fill="#34d399" className="auth-pulse-dot" />
                                    <circle cx="200" cy="4" r="3" fill="#34d399" opacity="0.4" className="auth-pulse-ring" />
                                </svg>
                                {/* X-axis labels */}
                                <div className="absolute -bottom-5 inset-x-0 flex justify-between text-[10px] text-white/30 font-medium">
                                    <span>01</span>
                                    <span>07</span>
                                    <span>14</span>
                                    <span>21</span>
                                    <span>28</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom footer */}
                    <p className="text-xs text-white/25 tracking-wide">
                        © {new Date().getFullYear()} Moniley. All rights reserved.
                    </p>
                </div>
            </section>
        </main>
    );
}
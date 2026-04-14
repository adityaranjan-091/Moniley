import Image from "next/image";
import React from "react";
import Link from "next/link";
import { TrendingUp, Star, Award } from "lucide-react";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="flex min-h-screen w-full bg-background">
            {/* ── Left — Form Panel ─────────────────────────────── */}
            <section className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 xl:w-[45%]">
                {/* Logo — centered at top */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                    <Image
                        src="/logo.png"
                        alt="Moniley"
                        width={36}
                        height={36}
                        className="h-9 w-auto"
                    />
                </div>

                {/* Form slot */}
                <div className="w-full max-w-sm mt-12">
                    {children}
                </div>
            </section>

            {/* ── Right — Marketing Panel (desktop only) ─────────── */}
            <section className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col items-center justify-between overflow-hidden rounded-l-[2rem] my-3 mr-3">
                {/* Starry sky background */}
                <Image
                    src="/auth-bg.png"
                    alt="background"
                    fill
                    className="object-cover"
                    priority
                />

                {/* Overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/60 via-transparent to-[#0a1a1a]/80" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-between h-full w-full p-12 text-white">

                    {/* Top — Logo */}
                    <div className="self-start flex items-center gap-2.5">
                        <Image
                            src="/logo.png"
                            alt="Moniley"
                            width={32}
                            height={32}
                            className="h-8 w-auto brightness-0 invert"
                        />
                        <span className="text-lg font-bold tracking-tight">Moniley</span>
                    </div>

                    {/* Center — Headline + Social Proof */}
                    <div className="flex flex-col items-center gap-8 text-center">
                        <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] max-w-sm">
                            Track spend, ask anything.{" "}
                            <br className="hidden xl:block" />
                            Own your wealth.
                        </h1>

                        {/* Social proof badge */}
                        <div className="flex items-center gap-3 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-5 py-2.5 text-sm font-medium">
                            <Award className="size-4 text-yellow-300" />
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="size-3 fill-yellow-300 text-yellow-300" />
                                ))}
                            </div>
                            <span className="text-white/90 font-semibold tracking-wide">100K+ MEMBERS</span>
                        </div>

                        {/* Mock spending widget */}
                        <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 shadow-2xl text-left">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                                    Spending This Month
                                </span>
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 text-white/70 hover:bg-white/10 cursor-pointer">
                                    <span className="text-sm font-bold leading-none">+</span>
                                </div>
                            </div>

                            <div className="mb-5">
                                <p className="text-3xl font-bold">$2,132</p>
                                <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                                    <TrendingUp className="size-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">+4.2%</span>
                                    &nbsp;vs last month
                                </p>
                            </div>

                            {/* Mini sparkline chart */}
                            <div className="relative h-20">
                                <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M0,55 C20,52 40,45 60,42 C80,39 100,35 120,28 C140,21 160,14 180,8 L200,4 L200,60 L0,60 Z"
                                        fill="url(#sparkGrad)"
                                    />
                                    <path
                                        d="M0,55 C20,52 40,45 60,42 C80,39 100,35 120,28 C140,21 160,14 180,8 L200,4"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                {/* X-axis labels */}
                                <div className="absolute -bottom-5 inset-x-0 flex justify-between text-[10px] text-white/35 font-medium">
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
                    <p className="text-xs text-white/30">
                        © {new Date().getFullYear()} Moniley. All rights reserved.
                    </p>
                </div>
            </section>
        </main>
    );
}
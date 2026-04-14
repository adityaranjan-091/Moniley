import Link from "next/link";
import Image from "next/image";
import React from "react";
import { ArrowRight, Shield, Zap, PieChart } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-primary/30">
      {/* Background Glowing Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70" />
      <div className="absolute top-40 -right-20 w-96 h-96 bg-chart-3/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-secondary/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto w-full px-6">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Moniley"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Moniley
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-grow flex flex-col items-center justify-center text-center py-24 gap-8">
          <div className="flex flex-col items-center gap-6 max-w-3xl">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
              Master your money{" "}
              <br className="hidden sm:block" />
              with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-3">
                Moniley
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              The intelligent financial dashboard that helps you track expenses,
              analyze spending habits, and grow your wealth seamlessly.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/signup"
              className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              Start for free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-secondary/50 backdrop-blur-md border border-border px-7 py-3.5 text-sm font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 hover:scale-105 active:scale-95"
            >
              Log in
            </Link>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-border/50 mt-4" />

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl text-left mt-2">
            <FeatureCard
              icon={<Zap className="size-5 text-chart-2" />}
              title="Lightning Fast"
              description="Instantly view your financial data with a dashboard that loads in milliseconds, keeping you focused on what matters."
            />
            <FeatureCard
              icon={<PieChart className="size-5 text-primary" />}
              title="Smart Analytics"
              description="Visual breakdowns of your expenses help you understand exactly where your money goes with interactive charts."
            />
            <FeatureCard
              icon={<Shield className="size-5 text-chart-4" />}
              title="Bank-grade Security"
              description="Your financial data is encrypted and securely stored. We prioritize your privacy and never share your information."
            />
          </div>
        </main>
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="inline-flex rounded-xl bg-background/80 p-3 border border-border/40 w-fit transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-card-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
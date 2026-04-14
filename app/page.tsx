import Link from "next/link";
import React from "react";
import { ArrowRight, Shield, Zap, Wallet, PieChart, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-primary/30">
      {/* Background Glowing Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70" />
      <div className="absolute top-40 -right-20 w-96 h-96 bg-chart-3/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-secondary/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation / Header */}
        <header className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Wallet className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Moniley</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col items-center justify-center pt-16 pb-32 px-4 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mb-6 leading-[1.1]">
            Master your money with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-3">
              Moniley
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-medium">
            The intelligent financial dashboard that helps you track expenses, analyze spending habits, and grow your wealth seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              Start for free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-secondary/50 backdrop-blur-md border border-border px-8 py-4 text-sm font-semibold text-secondary-foreground shadow-sm transition-all hover:bg-secondary/80 hover:scale-105 active:scale-95"
            >
              Log in to Dashboard
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full px-4 text-left">
            <FeatureCard
              icon={<Zap className="size-6 text-chart-2" />}
              title="Lightning Fast"
              description="Instantly view your financial data with a dashboard that loads in milliseconds, keeping you focused exactly on what matters."
            />
            <FeatureCard
              icon={<PieChart className="size-6 text-primary" />}
              title="Smart Analytics"
              description="Visual breakdowns of your expenses help you understand exactly where your money goes with vibrant interactive charts."
            />
            <FeatureCard
              icon={<Shield className="size-6 text-chart-4" />}
              title="Bank-grade Security"
              description="Your financial data is encrypted and securely stored. We prioritize your privacy and never share your personal information."
            />
          </div>
        </main>

        <footer className="mt-auto py-8 text-center text-sm text-muted-foreground bg-background/50 backdrop-blur-sm border-t border-border/50">
          <p>© {new Date().getFullYear()} Moniley. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-6 inline-flex rounded-2xl bg-background/80 p-4 shadow-sm border border-border/50 transition-transform duration-300 group-hover:scale-110 group-hover:bg-background">
          {icon}
        </div>
        <h3 className="mb-3 text-xl font-bold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}

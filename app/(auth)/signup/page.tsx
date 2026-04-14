"use client";

import { useEffect, useState, FormEvent, ChangeEvent, JSX } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

// ── TYPES ───────────────────────────────────────────────────────────
interface SignupFormData {
  name: string;
  email: string;
  password: string;
}

// ── VALIDATION ─────────────────────────────────────────────────────
const validateForm = (data: SignupFormData): string | null => {
  if (!data.name?.trim() || data.name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return "Please enter a valid email";
  }
  if (data.password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
};

// ── COMPONENT ──────────────────────────────────────────────────────
export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const { user, loading, signUpWithEmail, signInWithGoogle } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUpWithEmail(formData);
      router.push("/dashboard");
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "Google sign-in failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const inputClasses =
    "w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground " +
    "placeholder:text-muted-foreground/60 transition-all outline-none " +
    "focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

  return (
    <div className="flex flex-col items-center text-center">
      {/* Logo — mobile only */}
      <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
        <Image src="/logo.png" alt="Moniley" width={32} height={32} className="h-8 w-auto" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
      <p className="text-sm text-muted-foreground mb-7">Join Moniley and take control of your finances</p>

      {/* Social Auth Buttons */}
      <div className="mb-5 w-full">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted hover:border-primary/30 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
      </div>

      {/* Divider */}
      <div className="mb-5 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-primary font-medium">Or sign up with email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 w-full rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive text-left" role="alert">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-3" aria-label="Signup form">
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Full Name"
          className={inputClasses}
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          required
          aria-invalid={!!error}
        />

        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          className={inputClasses}
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
          aria-invalid={!!error}
        />

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={`${inputClasses} pr-11`}
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            aria-invalid={!!error}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-left text-xs text-muted-foreground">Must be at least 8 characters</p>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm transition-all hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

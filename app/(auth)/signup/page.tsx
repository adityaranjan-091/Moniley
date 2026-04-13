"use client";

import { useEffect, useState, FormEvent, ChangeEvent, JSX } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// ── TYPES ───────────────────────────────────────────────────────────
interface SignupFormData {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
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
    if (error) setError(null); // Clear error on input
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

  const inputBaseClasses =
    "w-full px-4 py-3 border rounded-lg bg-background text-foreground " +
    "border-border hover:border-muted-foreground focus:outline-none " +
    "focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 bg-card p-8 rounded-lg shadow-lg"
        aria-label="Signup form"
      >
        <h1 className="text-3xl font-bold text-center text-foreground mb-6">
          Create Account
        </h1>

        {error && (
          <div
            role="alert"
            className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={inputBaseClasses}
              required
              aria-invalid={!!error}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={inputBaseClasses}
              required
              aria-invalid={!!error}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={`${inputBaseClasses} pr-12`}
                required
                aria-invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="w-full rounded-lg border py-3 px-4 font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}

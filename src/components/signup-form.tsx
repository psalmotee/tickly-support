"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, login } from "@/lib/auth-client";
import { validateSignupForm } from "@/lib/form-validation";
import { FormError } from "./form-error";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "./auth-provider";

export function SignupForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    const validation = validateSignupForm(
      fullName,
      email,
      password,
      confirmPassword,
    );

    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((err) => {
        errors[err.field] = err.message;
      });
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    const signupResult = await signup(
      fullName,
      email,
      password,
      confirmPassword,
    );

    if (!signupResult.success) {
      setError(signupResult.error || "Signup failed");
      setIsLoading(false);
      return;
    }

    // Auto-login after signup
    const loginResult = await login(email, password);

    if (loginResult.success && loginResult.session) {
      setSession(loginResult.session);
      router.push("/user-dashboard");
    } else {
      setError("Signup successful, but login failed. Please try logging in.");
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border border-border bg-card p-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Create account
        </h1>
        <p className="text-muted-foreground mb-6">
          Join Tickly and start managing tickets
        </p>

        {error && <FormError message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              className={`w-full rounded-lg border px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                fieldErrors.name
                  ? "border-destructive bg-destructive/5"
                  : "border-input bg-background"
              }`}
              disabled={isLoading}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full rounded-lg border px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                fieldErrors.email
                  ? "border-destructive bg-destructive/5"
                  : "border-input bg-background"
              }`}
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full rounded-lg border px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  fieldErrors.password
                    ? "border-destructive bg-destructive/5"
                    : "border-input bg-background"
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full rounded-lg border px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  fieldErrors.confirmPassword
                    ? "border-destructive bg-destructive/5"
                    : "border-input bg-background"
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

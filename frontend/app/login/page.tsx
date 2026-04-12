'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cog, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Brand Sidebar ── */}
      <div className="login-brand-panel relative hidden flex-col justify-between overflow-hidden bg-shift-green p-10 lg:flex lg:w-[45%]">
        {/* Floating decorative elements - OPTIMIZED: reduced blur intensity */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-lg" />
        <div className="absolute bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5 blur-lg" />
        <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-shift-green-accent/20 blur-xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Cog className="h-6 w-6 text-white/90" strokeWidth={2} />
            <span className="text-xl font-semibold tracking-tight text-white">
              Shift-Engine
            </span>
          </Link>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-sm">
          <h2 className="mb-4 text-3xl font-bold leading-snug tracking-tight text-white">
            Know exactly who drives your restaurant forward.
          </h2>
          <p className="text-base leading-relaxed text-white/70">
            Turn your Toast POS data into actionable server performance
            scorecards — in seconds, not spreadsheets.
          </p>

          {/* Floating badge preview - OPTIMIZED: removed backdrop-blur-sm */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5">
              <span className="text-sm font-bold text-emerald-300">
                🟢 $201/hr Sales
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5">
              <span className="text-sm font-bold text-white/90">
                ⚙️ 94 Score
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Shift-Engine. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-shift-offwhite px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <Cog className="h-6 w-6 text-shift-green" strokeWidth={2} />
            <span className="text-xl font-semibold tracking-tight text-shift-text-dark">
              Shift-Engine
            </span>
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-shift-text-dark">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-shift-text-light">
              {mode === 'login'
                ? 'Sign in to access your performance dashboard.'
                : 'Get started with your free account today.'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-[13px] font-medium text-shift-text-dark"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                required
                autoComplete="email"
                className="login-input w-full rounded-lg border border-shift-border bg-white px-4 py-3 text-sm text-shift-text-dark placeholder-shift-text-light/50 outline-none transition-all focus:border-shift-green focus:ring-2 focus:ring-shift-green/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-[13px] font-medium text-shift-text-dark"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="login-input w-full rounded-lg border border-shift-border bg-white px-4 py-3 pr-11 text-sm text-shift-text-dark placeholder-shift-text-light/50 outline-none transition-all focus:border-shift-green focus:ring-2 focus:ring-shift-green/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-shift-text-light/60 transition-colors hover:text-shift-text-dark"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password (login only) */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[13px] font-medium text-shift-green transition-colors hover:text-shift-green-accent"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-shift-brown px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-shift-brown-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-shift-border" />
            <span className="text-xs text-shift-text-light">or</span>
            <div className="h-px flex-1 bg-shift-border" />
          </div>

          {/* Toggle mode */}
          <p className="text-center text-sm text-shift-text-light">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-semibold text-shift-green transition-colors hover:text-shift-green-accent"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-semibold text-shift-green transition-colors hover:text-shift-green-accent"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

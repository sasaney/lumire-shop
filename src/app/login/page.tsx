"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [tab, setTab] = useState<"password" | "otp">("password");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  // ورود با رمز عبور
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ورود با کد ایمیلی
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setOtpSent(true);
      if (data.devCode) setDevCode(data.devCode);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-2xl font-extrabold text-center mb-2">ورود به لومیر</h1>
      <p className="text-center text-neutral-500 text-sm mb-8">
        حساب ندارید؟{" "}
        <Link href="/register" className="text-rose-600 font-bold">
          ثبت‌نام کنید
        </Link>
      </p>

      <div className="flex bg-rose-50 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("password")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
            tab === "password" ? "bg-white text-rose-700 shadow-sm" : "text-neutral-500"
          }`}
        >
          ورود با رمز عبور
        </button>
        <button
          onClick={() => setTab("otp")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
            tab === "otp" ? "bg-white text-rose-700 shadow-sm" : "text-neutral-500"
          }`}
        >
          ورود با کد ایمیلی
        </button>
      </div>

      {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-4">{error}</div>}

      {tab === "password" ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="ایمیل"
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="رمز عبور"
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
          />
          <button
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition disabled:opacity-60"
          >
            {loading ? "..." : "ورود"}
          </button>
        </form>
      ) : !otpSent ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <input
            value={otpEmail}
            onChange={(e) => setOtpEmail(e.target.value)}
            type="email"
            placeholder="ایمیل"
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
          />
          <button
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition disabled:opacity-60"
          >
            {loading ? "..." : "ارسال کد تایید"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-neutral-500">
            کد ۵ رقمی به {otpEmail} ارسال شد.
          </p>
          {devCode && (
            <div className="text-xs bg-sage-50 text-sage-600 rounded-xl p-3">
              (حالت آزمایشی — بدون تنظیم SMTP) کد شما: <b>{devCode}</b>
            </div>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="کد ۵ رقمی"
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none text-center tracking-[0.5em]"
            maxLength={5}
          />
          <button
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition disabled:opacity-60"
          >
            {loading ? "..." : "تایید و ورود"}
          </button>
          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="w-full text-sm text-neutral-400"
          >
            تغییر ایمیل
          </button>
        </form>
      )}
    </div>
  );
}

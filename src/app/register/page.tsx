"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-2xl font-extrabold text-center mb-2">ساخت حساب کاربری</h1>
      <p className="text-center text-neutral-500 text-sm mb-8">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="text-rose-600 font-bold">
          ورود
        </Link>
      </p>

      {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام و نام‌خانوادگی"
          className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="ایمیل"
          dir="ltr"
          className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="شماره موبایل (اختیاری)"
          dir="ltr"
          className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="رمز عبور (حداقل ۶ کاراکتر)"
          dir="ltr"
          className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
        />
        <button
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition disabled:opacity-60"
        >
          {loading ? "..." : "ثبت‌نام"}
        </button>
      </form>
    </div>
  );
}

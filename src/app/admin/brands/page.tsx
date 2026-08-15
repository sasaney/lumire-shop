"use client";

import { useEffect, useState } from "react";
import type { Brand } from "@/lib/types";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [nameFa, setNameFa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [logo, setLogo] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/brands");
    const data = await res.json();
    setBrands(data.brands || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nameFa.trim()) return;
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameFa, nameEn, logo }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setNameFa("");
    setNameEn("");
    setLogo("");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("این برند حذف شود؟")) return;
    const res = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    load();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold">مدیریت برندها</h1>

      <form onSubmit={handleAdd} className="bg-white border border-rose-100 rounded-2xl p-4 grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs font-bold mb-1.5">نام فارسی برند</label>
          <input
            value={nameFa}
            onChange={(e) => setNameFa(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-rose-100 text-sm focus-ring outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5">نام انگلیسی (اختیاری)</label>
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-rose-100 text-sm focus-ring outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5">آدرس لوگو (اختیاری)</label>
          <input
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-rose-100 text-sm focus-ring outline-none"
          />
        </div>
        <button className="sm:col-span-3 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition w-fit">
          افزودن برند
        </button>
      </form>

      {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</div>}

      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-rose-50 text-neutral-500">
            <tr>
              <th className="text-right p-3">لوگو</th>
              <th className="text-right p-3">نام فارسی</th>
              <th className="text-right p-3">نام انگلیسی</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-t border-rose-50">
                <td className="p-3">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt="" className="w-9 h-9 rounded-lg object-contain bg-rose-50" />
                  ) : (
                    <span className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-xs text-neutral-400">—</span>
                  )}
                </td>
                <td className="p-3 font-medium">{b.nameFa}</td>
                <td className="p-3 text-neutral-400" dir="ltr">{b.nameEn}</td>
                <td className="p-3 text-left">
                  <button onClick={() => handleDelete(b.id)} className="text-rose-600 hover:underline">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {brands.length === 0 && (
          <div className="p-6 text-center text-sm text-neutral-400">برندی ثبت نشده.</div>
        )}
      </div>
    </div>
  );
}

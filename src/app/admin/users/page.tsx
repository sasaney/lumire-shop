"use client";

import { useEffect, useState } from "react";
import type { Role, User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    setUsers((await res.json()).users || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function setRole(userId: string, role: Role) {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "تغییر نقش ناموفق بود.");
        return;
      }
      await load();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">کاربران</h1>
        <p className="text-sm text-neutral-500 mt-1">
          می‌توانید نقش هر کاربر را بین «مدیر» و «خریدار» تغییر دهید. بیش از یک مدیر مجاز است.
        </p>
      </div>
      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-rose-50 text-neutral-500">
            <tr>
              <th className="text-right p-3">نام</th>
              <th className="text-right p-3">ایمیل</th>
              <th className="text-right p-3">نقش</th>
              <th className="text-right p-3">تاریخ عضویت</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-rose-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3" dir="ltr">
                  {u.email}
                </td>
                <td className="p-3">
                  <select
                    value={u.role}
                    disabled={savingId === u.id}
                    onChange={(e) => setRole(u.id, e.target.value as Role)}
                    className="px-3 py-1.5 rounded-lg border border-rose-100 text-sm font-bold bg-white"
                  >
                    <option value="CUSTOMER">خریدار</option>
                    <option value="ADMIN">مدیر</option>
                  </select>
                </td>
                <td className="p-3 text-neutral-400">
                  {new Date(u.createdAt).toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-400">
                  کاربری ثبت نشده.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

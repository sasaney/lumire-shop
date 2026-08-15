"use client";

import { useState } from "react";

export default function NamePromptModal({
  title,
  initialValue = "",
  extraField,
  onCancel,
  onConfirm,
}: {
  title: string;
  initialValue?: string;
  extraField?: { label: string; initialValue?: string };
  onCancel: () => void;
  onConfirm: (value: string, extraValue?: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [extraValue, setExtraValue] = useState(extraField?.initialValue || "");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <h3 className="font-extrabold mb-4">{title}</h3>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !extraField && value.trim() && onConfirm(value.trim())}
          className="w-full px-4 py-2.5 rounded-xl border border-rose-100 focus-ring outline-none text-sm"
        />
        {extraField && (
          <input
            value={extraValue}
            onChange={(e) => setExtraValue(e.target.value)}
            placeholder={extraField.label}
            dir="ltr"
            className="w-full mt-3 px-4 py-2.5 rounded-xl border border-rose-100 focus-ring outline-none text-sm"
          />
        )}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => value.trim() && onConfirm(value.trim(), extraValue)}
            disabled={!value.trim()}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition disabled:opacity-50"
          >
            ذخیره
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-rose-100 text-sm font-bold"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

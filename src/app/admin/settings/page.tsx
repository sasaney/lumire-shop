"use client";

import { useEffect, useState } from "react";
import type {
  FooterColumn,
  FooterLink,
  FooterSettings,
  FooterSocial,
  HeroSlide,
  LandingSection,
  SiteSettings,
  TestimonialItem,
  TrustBadgeItem,
} from "@/lib/types";
import {
  defaultFooter,
  defaultLandingSections,
  defaultTestimonials,
  defaultTrustBadges,
} from "@/lib/types";

const emptySlide: Omit<HeroSlide, "id"> = {
  image: "",
  title: "",
  subtitle: "",
  link: "/",
  active: true,
  priority: 1,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [newSlide, setNewSlide] = useState(emptySlide);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"general" | "footer" | "landing" | "slides">("general");

  async function load() {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    const s = data.settings as SiteSettings;
    if (!s.footer) s.footer = defaultFooter();
    if (!s.landingSections?.length) s.landingSections = defaultLandingSections();
    if (!s.trustBadges?.length) s.trustBadges = defaultTrustBadges();
    if (!s.testimonials?.length) s.testimonials = defaultTestimonials();
    setSettings(s);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings(patch: Partial<SiteSettings>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      setSettings(data.settings);
    } finally {
      setSaving(false);
    }
  }

  function updateFooter(patch: Partial<FooterSettings>) {
    if (!settings) return;
    const footer = { ...settings.footer, ...patch };
    saveSettings({ footer, footerText: footer.aboutText });
  }

  function addSlide() {
    if (!settings || !newSlide.image || !newSlide.title) return;
    const slide: HeroSlide = { ...newSlide, id: `slide-${Date.now()}` };
    saveSettings({ slides: [...settings.slides, slide] });
    setNewSlide(emptySlide);
  }

  function removeSlide(id: string) {
    if (!settings) return;
    saveSettings({ slides: settings.slides.filter((s) => s.id !== id) });
  }

  function toggleSlideActive(id: string) {
    if (!settings) return;
    saveSettings({
      slides: settings.slides.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    });
  }

  function movePriority(id: string, dir: -1 | 1) {
    if (!settings) return;
    const sorted = [...settings.slides].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const tmp = sorted[idx].priority;
    sorted[idx].priority = sorted[swapWith].priority;
    sorted[swapWith].priority = tmp;
    saveSettings({ slides: sorted });
  }

  function moveSection(id: string, dir: -1 | 1) {
    if (!settings) return;
    const sorted = [...settings.landingSections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const tmp = sorted[idx].order;
    sorted[idx].order = sorted[swapWith].order;
    sorted[swapWith].order = tmp;
    saveSettings({ landingSections: sorted });
  }

  function toggleSection(id: string) {
    if (!settings) return;
    saveSettings({
      landingSections: settings.landingSections.map((s) =>
        s.id === id ? { ...s, active: !s.active } : s
      ),
    });
  }

  if (!settings) {
    return <div className="py-10 text-center text-neutral-400">در حال بارگذاری...</div>;
  }

  const sortedSlides = [...settings.slides].sort((a, b) => a.priority - b.priority);
  const sortedSections = [...settings.landingSections].sort((a, b) => a.order - b.order);
  const footer = settings.footer || defaultFooter();

  const tabs = [
    ["general", "عمومی"],
    ["slides", "اسلایدر"],
    ["landing", "لندینگ"],
    ["footer", "فوتر"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">تنظیمات سایت</h1>
        {saving && <div className="text-xs text-neutral-400">در حال ذخیره...</div>}
      </div>

      <div className="flex flex-wrap gap-1 bg-white border border-rose-100 rounded-2xl p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === id ? "bg-rose-600 text-white" : "text-neutral-500 hover:bg-rose-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
          <div className="font-bold">پیام هدر</div>
          <input
            defaultValue={settings.headerText}
            onBlur={(e) => saveSettings({ headerText: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-rose-100"
            placeholder="مثلاً: ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان"
          />
          <p className="text-xs text-neutral-400">
            فوتر، اسلایدر و بخش‌های صفحه اول را از تب‌های مربوطه مدیریت کنید.
          </p>
        </div>
      )}

      {tab === "slides" && (
        <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-4">
          <div className="font-bold">اسلایدر صفحه اول</div>
          <div className="space-y-2">
            {sortedSlides.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 border border-rose-100 rounded-xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" className="w-16 h-12 rounded-lg object-cover bg-rose-50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm line-clamp-1">{s.title}</div>
                  <div className="text-xs text-neutral-400 line-clamp-1">{s.subtitle}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => movePriority(s.id, -1)} disabled={i === 0} className="w-7 h-7 rounded border border-rose-100 disabled:opacity-30">▲</button>
                  <button type="button" onClick={() => movePriority(s.id, 1)} disabled={i === sortedSlides.length - 1} className="w-7 h-7 rounded border border-rose-100 disabled:opacity-30">▼</button>
                  <button type="button" onClick={() => toggleSlideActive(s.id)} className={`text-xs px-2 py-1.5 rounded-full font-bold ${s.active ? "bg-sage-50 text-sage-600" : "bg-neutral-100 text-neutral-400"}`}>
                    {s.active ? "فعال" : "غیرفعال"}
                  </button>
                  <button type="button" onClick={() => removeSlide(s.id)} className="text-xs text-rose-600 px-2">حذف</button>
                </div>
              </div>
            ))}
            {sortedSlides.length === 0 && <div className="text-sm text-neutral-400">اسلایدی ثبت نشده.</div>}
          </div>
          <div className="border-t border-rose-100 pt-4 grid sm:grid-cols-2 gap-3">
            <input placeholder="آدرس تصویر اسلاید" value={newSlide.image} onChange={(e) => setNewSlide({ ...newSlide, image: e.target.value })} dir="ltr" className="px-4 py-2.5 rounded-xl border border-rose-100 sm:col-span-2" />
            <input placeholder="عنوان اسلاید" value={newSlide.title} onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })} className="px-4 py-2.5 rounded-xl border border-rose-100" />
            <input placeholder="زیرعنوان" value={newSlide.subtitle} onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })} className="px-4 py-2.5 rounded-xl border border-rose-100" />
            <input placeholder="لینک" value={newSlide.link} onChange={(e) => setNewSlide({ ...newSlide, link: e.target.value })} dir="ltr" className="px-4 py-2.5 rounded-xl border border-rose-100 sm:col-span-2" />
            <button type="button" onClick={addSlide} className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700">+ افزودن اسلاید</button>
          </div>
        </div>
      )}

      {tab === "landing" && (
        <div className="space-y-5">
          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
            <div className="font-bold">بخش‌های صفحه اول</div>
            <p className="text-xs text-neutral-400">ترتیب و نمایش هر بخش را مدیریت کنید.</p>
            {sortedSections.map((sec, i) => (
              <div key={sec.id} className="flex items-center gap-2 border border-rose-100 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{sec.title || sec.type}</div>
                  <div className="text-xs text-neutral-400" dir="ltr">{sec.type}</div>
                </div>
                <button type="button" onClick={() => moveSection(sec.id, -1)} disabled={i === 0} className="w-7 h-7 rounded border border-rose-100 disabled:opacity-30">▲</button>
                <button type="button" onClick={() => moveSection(sec.id, 1)} disabled={i === sortedSections.length - 1} className="w-7 h-7 rounded border border-rose-100 disabled:opacity-30">▼</button>
                <button type="button" onClick={() => toggleSection(sec.id)} className={`text-xs px-2 py-1.5 rounded-full font-bold ${sec.active ? "bg-sage-50 text-sage-600" : "bg-neutral-100 text-neutral-400"}`}>
                  {sec.active ? "فعال" : "غیرفعال"}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold">نشان‌های اعتماد</div>
              <button
                type="button"
                className="text-xs text-rose-600 font-bold"
                onClick={() => {
                  const item: TrustBadgeItem = {
                    id: `tb-${Date.now()}`,
                    icon: "⭐",
                    title: "عنوان جدید",
                    desc: "توضیح",
                  };
                  saveSettings({ trustBadges: [...settings.trustBadges, item] });
                }}
              >
                + افزودن
              </button>
            </div>
            {settings.trustBadges.map((b, idx) => (
              <div key={b.id} className="grid grid-cols-[48px_1fr_1fr_auto] gap-2 items-center">
                <input
                  value={b.icon}
                  onChange={(e) => {
                    const trustBadges = settings.trustBadges.map((x, i) =>
                      i === idx ? { ...x, icon: e.target.value } : x
                    );
                    setSettings({ ...settings, trustBadges });
                  }}
                  onBlur={() => saveSettings({ trustBadges: settings.trustBadges })}
                  className="px-2 py-2 rounded-xl border border-rose-100 text-center"
                />
                <input
                  value={b.title}
                  onChange={(e) => {
                    const trustBadges = settings.trustBadges.map((x, i) =>
                      i === idx ? { ...x, title: e.target.value } : x
                    );
                    setSettings({ ...settings, trustBadges });
                  }}
                  onBlur={() => saveSettings({ trustBadges: settings.trustBadges })}
                  className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                  placeholder="عنوان"
                />
                <input
                  value={b.desc}
                  onChange={(e) => {
                    const trustBadges = settings.trustBadges.map((x, i) =>
                      i === idx ? { ...x, desc: e.target.value } : x
                    );
                    setSettings({ ...settings, trustBadges });
                  }}
                  onBlur={() => saveSettings({ trustBadges: settings.trustBadges })}
                  className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                  placeholder="توضیح"
                />
                <button
                  type="button"
                  className="text-xs text-rose-600"
                  onClick={() =>
                    saveSettings({ trustBadges: settings.trustBadges.filter((x) => x.id !== b.id) })
                  }
                >
                  حذف
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold">نظرات مشتریان</div>
              <button
                type="button"
                className="text-xs text-rose-600 font-bold"
                onClick={() => {
                  const item: TestimonialItem = {
                    id: `t-${Date.now()}`,
                    name: "نام مشتری",
                    text: "متن نظر...",
                    product: "",
                  };
                  saveSettings({ testimonials: [...settings.testimonials, item] });
                }}
              >
                + افزودن
              </button>
            </div>
            {settings.testimonials.map((t, idx) => (
              <div key={t.id} className="border border-rose-100 rounded-xl p-3 space-y-2">
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    value={t.name}
                    onChange={(e) => {
                      const testimonials = settings.testimonials.map((x, i) =>
                        i === idx ? { ...x, name: e.target.value } : x
                      );
                      setSettings({ ...settings, testimonials });
                    }}
                    onBlur={() => saveSettings({ testimonials: settings.testimonials })}
                    className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                    placeholder="نام"
                  />
                  <input
                    value={t.product || ""}
                    onChange={(e) => {
                      const testimonials = settings.testimonials.map((x, i) =>
                        i === idx ? { ...x, product: e.target.value } : x
                      );
                      setSettings({ ...settings, testimonials });
                    }}
                    onBlur={() => saveSettings({ testimonials: settings.testimonials })}
                    className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                    placeholder="نام محصول (اختیاری)"
                  />
                </div>
                <textarea
                  value={t.text}
                  onChange={(e) => {
                    const testimonials = settings.testimonials.map((x, i) =>
                      i === idx ? { ...x, text: e.target.value } : x
                    );
                    setSettings({ ...settings, testimonials });
                  }}
                  onBlur={() => saveSettings({ testimonials: settings.testimonials })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-rose-100 text-sm resize-none"
                  placeholder="متن نظر"
                />
                <button
                  type="button"
                  className="text-xs text-rose-600"
                  onClick={() =>
                    saveSettings({
                      testimonials: settings.testimonials.filter((x) => x.id !== t.id),
                    })
                  }
                >
                  حذف این نظر
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "footer" && (
        <div className="space-y-5">
          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
            <div className="font-bold">برند و درباره</div>
            <input
              defaultValue={footer.brandName}
              onBlur={(e) => updateFooter({ brandName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100"
              placeholder="نام برند"
            />
            <textarea
              defaultValue={footer.aboutText}
              onBlur={(e) => updateFooter({ aboutText: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100 resize-none"
              placeholder="متن درباره فروشگاه"
            />
            <input
              defaultValue={footer.copyright}
              onBlur={(e) => updateFooter({ copyright: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100"
              placeholder="متن کپی‌رایت"
            />
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold">ستون‌های لینک</div>
              <button
                type="button"
                className="text-xs text-rose-600 font-bold"
                onClick={() => {
                  const col: FooterColumn = {
                    id: `col-${Date.now()}`,
                    title: "ستون جدید",
                    links: [],
                  };
                  updateFooter({ columns: [...footer.columns, col] });
                }}
              >
                + ستون
              </button>
            </div>
            {footer.columns.map((col, cIdx) => (
              <div key={col.id} className="border border-rose-100 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={col.title}
                    onChange={(e) => {
                      const columns = footer.columns.map((c, i) =>
                        i === cIdx ? { ...c, title: e.target.value } : c
                      );
                      setSettings({ ...settings, footer: { ...footer, columns } });
                    }}
                    onBlur={() => updateFooter({ columns: footer.columns })}
                    className="flex-1 px-3 py-2 rounded-xl border border-rose-100 text-sm font-bold"
                  />
                  <button
                    type="button"
                    className="text-xs text-rose-600 px-2"
                    onClick={() =>
                      updateFooter({ columns: footer.columns.filter((c) => c.id !== col.id) })
                    }
                  >
                    حذف ستون
                  </button>
                </div>
                {col.links.map((link, lIdx) => (
                  <div key={link.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      value={link.label}
                      onChange={(e) => {
                        const columns = footer.columns.map((c, i) => {
                          if (i !== cIdx) return c;
                          const links = c.links.map((l, j) =>
                            j === lIdx ? { ...l, label: e.target.value } : l
                          );
                          return { ...c, links };
                        });
                        setSettings({ ...settings, footer: { ...footer, columns } });
                      }}
                      onBlur={() => updateFooter({ columns: footer.columns })}
                      className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                      placeholder="عنوان لینک"
                    />
                    <input
                      value={link.href}
                      onChange={(e) => {
                        const columns = footer.columns.map((c, i) => {
                          if (i !== cIdx) return c;
                          const links = c.links.map((l, j) =>
                            j === lIdx ? { ...l, href: e.target.value } : l
                          );
                          return { ...c, links };
                        });
                        setSettings({ ...settings, footer: { ...footer, columns } });
                      }}
                      onBlur={() => updateFooter({ columns: footer.columns })}
                      dir="ltr"
                      className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                      placeholder="/pages/..."
                    />
                    <button
                      type="button"
                      className="text-xs text-rose-600"
                      onClick={() => {
                        const columns = footer.columns.map((c, i) =>
                          i === cIdx ? { ...c, links: c.links.filter((l) => l.id !== link.id) } : c
                        );
                        updateFooter({ columns });
                      }}
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-rose-600 font-bold"
                  onClick={() => {
                    const link: FooterLink = {
                      id: `link-${Date.now()}`,
                      label: "لینک جدید",
                      href: "/",
                    };
                    const columns = footer.columns.map((c, i) =>
                      i === cIdx ? { ...c, links: [...c.links, link] } : c
                    );
                    updateFooter({ columns });
                  }}
                >
                  + لینک
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
            <div className="font-bold">تماس</div>
            <input
              defaultValue={footer.contactTitle}
              onBlur={(e) => updateFooter({ contactTitle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100"
              placeholder="عنوان بخش تماس"
            />
            <textarea
              defaultValue={footer.contactText}
              onBlur={(e) => updateFooter({ contactText: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100 resize-none"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                defaultValue={footer.phone}
                onBlur={(e) => updateFooter({ phone: e.target.value })}
                dir="ltr"
                className="px-4 py-2.5 rounded-xl border border-rose-100"
                placeholder="تلفن"
              />
              <input
                defaultValue={footer.email}
                onBlur={(e) => updateFooter({ email: e.target.value })}
                dir="ltr"
                className="px-4 py-2.5 rounded-xl border border-rose-100"
                placeholder="ایمیل"
              />
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold">شبکه‌های اجتماعی</div>
              <button
                type="button"
                className="text-xs text-rose-600 font-bold"
                onClick={() => {
                  const s: FooterSocial = {
                    id: `soc-${Date.now()}`,
                    label: "اینستاگرام",
                    href: "https://instagram.com/",
                  };
                  updateFooter({ socials: [...(footer.socials || []), s] });
                }}
              >
                + افزودن
              </button>
            </div>
            {(footer.socials || []).map((s, idx) => (
              <div key={s.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={s.label}
                  onChange={(e) => {
                    const socials = (footer.socials || []).map((x, i) =>
                      i === idx ? { ...x, label: e.target.value } : x
                    );
                    setSettings({ ...settings, footer: { ...footer, socials } });
                  }}
                  onBlur={() => updateFooter({ socials: footer.socials })}
                  className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                />
                <input
                  value={s.href}
                  onChange={(e) => {
                    const socials = (footer.socials || []).map((x, i) =>
                      i === idx ? { ...x, href: e.target.value } : x
                    );
                    setSettings({ ...settings, footer: { ...footer, socials } });
                  }}
                  onBlur={() => updateFooter({ socials: footer.socials })}
                  dir="ltr"
                  className="px-3 py-2 rounded-xl border border-rose-100 text-sm"
                />
                <button
                  type="button"
                  className="text-xs text-rose-600"
                  onClick={() =>
                    updateFooter({ socials: (footer.socials || []).filter((x) => x.id !== s.id) })
                  }
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

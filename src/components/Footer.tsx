import Link from "next/link";
import type { FooterSettings } from "@/lib/types";
import { defaultFooter } from "@/lib/types";

export default function Footer({
  footer,
  footerText,
}: {
  footer?: FooterSettings | null;
  footerText?: string;
}) {
  const f: FooterSettings = {
    ...defaultFooter(),
    ...(footer || {}),
  };
  if (!footer?.aboutText && footerText) {
    f.aboutText = footerText;
  }

  return (
    <footer className="mt-12 sm:mt-16 border-t border-[#EFE8E1] bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="text-lg font-extrabold text-[#D4AF37] mb-2">{f.brandName || "لومیر"}</div>
          <p className="text-neutral-500 leading-7">{f.aboutText}</p>
          {f.socials && f.socials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {f.socials.map((s) => (
                <a
                  key={s.id}
                  href={s.href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-[#F7EFE9] text-[#B89320] text-xs font-bold hover:bg-rose-100 transition"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {(f.columns || []).map((col) => (
          <div key={col.id}>
            <div className="font-bold mb-2">{col.title}</div>
            <ul className="space-y-1.5 text-neutral-500">
              {(col.links || []).map((link) => (
                <li key={link.id}>
                  {link.href?.startsWith("/") ? (
                    <Link href={link.href} className="hover:text-[#D4AF37] transition">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href || "#"} className="hover:text-[#D4AF37] transition">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <div className="font-bold mb-2">{f.contactTitle || "تماس با ما"}</div>
          <p className="text-neutral-500 leading-7">{f.contactText}</p>
          {f.phone && (
            <p className="mt-2 text-neutral-600" dir="ltr">
              {f.phone}
            </p>
          )}
          {f.email && (
            <p className="mt-1 text-neutral-600 break-all" dir="ltr">
              {f.email}
            </p>
          )}
        </div>
      </div>
      <div className="text-center text-xs text-neutral-400 pb-6 px-4">
        {f.copyright || `© ${new Date().getFullYear()} لومیر`}
      </div>
    </footer>
  );
}

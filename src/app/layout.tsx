import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageViewTracker from "@/components/PageViewTracker";
import { database } from "@/lib/db";

export const metadata: Metadata = {
  title: "LUMiR | درخشش طبیعی پوست",
  description:
    "خرید آنلاین محصولات آرایشی و بهداشتی با ارسال سریع و پرداخت در محل یا کارت به کارت.",
  applicationName: "LUMiR",
  formatDetection: {
    telephone: false,
  },
};

/** بدون این، موبایل صفحه را مثل دسکتاپ کوچک‌شده نشان می‌دهد */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#FDFBF7",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const db = await database.read();
  const { headerText, footer } = db.settings;

  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FDFBF7] overflow-x-hidden">
        <CartProvider>
          {headerText && (
            <div className="bg-[#2A2421] text-[#E8D3C5] text-center text-xs sm:text-sm py-2 px-3 leading-5 tracking-wide">
              {headerText}
            </div>
          )}
          <Header />
          <main className="flex-1 w-full min-w-0">{children}</main>
          <Footer footer={footer} />
          <PageViewTracker />
        </CartProvider>
      </body>
    </html>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "lumire_session";

function getSecret() {
  const s = process.env.JWT_SECRET || "lumire-dev-secret-change-me";
  return new TextEncoder().encode(s);
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage || isAdminApi) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      if (isAdminApi) {
        return withSecurityHeaders(
          NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 })
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(url));
    }
    try {
      const { payload } = await jwtVerify(token, getSecret(), {
        algorithms: ["HS256"],
      });
      if (payload.role !== "ADMIN") {
        if (isAdminApi) {
          return withSecurityHeaders(
            NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 })
          );
        }
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return withSecurityHeaders(NextResponse.redirect(url));
      }
    } catch {
      if (isAdminApi) {
        return withSecurityHeaders(
          NextResponse.json({ error: "نشست نامعتبر است." }, { status: 401 })
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * همه مسیرها به‌جز:
     * - _next/static, _next/image
     * - فایل‌های استاتیک رایج
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};

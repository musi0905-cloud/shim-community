import type { Metadata, Viewport } from "next";
import {
  BRAND_DESCRIPTION,
  BRAND_NAME,
  BRAND_TITLE,
  BRAND_COLORS,
} from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    // 한 줄이 강제되는 자리라 계층 대신 BRAND_TITLE 을 쓴다.
    default: BRAND_TITLE,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: BRAND_NAME,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    locale: "ko_KR",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // iOS safe-area 를 쓰기 위해 필요
  themeColor: BRAND_COLORS.theme,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <a href="#main-content" className="skipLink">
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}

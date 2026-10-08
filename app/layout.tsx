import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ClientShell } from "@/components/ClientShell";
import { getSettings } from "@/lib/settings";

const sans = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio Noir · קביעת תורים",
  description: "סטודיו ללק ג'ל ובניית ציפורניים. קבעו תור אונליין בקלות.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studio Noir",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#110C0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const theme = settings.bgTheme;

  return (
    <html lang="he" dir="rtl" data-theme={theme} className={sans.variable}>
      <body>
        {children}
        <ClientShell />
      </body>
    </html>
  );
}

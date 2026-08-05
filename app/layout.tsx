import type { Metadata, Viewport } from "next";
import { Heebo, Frank_Ruhl_Libre, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { HomeScreenInstallGate } from "@/components/HomeScreenInstallGate";
import { NotificationPermissionGate } from "@/components/NotificationPermissionGate";
import { getSettings } from "@/lib/settings";

const sans = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
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
};

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: "#100D0B",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const theme = settings.bgTheme;

  return (
    <html
      lang="he"
      dir="rtl"
      data-theme={theme}
      className={`${sans.variable} ${serif.variable} ${display.variable}`}
    >
      <body>
        {children}
        <ServiceWorkerRegister />
        <HomeScreenInstallGate />
        <NotificationPermissionGate />
      </body>
    </html>
  );
}

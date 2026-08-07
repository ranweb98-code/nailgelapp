import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Heebo, Frank_Ruhl_Libre, Bodoni_Moda } from "next/font/google";
import "./globals.css";import { ClientShell } from "@/components/ClientShell";
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

const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const yad = localFont({
  src: [
    {
      path: "./fonts/dana-yad-alef.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/dana-yad-alef.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-yad",
  display: "swap",
  fallback: ["Frank Ruhl Libre", "Georgia", "serif"],
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
    themeColor: "#110C0D",
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
      className={`${sans.variable} ${serif.variable} ${display.variable} ${yad.variable}`}
    >
      <body>
        {children}
        <ClientShell />
      </body>
    </html>
  );
}

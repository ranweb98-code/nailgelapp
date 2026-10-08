import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import Script from "next/script";
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
  // Solid theme-color makes iOS paint an opaque status bar over the hero.
  themeColor: [{ media: "(display-mode: browser)", color: "#110C0D" }],
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
        <Script id="pwa-safe-area" strategy="beforeInteractive">
          {`(function(){
  var r=document.documentElement;
  if(!document.querySelector('meta[name="apple-mobile-web-app-capable"]')){
    var m=document.createElement("meta");
    m.name="apple-mobile-web-app-capable";
    m.content="yes";
    document.head.appendChild(m);
  }
  var pwa=window.navigator.standalone===true||(window.matchMedia&&(matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches));
  if(!pwa) return;
  r.classList.add("is-pwa");
  r.style.setProperty("--hero-sat","0px");
  document.querySelectorAll('meta[name="theme-color"]').forEach(function(el){el.remove();});
  if(location.pathname==="/"||location.pathname===""){
    r.style.colorScheme="dark";
    var t=document.createElement("meta");
    t.name="theme-color";
    t.content="transparent";
    document.head.appendChild(t);
  }
})();`}
        </Script>
        {children}
        <ClientShell />
      </body>
    </html>
  );
}

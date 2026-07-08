import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "26KADO - Programme d'affiliation des bookmakers en Afrique",
    template: "%s | 26KADO",
  },
  description:
    "26KADO est la plateforme N°1 d'affiliation des bookmakers en Afrique. Promouvez les codes promo 1xBet, BetWinner, MelBet, LineBet et gagnez des commissions exclusives.",
  keywords: [
    "26KADO",
    "affiliation",
    "bookmakers",
    "1xBet",
    "BetWinner",
    "MelBet",
    "LineBet",
    "code promo",
    "paris sportifs",
    "Afrique",
    "commission",
  ],
  authors: [{ name: "26KADO" }],
  creator: "26KADO",
  publisher: "26KADO",
  metadataBase: new URL("https://26kado.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "26KADO",
    title: "26KADO - Programme d'affiliation des bookmakers en Afrique",
    description:
      "Le meilleur programme d'affiliation des bookmakers en Afrique. Gagnez des commissions avec 1xBet, BetWinner, MelBet et LineBet.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "26KADO",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "26KADO - Affiliation Bookmakers",
    description:
      "Le meilleur programme d'affiliation des bookmakers en Afrique.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="ambient-bg" />
            <div className="grid-overlay" />
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
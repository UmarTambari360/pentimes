import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

const playfair = localFont({
  src: [
    {
      path: "./fonts/playfair-display-latin.woff2",
      weight: "400 900",
      style: "normal",
    },
    {
      path: "./fonts/playfair-display-italic-latin.woff2",
      weight: "400 900",
      style: "italic",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  weight: "300 900",
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = localFont({
  src: [
    { path: "./fonts/dm-mono-300-latin.woff2", weight: "300" },
    { path: "./fonts/dm-mono-400-latin.woff2", weight: "400" },
    { path: "./fonts/dm-mono-500-latin.woff2", weight: "500" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://pentimes.ng",
  ),
  title: {
    default: "Pen Times Magazine — Katsina's Voice",
    template: "%s | Pen Times Magazine",
  },
  description:
    "Pen Times Magazine — Your trusted source for news, politics, education, and community development from Katsina State and beyond.",
  keywords: [
    "Katsina news",
    "Nigerian politics",
    "community development",
    "education",
    "Pen Times",
  ],
  authors: [{ name: "Pen Times Editorial Team" }],
  creator: "Pen Times Magazine",
  publisher: "Pen Times Media",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Pen Times Magazine",
    title: "Pen Times Magazine — Katsina's Voice",
    description: 
    "Your trusted source for news, politics, education, and community development from Katsina State and beyond.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pen Times Magazine",
    description: "Katsina's trusted digital magazine.",
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6faf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c130e" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

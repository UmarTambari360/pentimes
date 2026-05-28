import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
  weight: ["300", "400", "500"],
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
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Pen Times Magazine",
    title: "Pen Times Magazine — Katsina's Voice",
    description:
      "Your trusted source for news, politics, education, and community development from Katsina State and beyond.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pen Times Magazine",
    description: "Katsina's trusted digital magazine.",
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
    { media: "(prefers-color-scheme: light)", color: "#f9f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
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

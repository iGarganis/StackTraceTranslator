import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE } from "@/lib/site";
import "./globals.css";

// next/font self-hosts the fonts at build time, so there is no runtime request to Google
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const description =
  "Paste a stack trace and get a plain-English explanation: root cause, likely causes and a suggested fix, with confidence scoring and a second model to cross-check.";

export const metadata: Metadata = {
  // Absolute base for link-preview URLs: an explicit site URL, else Vercel's production domain
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
  ),
  title: SITE.name,
  description,
  keywords: ["stack trace", "debugging", "LLM", "error explanation", "developer tool"],
  openGraph: { type: "website", title: SITE.name, description, siteName: SITE.name },
  twitter: { card: "summary_large_image", title: SITE.name, description },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

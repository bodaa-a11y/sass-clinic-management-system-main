import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/QueryProvider";
import { SkipToContent } from "@/components/accessibility/skip-to-content";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Tajawal, Reem_Kufi } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-reem-kufi",
});

export const metadata: Metadata = {
  title: "عافي - نظام إدارة العيادات | AAFI Clinic Management",
  description: "نظام شامل لإدارة المواعيد والمرضى والموظفين - AAFI Clinic Management System",
  keywords: ["عافي", "إدارة عيادات", "مواعيد", "مرضى", "EMR", "سجلات طبية", "AAFI"],
  authors: [{ name: "AAFI - عافي" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`h-full antialiased ${tajawal.variable} ${reemKufi.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SkipToContent />
        <NuqsAdapter>
          <ThemeProvider defaultTheme="light" storageKey="clinic-theme">
            <QueryProvider>
              <Toaster position="top-center" />
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            </QueryProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}

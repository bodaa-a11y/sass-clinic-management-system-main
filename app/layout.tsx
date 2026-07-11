import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/QueryProvider";
import { SkipToContent } from "@/components/accessibility/skip-to-content";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة إدارة العيادات",
  description: "نظام شامل لإدارة المواعيد والمرضى والموظفين - EMR Platform",
  keywords: ["إدارة عيادات", "مواعيد", "مرضى", "EMR", "سجلات طبية"],
  authors: [{ name: "منصة إدارة العيادات" }],
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
      className="h-full antialiased"
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

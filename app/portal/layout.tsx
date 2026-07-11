import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import '../globals.css';

export const metadata: Metadata = {
  title: 'بوابة المرضى - Patient Portal',
  description: 'بوابة المرضى - الوصول الآمن إلى سجلاتك الطبية',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}

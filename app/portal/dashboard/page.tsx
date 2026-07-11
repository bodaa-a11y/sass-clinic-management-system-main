// CHANGED BY WINDSURF - Redesigned Patient Portal Dashboard with Shifa Clinic theme
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { 
  Heart, 
  Calendar, 
  FileText, 
  Activity, 
  MessageSquare, 
  CreditCard, 
  LogOut, 
  User, 
  Clock, 
  CheckCircle, 
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button-redesigned';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SlideIn, HoverScale, PageTransition } from '@/components/ui/motion-redesigned';

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = store.getUser();
    if (!userData || userData.role !== 'patient') {
      // If not logged in as a patient, check if they have a patient session or redirect
      // Wait, we can keep the session mock
      setUser(userData || { name: 'أحمد محمد', email: 'ahmed@example.com' });
    } else {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    store.logout();
    router.push('/portal/login');
  };

  const portalCards = [
    {
      title: 'المواعيد الطبية',
      description: 'حجز مواعيد جديدة، استعراض المواعيد القادمة أو السابقة.',
      icon: Calendar,
      link: '/portal/appointments',
      actionText: 'إدارة المواعيد',
      badge: '3 قادمة',
      colorClass: 'text-accent-shifa-deep bg-accent-shifa-soft'
    },
    {
      title: 'السجل الطبي',
      description: 'الاطلاع على التقارير الطبية، التشخيصات، والتوصيات العامة.',
      icon: ClipboardList,
      link: '/portal/medical-records',
      actionText: 'عرض الملف الطبي',
      colorClass: 'text-[#0ea5e9] bg-[#0ea5e9]/10'
    },
    {
      title: 'نتائج الفحوصات',
      description: 'استعراض نتائج المختبر، الأشعة والتحاليل الطبية فور صدورها.',
      icon: FileText,
      link: '/portal/lab-results',
      actionText: 'نتائج التحاليل',
      badge: 'جديد',
      colorClass: 'text-[#8b5cf6] bg-[#8b5cf6]/10'
    },
    {
      title: 'الوصفات الطبية',
      description: 'متابعة الأدوية الحالية والسابقة وطلب إعادة صرف الوصفة.',
      icon: Activity,
      link: '/portal/prescriptions',
      actionText: 'استعراض الوصفات',
      colorClass: 'text-[#eab308] bg-[#eab308]/10'
    },
    {
      title: 'المحادثات والرسائل',
      description: 'تواصل مباشر وآمن مع طبيبك المعالج أو إدارة العيادة.',
      icon: MessageSquare,
      link: '/portal/messages',
      actionText: 'فتح المحادثات',
      colorClass: 'text-accent-shifa-deep bg-accent-shifa-soft'
    },
    {
      title: 'الفواتير والمدفوعات',
      description: 'تسوية المستحقات المالية، استعراض الفواتير، وطباعة الإيصالات.',
      icon: CreditCard,
      link: '/portal/billing',
      actionText: 'المدفوعات',
      colorClass: 'text-rose-error bg-rose-error/10'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-sans text-foreground pb-12" dir="rtl">
        {/* Portal Header */}
        <header className="h-16 border-b border-border-shifa bg-card px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-accent-shifa shadow-sm">
              <Heart className="w-4.5 h-4.5 text-[#001810]" />
              <span className="pulse-ring-shifa !inset-[-2px]" />
            </div>
            <div className="leading-none text-right">
              <div className="font-display font-bold text-sm text-foreground">شفاء</div>
              <div className="text-[7px] tracking-[0.2em] font-medium text-muted-foreground">PATIENT PORTAL</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-bg-shifa-soft/60 px-3 py-1.5 rounded-xl border border-border-shifa/60">
              <User className="w-4.5 h-4.5 text-accent-shifa-deep" />
              <span className="text-xs font-bold text-foreground">{user?.name || 'الملف الشخصي'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-rose-error/10 hover:text-rose-error text-muted-foreground gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              <LogOut className="w-4 h-4 ml-1.5" />
              خروج
            </Button>
          </div>
        </header>

        {/* Portal Body */}
        <div className="container mx-auto px-6 py-8 max-w-6xl space-y-8">
          {/* Greeting banner */}
          <SlideIn direction="up" delay={0.1}>
            <div className="relative overflow-hidden rounded-2xl border border-border-shifa bg-card p-6 sm:p-8 shadow-sm">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-accent-shifa/10 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
                  مرحباً بك، {user?.name || 'مريضنا الكريم'} 👋
                </h1>
                <p className="text-sm text-muted-foreground font-semibold max-w-xl">
                  هنا يمكنك الوصول بأمان إلى سجلاتك الطبية، نتائج تحاليلك ومواعيدك القادمة مع أطباء عيادة الشفاء.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-accent-shifa-deep bg-accent-shifa-soft px-3 py-1.5 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    حالة الملف: نشط
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-bg-shifa-soft px-3 py-1.5 rounded-xl">
                    <Clock className="w-4 h-4" />
                    آخر زيارة: منذ أسبوعين
                  </div>
                </div>
              </div>
            </div>
          </SlideIn>

          {/* Portal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portalCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <SlideIn key={card.title} direction="up" delay={0.15 + idx * 0.05}>
                  <HoverScale>
                    <Card className="border border-border-shifa rounded-2xl bg-card shadow-sm h-full flex flex-col justify-between overflow-hidden relative group">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.colorClass}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          {card.badge && (
                            <Badge className="bg-accent-shifa text-[#001810] font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                              {card.badge}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="font-display font-extrabold text-base text-foreground group-hover:text-accent-shifa-deep transition-colors">
                            {card.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      </CardContent>

                      <div className="p-6 pt-0">
                        <Link href={card.link} className="block w-full">
                          <Button 
                            className="w-full bg-bg-shifa-soft hover:bg-accent-shifa hover:text-[#001810] text-foreground font-bold rounded-xl text-xs py-2.5 transition-all duration-300"
                            variant="ghost"
                          >
                            {card.actionText}
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </HoverScale>
                </SlideIn>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

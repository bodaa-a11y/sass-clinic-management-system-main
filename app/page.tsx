'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Button } from '@/components/ui/button-redesigned'
import { store } from '@/lib/store'
import { 
  Calendar, 
  Building2, 
  Activity, 
  Users, 
  FileText, 
  Shield,
  Clock,
  Phone,
  Mail,
  MapPin,
  Sun,
  Moon,
  Menu,
  X,
  Check,
  Star,
  ArrowRight,
  Stethoscope,
  Heart,
  Eye,
  Smile,
  ShieldAlert
} from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { toast } from 'sonner'

interface Doctor {
  id: string
  name: string
  role: string
  specialtyId: string
  specialtyName: string
}

interface Specialty {
  id: string
  name: string
  code: string
}

interface Clinic {
  id: string
  name: string
  slug: string
  phone: string
  address: string
}

export default function HomePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // API State
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  
  // Form State
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    // Redirect if already logged in
    const user = store.getUser()
    if (user) {
      if (user.role === 'super_admin') {
        router.replace('/admin')
      } else {
        router.replace('/dashboard')
      }
    }
    
    // Fetch clinic info
    fetchClinicDetails()
  }, [router])

  const fetchClinicDetails = async () => {
    try {
      // Use the seeded clinic slug
      const response = await fetch('/api/public/shifa-clinic')
      if (response.ok) {
        const resData = await response.json()
        if (resData.data) {
          setClinic(resData.data.clinic)
          setDoctors(resData.data.doctors || [])
          setSpecialties(resData.data.specialties || [])
          if (resData.data.specialties && resData.data.specialties.length > 0) {
            setSelectedSpecialtyId(resData.data.specialties[0].id)
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch public clinic details:', e)
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSpecialtyId) {
      toast.error('الرجاء اختيار التخصص المطلوب')
      return
    }

    setIsSubmitting(true)

    try {
      // Find a doctor in the selected specialty
      let doctor = doctors.find(d => d.specialtyId === selectedSpecialtyId)
      
      // Fallback to first doctor if none found for specialty
      if (!doctor && doctors.length > 0) {
        doctor = doctors[0]
      }

      if (!doctor) {
        toast.error('عذراً، لا يوجد أطباء متاحين حالياً في هذا التخصص')
        setIsSubmitting(false)
        return
      }

      // Generate a default date/time if not selected
      const finalDate = bookingDate || new Date().toISOString().split('T')[0]
      const finalTime = bookingTime || '09:00'

      const response = await fetch('/api/public/shifa-clinic/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_id: doctor.id,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_email: patientEmail || undefined,
          date: finalDate,
          start_time: finalTime,
          notes: bookingNotes || undefined,
          priority: 'normal'
        }),
      })

      const resJson = await response.json()

      if (response.ok) {
        setFormSubmitted(true)
        toast.success('تم إرسال طلب الحجز بنجاح!')
        // Reset form
        setPatientName('')
        setPatientPhone('')
        setPatientEmail('')
        setBookingNotes('')
        setBookingDate('')
        setBookingTime('')
        setTimeout(() => setFormSubmitted(false), 5000)
      } else {
        toast.error(resJson.error || 'فشل تسجيل الموعد، يرجى المحاولة لاحقاً')
      }
    } catch (err) {
      console.error('Booking submission error:', err)
      toast.error('حدث خطأ أثناء حجز الموعد')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-background overflow-x-hidden font-sans">
        {/* Ambient background blobs */}
        <div className="blob w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-accent-shifa top-[-150px] right-[-100px]" />
        <div className="blob w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-accent-shifa-deep bottom-[-100px] left-[-100px]" />

        {/* ============ HEADER ============ */}
        <header className="relative z-50 sticky top-0 backdrop-blur-xl border-b border-border-shifa bg-background/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center bg-accent-shifa">
                <Heart className="w-6 h-6 text-[#001810]" />
                <span className="pulse-ring-shifa !inset-[-4px]" />
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-xl text-foreground">شفاء</div>
                <div className="text-[10px] tracking-[0.25em] font-medium text-muted-foreground">SHIFA CLINIC</div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden lg:flex items-center gap-9 text-sm font-medium">
              <a href="#home" className="nav-link-shifa">الرئيسية</a>
              <a href="#services" className="nav-link-shifa">خدماتنا</a>
              <a href="#doctors" className="nav-link-shifa">أطباؤنا</a>
              <a href="#stats" className="nav-link-shifa">إنجازاتنا</a>
              <a href="#booking" className="nav-link-shifa">احجز موعد</a>
              <Link href="/dashboard/login" className="nav-link-shifa text-medical-blue font-bold">بوابة الموظفين</Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {mounted && (
                <div 
                  className="toggle-track-shifa" 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  role="button" 
                  aria-label="تبديل الوضع"
                >
                  <div className="toggle-knob-shifa">
                    {theme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5" />
                    ) : (
                      <Sun className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              )}
              
              <a href="#booking" className="btn-glow hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm">
                احجز الآن
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>

              <button 
                className="lg:hidden p-2 text-foreground" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="القائمة"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border-shifa bg-background">
              <div className="px-6 py-4 flex flex-col gap-4 text-sm font-medium">
                <a href="#home" className="nav-link-shifa" onClick={() => setMobileMenuOpen(false)}>الرئيسية</a>
                <a href="#services" className="nav-link-shifa" onClick={() => setMobileMenuOpen(false)}>خدماتنا</a>
                <a href="#doctors" className="nav-link-shifa" onClick={() => setMobileMenuOpen(false)}>أطباؤنا</a>
                <a href="#stats" className="nav-link-shifa" onClick={() => setMobileMenuOpen(false)}>إنجازاتنا</a>
                <a href="#booking" className="nav-link-shifa" onClick={() => setMobileMenuOpen(false)}>احجز موعد</a>
                <Link href="/dashboard/login" className="nav-link-shifa text-medical-blue font-bold" onClick={() => setMobileMenuOpen(false)}>بوابة الموظفين</Link>
                <a href="#booking" className="btn-glow inline-flex justify-center px-5 py-2.5 rounded-full" onClick={() => setMobileMenuOpen(false)}>احجز موعد</a>
              </div>
            </div>
          )}
        </header>

        {/* ============ HERO ============ */}
        <section id="home" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-shifa-soft text-accent-shifa-deep">
                <span className="live-dot-shifa" />
                عيادة مفتوحة الآن · نستقبل الحالات الطارئة
              </div>
              <h1 className="font-display font-extrabold text-5xl lg:text-7xl leading-[1.1] text-foreground">
                رعاية طبية
                <span className="relative inline-block mx-2">
                  <span className="text-accent-shifa-deep">بقلبٍ</span>
                  <svg className="absolute -bottom-2 right-0 w-full" height="14" viewBox="0 0 200 14" fill="none">
                    <path d="M2 8 Q 50 -2 100 6 T 198 6" stroke="var(--accent-shifa)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  </svg>
                </span>
                <br />يحس بك أولاً
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
                في عيادة شفاء نجمع بين خبرة الأطباء ودقة الأجهزة الحديثة لنقدّم لك تجربة علاجية مريحة، سريعة، وآمنة — لأن صحتك تستحق الأفضل دائماً.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <a href="#booking" className="btn-glow inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base">
                  احجز موعدك الآن
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </a>
                <a href="#services" className="btn-outline-shifa inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold">
                  تصفّح الخدمات
                </a>
              </div>

              {/* Mini trust */}
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-border-shifa">
                <div className="flex -space-x-3 -space-x-reverse">
                  <img className="w-10 h-10 rounded-full border-2 border-background" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100" alt="Doctor 1" />
                  <img className="w-10 h-10 rounded-full border-2 border-background" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100" alt="Doctor 2" />
                  <img className="w-10 h-10 rounded-full border-2 border-background" src="https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=100" alt="Doctor 3" />
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-accent-shifa text-[#001810] flex items-center justify-center text-xs font-bold">+9</div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-xs text-accent-shifa-deep">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="text-muted-foreground">أكثر من <span className="font-bold text-foreground">18,000</span> مريض سعيد</div>
                </div>
              </div>
            </div>

            {/* Right Side Visual */}
            <div className="relative">
              {/* Main Card */}
              <div className="relative card-shifa-hover rounded-[2.5rem] p-8 lg:p-10 shadow-shifa">
                {/* ECG Monitor */}
                <div className="rounded-3xl p-6 mb-6 relative overflow-hidden bg-bg-shifa-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="live-dot-shifa" />
                      <span className="text-sm font-semibold text-foreground">مراقبة نبض القلب</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">LIVE · 72 bpm</span>
                  </div>
                  <svg viewBox="0 0 400 100" className="w-full h-24">
                    <path 
                      className="ecg-path" 
                      d="M0 50 L80 50 L100 50 L110 20 L120 80 L130 30 L140 50 L220 50 L240 50 L250 15 L260 85 L270 25 L280 50 L400 50" 
                      stroke="var(--accent-shifa)" 
                      strokeWidth="2.5" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Quick stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4 text-center bg-bg-shifa-soft">
                    <div className="text-2xl font-extrabold font-display text-accent-shifa-deep">24/7</div>
                    <div className="text-[11px] mt-1 text-muted-foreground">طوارئ</div>
                  </div>
                  <div className="rounded-2xl p-4 text-center bg-bg-shifa-soft">
                    <div className="text-2xl font-extrabold font-display text-accent-shifa-deep">15+</div>
                    <div className="text-[11px] mt-1 text-muted-foreground">تخصص</div>
                  </div>
                  <div className="rounded-2xl p-4 text-center bg-bg-shifa-soft">
                    <div className="text-2xl font-extrabold font-display text-accent-shifa-deep">98%</div>
                    <div className="text-[11px] mt-1 text-muted-foreground">رضا المرضى</div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-6 -left-6 card-shifa-hover rounded-2xl px-5 py-4 float-shifa flex items-center gap-3 shadow-shifa">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-shifa-soft">
                  <Activity className="w-5 h-5 text-accent-shifa-deep" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">فحص شامل</div>
                  <div className="font-bold text-sm text-foreground">جاهز خلال 30 دقيقة</div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 card-shifa-hover rounded-2xl px-5 py-4 float-slow-shifa flex items-center gap-3 shadow-shifa">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-shifa-soft">
                  <Clock className="w-5 h-5 text-accent-shifa-deep" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">موعد قادم</div>
                  <div className="font-bold text-sm text-foreground">اليوم · 4:30 م</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MARQUEE ============ */}
        <section className="relative z-10 py-8 border-y border-border-shifa bg-bg-shifa-soft overflow-hidden">
          <div className="marquee-shifa text-2xl font-display font-bold text-muted-foreground">
            <span>طب عام</span><span className="text-accent-shifa">●</span>
            <span>أسنان</span><span className="text-accent-shifa">●</span>
            <span>جلدية</span><span className="text-accent-shifa">●</span>
            <span>أطفال</span><span className="text-accent-shifa">●</span>
            <span>باطنة</span><span className="text-accent-shifa">●</span>
            <span>عيون</span><span className="text-accent-shifa">●</span>
            <span>عظام</span><span className="text-accent-shifa">●</span>
            
            <span>طب عام</span><span className="text-accent-shifa">●</span>
            <span>أسنان</span><span className="text-accent-shifa">●</span>
            <span>جلدية</span><span className="text-accent-shifa">●</span>
            <span>أطفال</span><span className="text-accent-shifa">●</span>
            <span>باطنة</span><span className="text-accent-shifa">●</span>
            <span>عيون</span><span className="text-accent-shifa">●</span>
            <span>عظام</span><span className="text-accent-shifa">●</span>
          </div>
        </section>

        {/* ============ SERVICES ============ */}
        <section id="services" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="text-center mb-16">
            <span className="text-sm font-bold tracking-widest text-accent-shifa-deep">خدماتنا الطبية</span>
            <h2 className="font-display font-extrabold text-4xl lg:text-5xl mt-3 h-underline-shifa text-foreground">رعاية متكاملة لكل أفراد الأسرة</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="card-shifa-hover rounded-3xl p-8 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-accent-shifa-soft">
                <Heart className="w-7 h-7 text-accent-shifa-deep" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">طب القلب</h3>
              <p className="text-sm leading-relaxed mb-4 text-muted-foreground">تشخيص وعلاج جميع أمراض القلب والأوعية الدموية باستخدام أحدث أجهزة تخطيط الرنين والتصوير ثلاثي الأبعاد.</p>
              <a href="#booking" className="inline-flex items-center gap-2 text-sm font-bold text-accent-shifa-deep">احجز الآن
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>
            </div>

            {/* Service 2 */}
            <div className="card-shifa-hover rounded-3xl p-8 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-accent-shifa-soft">
                <Stethoscope className="w-7 h-7 text-accent-shifa-deep" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">طب الأطفال</h3>
              <p className="text-sm leading-relaxed mb-4 text-muted-foreground">رعاية متخصصة للأطفال من الولادة حتى المراهقة، مع متابعة دقيقة للنمو والتطعيمات وعلاج الأمراض الموسمية.</p>
              <a href="#booking" className="inline-flex items-center gap-2 text-sm font-bold text-accent-shifa-deep">احجز الآن
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>
            </div>

            {/* Service 3 */}
            <div className="card-shifa-hover rounded-3xl p-8 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-accent-shifa-soft">
                <Smile className="w-7 h-7 text-accent-shifa-deep" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">طب الأسنان</h3>
              <p className="text-sm leading-relaxed mb-4 text-muted-foreground">تنظيف وتبييض وحشوات وزراعة الأسنان بأحدث التقنيات غير المؤلمة، مع قسم خاص لتقويم الأسنان للأطفال والكبار.</p>
              <a href="#booking" className="inline-flex items-center gap-2 text-sm font-bold text-accent-shifa-deep">احجز الآن
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>
            </div>

            {/* Service 4 */}
            <div className="card-shifa-hover rounded-3xl p-8 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-accent-shifa-soft">
                <SparklesIcon className="w-7 h-7 text-accent-shifa-deep" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">الجلدية والتجميل</h3>
              <p className="text-sm leading-relaxed mb-4 text-muted-foreground">علاج مشاكل البشرة، الليزر، إزالة الشعر، حقن التجميل، وعلاج الأمراض الجلدية المزمنة بأحدث الأجهزة الآمنة.</p>
              <a href="#booking" className="inline-flex items-center gap-2 text-sm font-bold text-accent-shifa-deep">احجز الآن
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>
            </div>

            {/* Service 5 */}
            <div className="card-shifa-hover rounded-3xl p-8 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-accent-shifa-soft">
                <Activity className="w-7 h-7 text-accent-shifa-deep" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">الباطنة العامة</h3>
              <p className="text-sm leading-relaxed mb-4 text-muted-foreground">تشخيص وعلاج أمراض الجهاز الهضمي، السكري، الضغط، والمناعة، مع خطط علاجية مخصصة ومتابعة دورية.</p>
              <a href="#booking" className="inline-flex items-center gap-2 text-sm font-bold text-accent-shifa-deep">احجز الآن
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>
            </div>

            {/* Service 6 */}
            <div className="card-shifa-hover rounded-3xl p-8 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-accent-shifa-soft">
                <Eye className="w-7 h-7 text-accent-shifa-deep" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">طب العيون</h3>
              <p className="text-sm leading-relaxed mb-4 text-muted-foreground">فحوصات النظر، علاج المياه البيضاء والزرقاء، تصحيح النظر بالليزر، وتركيب العدسات اللاصقة بأحدث المعايير.</p>
              <a href="#booking" className="inline-flex items-center gap-2 text-sm font-bold text-accent-shifa-deep">احجز الآن
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>
            </div>
          </div>
        </section>

        {/* ============ STATS ============ --> */}
        <section id="stats" className="relative z-10 py-24 overflow-hidden">
          <div className="absolute inset-0 grid-bg-shifa opacity-60" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-16">
              <span className="text-sm font-bold tracking-widest text-accent-shifa-deep">أرقام تتحدث</span>
              <h2 className="font-display font-extrabold text-4xl lg:text-5xl mt-3 h-underline-shifa text-foreground">ثقة بُنيت على مدى سنوات</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-shifa-hover rounded-3xl p-8 text-center bg-card">
                <div className="stat-num-shifa font-display font-extrabold text-5xl mb-2">18K+</div>
                <div className="text-sm text-muted-foreground">مريض سعيد</div>
              </div>
              <div className="card-shifa-hover rounded-3xl p-8 text-center bg-card">
                <div className="stat-num-shifa font-display font-extrabold text-5xl mb-2">45+</div>
                <div className="text-sm text-muted-foreground">طبيب متخصص</div>
              </div>
              <div className="card-shifa-hover rounded-3xl p-8 text-center bg-card">
                <div className="stat-num-shifa font-display font-extrabold text-5xl mb-2">15+</div>
                <div className="text-sm text-muted-foreground">عاماً من الخبرة</div>
              </div>
              <div className="card-shifa-hover rounded-3xl p-8 text-center bg-card">
                <div className="stat-num-shifa font-display font-extrabold text-5xl mb-2">98%</div>
                <div className="text-sm text-muted-foreground">نسبة رضا</div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ DOCTORS ============ */}
        <section id="doctors" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div>
              <span className="text-sm font-bold tracking-widest text-accent-shifa-deep">فريقنا</span>
              <h2 className="font-display font-extrabold text-4xl lg:text-5xl mt-3 text-foreground">أطباء تثق بهم</h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">نخبة من الاستشاريين الحاصلين على شهادات عالمية، يجمعون بين الخبرة الطويلة والتعامل الإنساني الراقي.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-shifa-hover rounded-3xl overflow-hidden group">
              <div className="aspect-[3/4] relative overflow-hidden">
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400" alt="د. أحمد المنصوري" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-white">
                  <div className="text-xs font-semibold text-accent-shifa">استشاري</div>
                  <div className="font-display font-bold text-lg">د. أحمد المنصوري</div>
                  <div className="text-xs opacity-80">طب القلب</div>
                </div>
              </div>
            </div>

            <div className="card-shifa-hover rounded-3xl overflow-hidden group">
              <div className="aspect-[3/4] relative overflow-hidden">
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400" alt="د. سارة العتيبي" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-white">
                  <div className="text-xs font-semibold text-accent-shifa">استشارية</div>
                  <div className="font-display font-bold text-lg">د. سارة العتيبي</div>
                  <div className="text-xs opacity-80">طب الأطفال</div>
                </div>
              </div>
            </div>

            <div className="card-shifa-hover rounded-3xl overflow-hidden group">
              <div className="aspect-[3/4] relative overflow-hidden">
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400" alt="د. خالد الشمري" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-white">
                  <div className="text-xs font-semibold text-accent-shifa">استشاري</div>
                  <div className="font-display font-bold text-lg">د. خالد الشمري</div>
                  <div className="text-xs opacity-80">الجلدية والتجميل</div>
                </div>
              </div>
            </div>

            <div className="card-shifa-hover rounded-3xl overflow-hidden group">
              <div className="aspect-[3/4] relative overflow-hidden">
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&q=80&w=400" alt="د. نورة القحطاني" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-white">
                  <div className="text-xs font-semibold text-accent-shifa">استشارية</div>
                  <div className="font-display font-bold text-lg">د. نورة القحطاني</div>
                  <div className="text-xs opacity-80">طب الأسنان</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ BOOKING ============ */}
        <section id="booking" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="card-shifa-hover rounded-[2.5rem] overflow-hidden grid lg:grid-cols-2 shadow-shifa">
            {/* Left info */}
            <div className="p-10 lg:p-14 relative bg-bg-shifa-soft">
              <div className="absolute inset-0 grid-bg-shifa opacity-40" />
              <div className="relative space-y-6">
                <div>
                  <span className="text-sm font-bold tracking-widest text-accent-shifa-deep">احجز موعدك</span>
                  <h2 className="font-display font-extrabold text-4xl lg:text-5xl mt-3 mb-6 leading-tight text-foreground">خطوة واحدة<br />تفصلك عن صحتك</h2>
                  <p className="text-base leading-relaxed text-muted-foreground">املأ النموذج وسيتواصل معك فريقنا خلال 15 دقيقة لتأكيد الموعد المناسب لك. كل بياناتك سرية تماماً.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-shifa-soft">
                      <Phone className="w-5 h-5 text-accent-shifa-deep" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">للحجز والاستفسار</div>
                      <div className="font-bold text-foreground" dir="ltr">+966 11 234 5678</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-shifa-soft">
                      <MapPin className="w-5 h-5 text-accent-shifa-deep" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">العنوان</div>
                      <div className="font-bold text-foreground">الرياض · حي العليا · طريق الملك فهد</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-shifa-soft">
                      <Clock className="w-5 h-5 text-accent-shifa-deep" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">ساعات العمل</div>
                      <div className="font-bold text-foreground">السبت - الخميس · 9ص حتى 11م</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="p-10 lg:p-14 bg-card">
              <form className="space-y-5" onSubmit={handleBookingSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold mb-2 block text-muted-foreground">الاسم الكامل</label>
                    <input 
                      type="text" 
                      required 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="مثال: محمد عبدالله" 
                      className="field-shifa w-full px-4 py-3 rounded-xl text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-2 block text-muted-foreground">رقم الجوال</label>
                    <input 
                      type="tel" 
                      required 
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="05xxxxxxxx" 
                      className="field-shifa w-full px-4 py-3 rounded-xl text-sm" 
                      dir="ltr" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold mb-2 block text-muted-foreground">التخصص المطلوب</label>
                  <select 
                    className="field-shifa w-full px-4 py-3 rounded-xl text-sm"
                    value={selectedSpecialtyId}
                    onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                  >
                    {specialties.length > 0 ? (
                      specialties.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="">اختر التخصص...</option>
                        <option value="pediatric">طب الأطفال</option>
                        <option value="dentist">طب الأسنان</option>
                        <option value="general">الطب العام</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold mb-2 block text-muted-foreground">التاريخ المفضل</label>
                    <input 
                      type="date" 
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="field-shifa w-full px-4 py-3 rounded-xl text-sm text-foreground bg-transparent" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-2 block text-muted-foreground">الوقت المفضل</label>
                    <input 
                      type="time" 
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="field-shifa w-full px-4 py-3 rounded-xl text-sm text-foreground bg-transparent" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold mb-2 block text-muted-foreground">ملاحظات (اختياري)</label>
                  <textarea 
                    rows={3} 
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="أخبرنا بأي تفاصيل تود مشاركتها..." 
                    className="field-shifa w-full px-4 py-3 rounded-xl text-sm resize-none" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-glow w-full py-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد الحجز'}
                  <Check className="w-5 h-5" />
                </button>

                {formSubmitted && (
                  <p className="text-center text-sm font-semibold py-3 rounded-xl bg-accent-shifa-soft text-accent-shifa-deep animate-pulse">
                    تم استلام طلبك! سنتواصل معك قريباً ✓
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="text-center mb-16">
            <span className="text-sm font-bold tracking-widest text-accent-shifa-deep">آراء مرضانا</span>
            <h2 className="font-display font-extrabold text-4xl lg:text-5xl mt-3 h-underline-shifa text-foreground">قصص نجاح حقيقية</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-shifa-hover rounded-3xl p-8">
              <div className="flex gap-1 mb-4 text-sm text-accent-shifa-deep">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-base leading-relaxed mb-6 text-foreground">"تجربة رائعة من أول مكالمة حتى نهاية الزيارة. الطاقم محترف جداً والمكان نظيف ومريح. د. أحمد شرح لي حالتي بصبر لم أعهده في عيادة من قبل."</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border-shifa">
                <img className="w-11 h-11 rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Patient 1" />
                <div>
                  <div className="font-bold text-sm text-foreground">عبدالله الحربي</div>
                  <div className="text-xs text-muted-foreground">مريض قلب</div>
                </div>
              </div>
            </div>

            <div className="card-shifa-hover rounded-3xl p-8">
              <div className="flex gap-1 mb-4 text-sm text-accent-shifa-deep">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-base leading-relaxed mb-6 text-foreground">"أخذت ابنتي لطوارئ في منتصف الليل ووجدت اهتماماً وعناية فائقة. شكراً لطاقم العيادة على الإنسانية قبل الاحترافية."</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border-shifa">
                <img className="w-11 h-11 rounded-full object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" alt="Patient 2" />
                <div>
                  <div className="font-bold text-sm text-foreground">ريم السبيعي</div>
                  <div className="text-xs text-muted-foreground">أم لطفلين</div>
                </div>
              </div>
            </div>

            <div className="card-shifa-hover rounded-3xl p-8">
              <div className="flex gap-1 mb-4 text-sm text-accent-shifa-deep">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-base leading-relaxed mb-6 text-foreground">"نظّمت أسناني في 8 شهور فقط ونتيجة فاقت توقعاتي. الدكتورة نورة فنانة بكل معنى الكلمة. أنصح بها بشدة."</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border-shifa">
                <img className="w-11 h-11 rounded-full object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="Patient 3" />
                <div>
                  <div className="font-bold text-sm text-foreground">نوف المطيري</div>
                  <div className="text-xs text-muted-foreground">تقويم أسنان</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pb-24">
          <div className="relative rounded-[2.5rem] overflow-hidden p-12 lg:p-20 text-center bg-accent-shifa shadow-[0_30px_80px_-30px_rgba(0,255,178,0.5)]">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,#fff,transparent_50%),_radial-gradient(circle_at_70%_70%,#00C994,transparent_50%)]" />
            <div className="relative">
              <h2 className="font-display font-extrabold text-4xl lg:text-6xl mb-6 text-[#001810]">صحتك لا تحتمل التأجيل</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto text-[#003328]">احجز موعدك اليوم واحصل على فحص شامل مجاني عند زيارتك الأولى.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#booking" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-[#001810] text-accent-shifa">
                  احجز موعدك الآن
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </a>
                <a href="tel:+966112345678" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold border-2 border-[#001810] text-[#001810]">
                  <Phone className="w-5 h-5" />
                  اتصل بنا
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="relative z-10 border-t border-border-shifa bg-bg-shifa-soft">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-accent-shifa">
                    <Heart className="w-5 h-5 text-[#001810]" />
                  </div>
                  <div className="font-display font-bold text-xl text-foreground">شفاء</div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">عيادة متكاملة تقدم رعاية صحية بأعلى المعايير العالمية، بقلبٍ يهتم بكل مريض.</p>
              </div>
              <div>
                <h4 className="font-display font-bold mb-4 text-foreground">روابط سريعة</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#home" className="hover:text-foreground transition">الرئيسية</a></li>
                  <li><a href="#services" className="hover:text-foreground transition">خدماتنا</a></li>
                  <li><a href="#doctors" className="hover:text-foreground transition">أطباؤنا</a></li>
                  <li><a href="#booking" className="hover:text-foreground transition">احجز موعد</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold mb-4 text-foreground">التواصل</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li dir="ltr" className="text-right">+966 11 234 5678</li>
                  <li>info@shifa-clinic.sa</li>
                  <li>الرياض · حي العليا</li>
                  <li>طريق الملك فهد</li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold mb-4 text-foreground">تابعنا</h4>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 rounded-xl flex items-center justify-center border border-border-shifa text-muted-foreground hover:text-foreground transition">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12z" /></svg>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-xl flex items-center justify-center border border-border-shifa text-muted-foreground hover:text-foreground transition">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.1.4.3 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.1-1 .3-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.1-.4-.3-1-.4-2.2-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.1 1-.3 2.2-.4 1.2-.1 1.6-.1 4.8-.1zm0 2.2c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.3-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.1.4-.2 1-.3 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.3 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.1 1 .2 2.1.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.3.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.1-.4.2-1 .3-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.3-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.1-1-.2-2.1-.3-1.2-.1-1.6-.1-4.7-.1zm0 3.7c2.7 0 4.9 2.2 4.9 4.9s-2.2 4.9-4.9 4.9-4.9-2.2-4.9-4.9 2.2-4.9 4.9-4.9zm0 8.1c1.8 0 3.2-1.4 3.2-3.2s-1.4-3.2-3.2-3.2-3.2 1.4-3.2 3.2 1.4 3.2 3.2 3.2zm6.3-8.3c0 .6-.5 1.1-1.1 1.1-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1z" /></svg>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-xl flex items-center justify-center border border-border-shifa text-muted-foreground hover:text-foreground transition">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M19.6 3H4.4C3.6 3 3 3.6 3 4.4v15.2c0 .8.6 1.4 1.4 1.4h15.2c.8 0 1.4-.6 1.4-1.4V4.4c0-.8-.6-1.4-1.4-1.4zM8.3 18.3H5.7V9.7h2.6v8.6zM7 8.5c-.8 0-1.5-.7-1.5-1.5S6.2 5.5 7 5.5s1.5.7 1.5 1.5S7.8 8.5 7 8.5zm11.3 9.8h-2.6v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3h-2.6V9.7h2.5v1.2h.1c.3-.6 1.2-1.4 2.5-1.4 2.7 0 3.2 1.8 3.2 4.1v4.7z" /></svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-border-shifa flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <div>© 2025 عيادة شفاء. جميع الحقوق محفوظة.</div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-foreground transition">سياسة الخصوصية</a>
                <a href="#" className="hover:text-foreground transition">الشروط والأحكام</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}

// Sparkles icon component
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </svg>
  )
}

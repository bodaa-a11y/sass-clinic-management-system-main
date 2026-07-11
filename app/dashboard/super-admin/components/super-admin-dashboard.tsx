'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Building2, Users, TrendingUp, DollarSign, Activity, AlertCircle, Globe, Shield } from 'lucide-react'

interface SuperAdminDashboardProps {
  totalClinics: number
  totalUsers: number
  monthlyRevenue: string
  activeClinics: number
  pendingApprovals: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

export function SuperAdminDashboard({
  totalClinics,
  totalUsers,
  monthlyRevenue,
  activeClinics,
  pendingApprovals,
  systemHealth
}: SuperAdminDashboardProps) {
  const getHealthColor = () => {
    switch (systemHealth) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
    }
  }

  const getHealthText = () => {
    switch (systemHealth) {
      case 'healthy': return 'سليم'
      case 'warning': return 'تحذير'
      case 'critical': return 'حرج'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة تحكم النظام</h2>
        <p className="text-sm text-gray-500 mt-1">نظرة عامة على جميع العيادات والأنظمة</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العيادات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClinics}</div>
            <p className="text-xs text-muted-foreground">{activeClinics} نشطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">مستخدم مسجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الشهر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">ر.س</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موافقات معلقة</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالة النظام</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor()}`}>
              {getHealthText()}
            </div>
            <p className="text-xs text-muted-foreground">جميع الأنظمة تعمل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النمو</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+25%</div>
            <p className="text-xs text-muted-foreground">مقارنة بالشهر الماضي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأمان</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">آمن</div>
            <p className="text-xs text-muted-foreground">لا توجد تهديدات</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">عيادة الرياض تم التفعيل</p>
                <p className="text-gray-500 text-xs">منذ 5 دقائق</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">مستخدم جديد: د. أحمد محمد</p>
                <p className="text-gray-500 text-xs">منذ 15 دقيقة</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">طلب ترقية: عيادة جدة</p>
                <p className="text-gray-500 text-xs">منذ ساعة</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

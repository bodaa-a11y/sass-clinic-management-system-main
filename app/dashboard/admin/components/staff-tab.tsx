'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, Stethoscope, HeadphonesIcon, Activity } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  role: 'doctor' | 'receptionist' | 'nurse'
  isActive: boolean
  department?: string
}

interface StaffTabProps {
  staff: Staff[]
  onAdd: (data: any) => void
  onEdit: (id: string, data: any) => void
  onDelete: (id: string) => void
  facilityType?: string
}

export function StaffTab({ staff, onAdd, onEdit, onDelete, facilityType }: StaffTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'doctor' as 'doctor' | 'receptionist' | 'nurse',
    department: '',
    password: ''
  })

  const filteredStaff = staff.filter(s => {
    const matchesSearch = (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string; icon: any }> = {
      'doctor': { label: 'طبيب', className: 'bg-blue-100 text-blue-700', icon: Stethoscope },
      'receptionist': { label: 'استقبال', className: 'bg-green-100 text-green-700', icon: HeadphonesIcon },
      'nurse': { label: 'ممرض', className: 'bg-purple-100 text-purple-700', icon: Activity }
    }
    const config = roleMap[role] || roleMap['doctor']
    const Icon = config.icon
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    )
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(staffForm)
    setStaffForm({ name: '', email: '', phone: '', role: 'doctor', department: '', password: '' })
    setIsDialogOpen(false)
    toast.success('تم إضافة الموظف بنجاح')
  }

  const handleEdit = (member: Staff) => {
    setStaffForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      department: member.department || '',
      password: ''
    })
    setIsDialogOpen(true)
  }

  return (
    <SlideIn direction="up" delay={0.1}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الموظفين</h2>
            <p className="text-sm text-gray-500 mt-1">إضافة وإدارة موظفي العيادة</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <HoverScale>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  موظف جديد
                </Button>
              </HoverScale>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">الدور *</Label>
                  <Select value={staffForm.role} onValueChange={(value: any) => setStaffForm({ ...staffForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">طبيب</SelectItem>
                      <SelectItem value="receptionist">استقبال</SelectItem>
                      {facilityType === 'medical_center' && (
                        <SelectItem value="nurse">ممرض</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">القسم</Label>
                  <Input
                    id="department"
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    placeholder="اختياري"
                  />
                </div>
                <div>
                  <Label htmlFor="password">كلمة المرور المؤقتة *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">إضافة الموظف</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث عن موظف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الدور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="doctor">أطباء</SelectItem>
              <SelectItem value="receptionist">استقبال</SelectItem>
              {facilityType === 'medical_center' && (
                <SelectItem value="nurse">ممرضين</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Staff List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">لا يوجد موظفين</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredStaff.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    {getRoleBadge(member.role)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.department && (
                      <div className="text-xs text-gray-500">
                        القسم: {member.department}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant={member.isActive ? 'default' : 'secondary'}>
                        {member.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(member)}>
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(member.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SlideIn>
  )
}

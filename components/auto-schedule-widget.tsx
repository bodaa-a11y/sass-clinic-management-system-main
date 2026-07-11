'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Star, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

interface AutoScheduleSuggestion {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  date: string;
  time: string;
  score: number;
  reasons: string[];
  formatted: string;
}

interface AutoScheduleResponse {
  data: {
    suggestions: AutoScheduleSuggestion[];
    bestMatch: AutoScheduleSuggestion | null;
    totalOptions: number;
    alternativeDates: string[];
    waitlistRecommended: boolean;
    patientName: string;
  };
  message: string;
}

interface AutoScheduleWidgetProps {
  clinicSlug: string;
  patientId?: string;
  patientName: string;
  preferredDoctors?: string[];
  onSelectAppointment: (suggestion: AutoScheduleSuggestion) => void;
  priority?: 'normal' | 'priority' | 'emergency';
}

export function AutoScheduleWidget({
  clinicSlug,
  patientId,
  patientName,
  preferredDoctors,
  onSelectAppointment,
  priority = 'normal',
}: AutoScheduleWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutoScheduleResponse['data'] | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AutoScheduleSuggestion | null>(null);

  const fetchSuggestions = async () => {
    // For new bookings, use a dummy patient ID - the actual patient will be created during booking
    const tempPatientId = patientId || '00000000-0000-0000-0000-000000000000';

    setIsLoading(true);
    try {
      const response = await apiFetch(`/public/${clinicSlug}/auto-schedule`, {
        method: 'POST',
        body: JSON.stringify({
          patientId: tempPatientId,
          priority,
          preferredDoctors,
          maxWaitDays: 14,
          flexibleWithTime: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في الحصول على الاقتراحات');
      }

      const result: AutoScheduleResponse = await response.json();
      setSuggestions(result.data);
      
      if (result.data.bestMatch) {
        toast.success(`تم العثور على ${result.data.suggestions.length} اقتراحات موعد`);
      } else if (result.data.waitlistRecommended) {
        toast.info('المواعيد محدودة. يوصى بالانضمام إلى قائمة الانتظار.');
      }
    } catch (error) {
      console.error('Auto-scheduling error:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء البحث عن المواعيد');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AutoScheduleSuggestion) => {
    setSelectedSuggestion(suggestion);
    onSelectAppointment(suggestion);
    toast.success(`تم اختيار الموعد: ${suggestion.formatted}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return <Badge className="bg-red-100 text-red-800">🚨 طارئ</Badge>;
      case 'priority':
        return <Badge className="bg-orange-100 text-orange-800">⚡ أولوية</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">📋 عادي</Badge>;
    }
  };

  if (!suggestions) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            جدولة أوتوماتيكية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            اضغط على الزر أدناه للحصول على اقتراحات ذكية للمواعيد بناءً على:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 mr-4">
            <li>• أوقات الأطباء المتاحة</li>
            <li>• أولوية الحالة</li>
            <li>• تفضيلاتك الشخصية</li>
            <li>• أقصر وقت انتظار</li>
          </ul>
          <Button 
            onClick={fetchSuggestions} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري البحث عن أفضل المواعيد...
              </>
            ) : (
              <>
                <Star className="ml-2 h-4 w-4" />
                احصل على اقتراحات ذكية
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            اقتراحات المواعيد الذكية
          </span>
          {getPriorityBadge(priority)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.waitlistRecommended && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                المواعيد محدودة في الفترة المطلوبة
              </p>
              <p className="text-sm text-amber-700">
                يمكنك الانضمام إلى قائمة الانتظار أو اختيار تاريخ بديل
              </p>
            </div>
          </div>
        )}

        {suggestions.bestMatch && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">أفضل اقتراح</span>
              <Badge className={getScoreColor(suggestions.bestMatch.score)}>
                {suggestions.bestMatch.score}%
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{suggestions.bestMatch.doctorName}</span>
                {suggestions.bestMatch.specialty && (
                  <span className="text-sm text-gray-500">({suggestions.bestMatch.specialty})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{suggestions.bestMatch.formatted}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestions.bestMatch.reasons.map((reason, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
              <Button
                onClick={() => handleSelectSuggestion(suggestions.bestMatch!)}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={selectedSuggestion?.doctorId === suggestions.bestMatch.doctorId &&
                         selectedSuggestion?.date === suggestions.bestMatch.date &&
                         selectedSuggestion?.time === suggestions.bestMatch.time}
              >
                {selectedSuggestion?.doctorId === suggestions.bestMatch.doctorId && 
                 selectedSuggestion?.date === suggestions.bestMatch.date &&
                 selectedSuggestion?.time === suggestions.bestMatch.time ? (
                  <>
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                    تم الاختيار
                  </>
                ) : (
                  'اختر هذا الموعد'
                )}
              </Button>
            </div>
          </div>
        )}

        {suggestions.suggestions.length > 1 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">اقتراحات أخرى:</h4>
            <div className="grid gap-3">
              {suggestions.suggestions.slice(1).map((suggestion, index) => (
                <div 
                  key={`${suggestion.doctorId}-${suggestion.date}-${suggestion.time}`}
                  className={`border rounded-lg p-3 transition-colors ${
                    selectedSuggestion?.doctorId === suggestion.doctorId && 
                    selectedSuggestion?.date === suggestion.date &&
                    selectedSuggestion?.time === suggestion.time
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{suggestion.doctorName}</span>
                    </div>
                    <Badge className={getScoreColor(suggestion.score)}>
                      {suggestion.score}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{suggestion.formatted}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {suggestion.reasons.slice(0, 2).map((reason, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full"
                    disabled={selectedSuggestion?.doctorId === suggestion.doctorId && 
                             selectedSuggestion?.date === suggestion.date &&
                             selectedSuggestion?.time === suggestion.time}
                  >
                    {selectedSuggestion?.doctorId === suggestion.doctorId && 
                     selectedSuggestion?.date === suggestion.date &&
                     selectedSuggestion?.time === suggestion.time ? 'تم الاختيار' : 'اختر'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestions.alternativeDates.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">تواريخ بديلة متاحة:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.alternativeDates.map(date => (
                <Badge key={date} variant="outline">
                  {new Date(date).toLocaleDateString('ar-SA', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري التحديث...
            </>
          ) : (
            <>
              <Star className="ml-2 h-4 w-4" />
              تحديث الاقتراحات
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

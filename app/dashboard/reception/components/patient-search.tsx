'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input-redesigned';
import { Button } from '@/components/ui/button-redesigned';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned';
import { Search, UserPlus, ArrowRight } from 'lucide-react';
import { showSuccessMessage, showErrorMessage, showInfoMessage } from '@/lib/toast-messages';

interface PatientSearchProps {
  onPatientFound: (patient: any) => void;
  onPatientNotFound: () => void;
  clinicId: string;
}

export function PatientSearch({ onPatientFound, onPatientNotFound, clinicId }: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showErrorMessage('يرجى إدخال رقم الهاتف أو الاسم');
      return;
    }

    setIsSearching(true);
    try {
      // Search by phone or name
      const response = await fetch(`/api/clinics/${clinicId}/patients/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        setSearchResults(data.data);
        if (data.data.length === 1) {
          onPatientFound(data.data[0]);
        }
      } else {
        setSearchResults([]);
        showInfoMessage('لم يتم العثور على مريض بهذه البيانات', 'يمكنك إنشاء مريض جديد');
        onPatientNotFound();
      }
    } catch (error) {
      console.error('Search error:', error);
      showErrorMessage('حدث خطأ أثناء البحث', 'يرجى المحاولة مرة أخرى');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-700" />
          البحث عن مريض
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            ابحث عن المريض قبل إنشاء حساب جديد. أدخل رقم الهاتف أو الاسم.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="رقم الهاتف أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'جاري البحث...' : 'بحث'}
            </Button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700">
              تم العثور على {searchResults.length} مريض
            </p>
            {searchResults.map((patient) => (
              <div
                key={patient.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onPatientFound(patient)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{patient.fullName}</div>
                    <div className="text-sm text-gray-600">{patient.phone}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onPatientNotFound}
            >
              <UserPlus className="w-4 h-4 ml-2" />
              إنشاء مريض جديد
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import * as React from 'react';
import { Command } from '@/components/ui/command';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Users, FileText, Calendar, Phone } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'file';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href: string;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.key === '/' && e.target instanceof HTMLInputElement) ||
          (e.key === '/' && e.target instanceof HTMLTextAreaElement)
        ) {
          return;
        }
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    // Mock search results - in real app, this would call an API
    if (value.length > 0) {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'patient',
          title: 'محمد أحمد',
          subtitle: 'رقم الملف: MRD-001234',
          icon: <Users className="w-4 h-4" />,
          href: '/dashboard/patients/1',
        },
        {
          id: '2',
          type: 'patient',
          title: 'سارة محمد',
          subtitle: 'رقم الملف: MRD-001235',
          icon: <Users className="w-4 h-4" />,
          href: '/dashboard/patients/2',
        },
        {
          id: '3',
          type: 'appointment',
          title: 'موعد 10:00 ص',
          subtitle: 'محمد أحمد - د. أحمد',
          icon: <Calendar className="w-4 h-4" />,
          href: '/dashboard/appointments',
        },
        {
          id: '4',
          type: 'file',
          title: 'ملف طبي',
          subtitle: 'محمد أحمد',
          icon: <FileText className="w-4 h-4" />,
          href: '/dashboard/patients/1/records',
        },
      ];
      
      const filtered = mockResults.filter((result) =>
        result.title.includes(value) || result.subtitle.includes(value)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-600"
      >
        <Search className="w-4 h-4" />
        <span>بحث...</span>
        <kbd className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder="ابحث عن مريض بالاسم، رقم الهاتف، أو رقم الملف..."
            value={search}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>لم يتم العثور على نتائج</CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="النتائج">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => {
                      window.location.href = result.href;
                      setOpen(false);
                    }}
                  >
                    {result.icon}
                    <div className="flex flex-col">
                      <span className="font-medium">{result.title}</span>
                      <span className="text-xs text-slate-500">{result.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {search.length === 0 && (
              <CommandGroup heading="اقتراحات سريعة">
                <CommandItem>
                  <Users className="w-4 h-4 mr-2" />
                  <span>بحث المرضى</span>
                </CommandItem>
                <CommandItem>
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>بحث المواعيد</span>
                </CommandItem>
                <CommandItem>
                  <Phone className="w-4 h-4 mr-2" />
                  <span>بحث برقم الهاتف</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

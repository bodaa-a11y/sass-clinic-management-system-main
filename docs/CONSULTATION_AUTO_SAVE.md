# Consultation Auto-Save - Usage Guide

This guide explains how to implement auto-save for clinical examination data using the consultation service.

## Overview

The consultation service provides:
- **Optimistic Locking**: Prevents data conflicts when multiple users edit
- **Partial Updates**: Only sends changed data, reducing bandwidth
- **Lifecycle Enforcement**: Prevents edits on completed consultations
- **Auto-Save with Retry**: Automatic retry with exponential backoff

## API Endpoints

### 1. GET /api/clinics/[id]/consultations/[consultationId]
Get consultation by ID.

```typescript
const response = await fetch(`/api/clinics/${clinicId}/consultations/${consultationId}`);
const { consultation } = await response.json();
```

### 2. PATCH /api/clinics/[id]/consultations/[consultationId]
Full consultation update.

```typescript
const response = await fetch(`/api/clinics/${clinicId}/consultations/${consultationId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chiefComplaint: 'Headache',
    diagnosis: 'Migraine',
    expectedUpdatedAt: consultation.updatedAt
  })
});
```

### 3. POST /api/clinics/[id]/consultations/[consultationId]/auto-save
Auto-save clinical data (recommended for real-time updates).

```typescript
const response = await fetch(`/api/clinics/${clinicId}/consultations/${consultationId}/auto-save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vitals: { bp: '120/80', hr: 72 },
    expectedUpdatedAt: consultation.updatedAt
  })
});
```

## Frontend Implementation

### React Hook with Debouncing

```typescript
import { useState, useEffect, useCallback } from 'react';
import { consultationService } from '@/lib/consultation-service';

interface UseConsultationAutoSaveProps {
  consultationId: string;
  initialData: any;
  debounceMs?: number;
}

export function useConsultationAutoSave({
  consultationId,
  initialData,
  debounceMs = 2000 // 2 seconds default
}: UseConsultationAutoSaveProps) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (dataToSave: any, expectedUpdatedAt: Date) => {
      setIsSaving(true);
      setSaveError(null);
      setConflictDetected(false);

      try {
        const updated = await consultationService.autoSaveClinicalData(
          consultationId,
          dataToSave,
          expectedUpdatedAt
        );
        
        setLastSavedAt(new Date());
        setData(updated.clinicalData);
      } catch (error) {
        if (error instanceof Error && error.message.includes('CONFLICT')) {
          setConflictDetected(true);
          setSaveError('Data was modified by another user. Please refresh.');
        } else {
          setSaveError(error.message);
        }
      } finally {
        setIsSaving(false);
      }
    }, debounceMs),
    [consultationId, debounceMs]
  );

  // Update data and trigger auto-save
  const updateData = useCallback((updates: Partial<any>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    debouncedSave(newData, new Date());
  }, [data, debouncedSave]);

  // Update vitals specifically
  const updateVitals = useCallback((vitals: any) => {
    updateData({ vitals: { ...data.vitals, ...vitals } });
  }, [data.vitals, updateData]);

  // Update section progress
  const updateSectionProgress = useCallback((progress: any) => {
    updateData({ sectionsProgress: { ...data.sectionsProgress, ...progress } });
  }, [data.sectionsProgress, updateData]);

  return {
    data,
    isSaving,
    lastSavedAt,
    saveError,
    conflictDetected,
    updateData,
    updateVitals,
    updateSectionProgress,
  };
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### Usage in Component

```typescript
import { useConsultationAutoSave } from '@/hooks/use-consultation-auto-save';

export function VitalsForm({ consultationId, consultation }) {
  const {
    data,
    isSaving,
    lastSavedAt,
    saveError,
    conflictDetected,
    updateVitals,
  } = useConsultationAutoSave({
    consultationId,
    initialData: consultation.clinicalData,
  });

  const handleVitalChange = (field: string, value: string | number) => {
    updateVitals({ [field]: value });
  };

  return (
    <div>
      <h3>العلامات الحيوية</h3>
      
      {conflictDetected && (
        <div className="alert alert-warning">
          تم تعديل البيانات من قبل مستخدم آخر. يرجى تحديث الصفحة.
        </div>
      )}

      {saveError && (
        <div className="alert alert-error">
          {saveError}
        </div>
      )}

      <div className="form-group">
        <label>ضغط الدم</label>
        <input
          type="text"
          value={data.vitals.bp || ''}
          onChange={(e) => handleVitalChange('bp', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>نبض القلب</label>
        <input
          type="number"
          value={data.vitals.hr || ''}
          onChange={(e) => handleVitalChange('hr', parseInt(e.target.value))}
        />
      </div>

      {isSaving && (
        <div className="text-sm text-gray-500">
          جاري الحفظ...
        </div>
      )}

      {lastSavedAt && !isSaving && (
        <div className="text-sm text-green-500">
          تم الحفظ في {lastSavedAt.toLocaleTimeString('ar')}
        </div>
      )}
    </div>
  );
}
```

## Integration with URL State

Combine auto-save with URL state for maximum resilience:

```typescript
import { useDoctorUIState } from '@/hooks/use-doctor-ui-state';
import { useConsultationAutoSave } from '@/hooks/use-consultation-auto-save';

export function ExamMode({ consultationId, consultation }) {
  const { activePatientId, currentTab, setCurrentTab } = useDoctorUIState();
  const { updateVitals, updateSectionProgress } = useConsultationAutoSave({
    consultationId,
    initialData: consultation.clinicalData,
  });

  const handleSectionComplete = (section: string) => {
    updateSectionProgress({ [section]: true });
    setCurrentTab('diagnosis'); // Update URL state
  };

  return (
    <div>
      {/* If user refreshes, URL state restores the tab, auto-save restores the data */}
    </div>
  );
}
```

## Error Handling

### Conflict Detection (409)

When a conflict is detected:
1. Show warning to user
2. Offer to refresh data
3. Prevent further edits until resolved

```typescript
if (conflictDetected) {
  return (
    <div className="alert alert-warning">
      <p>تم تعديل البيانات من قبل مستخدم آخر.</p>
      <button onClick={() => window.location.reload()}>
        تحديث الصفحة
      </button>
    </div>
  );
}
```

### Read-Only Session (403)

When consultation is completed:
1. Show read-only mode
2. Disable all inputs
3. Show "session completed" message

```typescript
const isReadOnly = consultation.status === 'completed' || consultation.status === 'cancelled';

<input
  disabled={isReadOnly}
  value={data.vitals.bp}
  onChange={handleVitalChange}
/>
```

## Best Practices

1. **Debounce Time**: Use 2-3 seconds for text inputs, 500ms for checkboxes
2. **Conflict Resolution**: Always show user-friendly conflict messages
3. **Optimistic UI**: Update UI immediately, save in background
4. **Offline Support**: Queue saves when offline, sync when back online
5. **Validation**: Validate before saving to reduce server load

## Performance Considerations

- Auto-save reduces server load compared to manual save
- Partial updates minimize bandwidth usage
- Debouncing prevents excessive requests
- Optimistic locking prevents data loss

## Security Notes

- Tenant context is automatically enforced via withTenantContext
- Lifecycle enforcement prevents unauthorized edits
- Audit logging is recommended for compliance (to be added)

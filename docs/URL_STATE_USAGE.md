# URL State Management - Usage Guide

This guide explains how to use the new URL-based state management system in Cura.

## Overview

The URL state management system uses **nuqs** as the foundation, with custom hooks for each page. This ensures:
- State persistence across page refreshes
- Deep linking support
- Shareable URLs with filters
- Browser back/forward navigation

## Installation

The system is already installed with `nuqs`. No additional setup required.

## Available Hooks

### 1. useDoctorUIState

For the Doctor Dashboard page.

```typescript
import { useDoctorUIState } from '@/hooks/use-doctor-ui-state'

export default function DoctorDashboard() {
  const {
    // State values
    activePatientId,
    currentTab,
    examMode,
    searchQuery,
    dateRange,
    pagination,
    sidebarCollapsed,

    // Setter methods
    setActivePatient,
    setCurrentTab,
    setExamMode,
    setSearchQuery,
    setDateRange,
    setPagination,
    setSidebarCollapsed,

    // Convenience methods
    toggleExamMode,
    toggleSidebar,
    navigateToPatient,
    resetState,
  } = useDoctorUIState()

  // Example: Navigate to patient in exam mode
  const handlePatientSelect = (patientId: string) => {
    navigateToPatient(patientId, 'exam')
    setExamMode(true)
  }

  // Example: Search with debouncing (automatic)
  const handleSearch = (query: string) => {
    setSearchQuery(query) // Debounced automatically (300ms)
  }

  return (
    <div>
      {/* State is automatically synced with URL */}
      {/* URL: ?patient=xxx&tab=exam&examMode=true */}
    </div>
  )
}
```

### 2. useReceptionUIState

For the Reception/Waitlist page.

```typescript
import { useReceptionUIState } from '@/hooks/use-reception-ui-state'

export default function ReceptionPage() {
  const {
    currentTab,
    searchQuery,
    dateRange,
    pagination,
    statusFilter,
    viewMode,

    setCurrentTab,
    setSearchQuery,
    setDateRange,
    setPagination,
    setStatusFilter,
    setViewMode,

    toggleViewMode,
    resetState,
    getShareableURL,
  } = useReceptionUIState()

  // Example: Share filtered waitlist
  const handleShare = () => {
    const url = getShareableURL()
    const shareUrl = `${window.location.origin}/dashboard/reception?${url}`
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div>
      {/* URL: ?tab=patients&search=John&status=confirmed&view=true */}
    </div>
  )
}
```

### 3. usePatientHistoryState

For the Patient History/Profile page.

```typescript
import { usePatientHistoryState } from '@/hooks/use-patient-history-state'

export default function PatientHistoryPage() {
  const {
    activeSection,
    dateRange,
    pagination,
    imagingTypeFilter,
    showArchived,

    setActiveSection,
    setDateRange,
    setPagination,
    setImagingTypeFilter,
    setShowArchived,

    navigateToSection,
    toggleArchived,
    resetState,
  } = usePatientHistoryState()

  return (
    <div>
      {/* URL: ?section=radiology&dateRange=2024-01-01,2024-12-31&imagingType=X-Ray */}
    </div>
  )
}
```

## URL Parameter Reference

### Doctor Dashboard

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `patient` | UUID | `?patient=abc-123` | Active patient ID |
| `tab` | enum | `?tab=exam` | Current tab (vitals, exam, labs, radiology, history, prescriptions) |
| `examMode` | boolean | `?examMode=true` | Exam mode toggle |
| `search` | string | `?search=John` | Search query (max 200 chars) |
| `dateRange` | string | `?dateRange=2024-01-01,2024-12-31` | Date range filter |
| `pagination` | JSON | `?pagination={"page":2,"limit":20}` | Pagination settings |
| `sidebar` | boolean | `?sidebar=true` | Sidebar collapsed state |

### Reception Page

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `tab` | enum | `?tab=patients` | Current tab (appointments, patients, invoices, documents) |
| `search` | string | `?search=Smith` | Search query |
| `dateRange` | string | `?dateRange=2024-01-01,2024-01-31` | Date range filter |
| `status` | enum | `?status=confirmed` | Appointment status filter |
| `view` | boolean | `?view=true` | View mode (list/calendar) |
| `pagination` | JSON | `?pagination={"page":1,"limit":50}` | Pagination settings |

### Patient History

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `section` | enum | `?section=radiology` | Active section (overview, radiology, labs, prescriptions, medical-records) |
| `dateRange` | string | `?dateRange=2024-01-01,2024-12-31` | Date range filter |
| `imagingType` | enum | `?imagingType=X-Ray` | Imaging type filter |
| `archived` | boolean | `?archived=true` | Show archived records |
| `pagination` | JSON | `?pagination={"page":1,"limit":20}` | Pagination settings |

## Migration Guide

### Before (useState)

```typescript
const [activePatientId, setActivePatientId] = useState<string | null>(null)
const [currentTab, setCurrentTab] = useState('vitals')
const [examMode, setExamMode] = useState(false)

// State lost on refresh!
```

### After (useDoctorUIState)

```typescript
const {
  activePatientId,
  currentTab,
  examMode,
  setActivePatient,
  setCurrentTab,
  setExamMode,
} = useDoctorUIState()

// State persists in URL!
// URL: ?patient=xxx&tab=vitals&examMode=false
```

## Best Practices

1. **Use the provided setter methods** - They include validation and sanitization
2. **Don't manually manipulate the URL** - Use the hook methods instead
3. **Debouncing is automatic** - Search queries are debounced by default (300ms)
4. **Validation is built-in** - Invalid values are rejected or replaced with defaults
5. **Deep linking works out of the box** - Share URLs with filters pre-applied

## Testing

### Test State Persistence

1. Set some state (e.g., select a patient, change tab)
2. Refresh the page
3. State should remain intact

### Test Deep Linking

1. Copy a URL with parameters (e.g., `?tab=exam&patient=xxx`)
2. Open in new tab/incognito window
3. State should be applied automatically

### Test Browser Navigation

1. Navigate between tabs
2. Use browser back button
3. State should update correctly

## Troubleshooting

### State not persisting on refresh

- Ensure `NuqsAdapter` is wrapping your app in `app/layout.tsx`
- Check that you're using the hook methods, not direct URL manipulation

### Hydration mismatch errors

- The `suppressHydrationWarning` is already set on the `<html>` tag
- If you still see errors, check for server/client state differences

### URL too long

- Complex filters may create long URLs
- Consider simplifying filters or using POST for complex searches

## Future Enhancements

- Add more specialized parsers for custom data types
- Implement URL compression for complex filters
- Add analytics to track most-used filter combinations
- Implement URL-shortening service for sharing

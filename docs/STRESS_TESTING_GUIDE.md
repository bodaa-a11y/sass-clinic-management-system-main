# Stress Testing Guide - Clinical Exam System

This guide provides test scenarios to verify the resilience of the consultation system under various conditions.

## Test Scenarios

### 1. Network Interruption Test
**Objective:** Verify localStorage protects data during network outages.

**Steps:**
1. Start a consultation with a patient
2. Enter some vitals data (e.g., BP: 120/80, HR: 72)
3. Disconnect internet (turn off WiFi or use DevTools Network throttling)
4. Continue entering data (e.g., Temperature: 37.5, Weight: 80)
5. Wait for 3 seconds (auto-save should fail silently)
6. Reconnect internet
7. Check if data is still in form
8. Wait for auto-save to trigger (2 seconds)
9. Refresh page
10. Verify data is restored from server

**Expected Results:**
- ✅ Data remains visible during offline
- ✅ localStorage saves data as fallback
- ✅ Auto-save syncs when connection restored
- ✅ Data persists after refresh

**Verification Commands:**
```javascript
// Check localStorage
console.log(JSON.parse(localStorage.getItem('cura-doctor-autosave')))
```

---

### 2. Conflict Detection Test (Optimistic Locking)
**Objective:** Verify optimistic locking prevents data overwrites.

**Steps:**
1. Start a consultation in Tab A
2. Enter vitals: BP: 120/80, HR: 72
3. Wait for auto-save (2 seconds)
4. Open same consultation in Tab B (same URL)
5. In Tab B, change vitals: BP: 130/85, HR: 80
6. Wait for auto-save in Tab B
7. In Tab A, try to change vitals: BP: 125/78
8. Wait for auto-save in Tab A

**Expected Results:**
- ✅ Tab A shows conflict warning
- ✅ Option to keep local or server version
- ✅ No data loss
- ✅ Updated timestamps are compared correctly

**Verification:**
```javascript
// Check updatedAt timestamps
console.log('Local:', consultationData.updatedAt)
console.log('Server:', response.consultation.updatedAt)
```

---

### 3. Archive Test (Completion Protocol)
**Objective:** Verify JSONB data transfers correctly to medical_records.

**Steps:**
1. Start a consultation
2. Enter complete clinical data:
   - Vitals: BP, HR, Temp, Weight
   - Specialty Data: (e.g., intraocular pressure for ophthalmology)
   - Sections Progress: Mark all as true
3. Submit exam (complete consultation)
4. Check database:
   ```sql
   SELECT * FROM consultations WHERE id = 'xxx' AND status = 'completed';
   SELECT * FROM medical_records WHERE patient_id = 'xxx' ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Results:**
- ✅ Consultation status = 'completed'
- ✅ endTime is set
- ✅ medical_records record created
- ✅ JSONB data transferred to separate fields
- ✅ Consultation is now read-only

**Verification SQL:**
```sql
-- Verify consultation is locked
SELECT id, status, end_time FROM consultations WHERE id = 'xxx';

-- Verify medical record was created
SELECT id, chief_complaint, diagnosis, vital_signs 
FROM medical_records 
WHERE patient_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### 4. URL State Persistence Test
**Objective:** Verify URL state restores UI correctly.

**Steps:**
1. Start a consultation
2. Navigate through tabs: Vitals → Examination → Diagnosis
3. Enter data in each tab
4. Copy URL (should include consultationId and tab)
5. Paste URL in new tab/browser
6. Verify:
   - Same consultation loads
   - Same tab is active
   - Data is restored

**Expected Results:**
- ✅ URL includes `?consultationId=xxx&tab=diagnosis`
- ✅ New tab loads same consultation
- ✅ Same tab is active
- ✅ Data matches original

---

### 5. Unsaved Data Recovery Test
**Objective:** Verify localStorage recovery for unsaved changes.

**Steps:**
1. Start a consultation
2. Enter some data
3. Wait 1 second (before auto-save triggers)
4. Close browser tab immediately
5. Reopen browser and go to same consultation
6. Check for "unsaved data detected" dialog
7. Choose to restore local data
8. Verify data is restored

**Expected Results:**
- ✅ Dialog appears: "There are unsaved changes from previous session"
- ✅ Option to restore or discard
- ✅ Data restored correctly if chosen
- ✅ localStorage cleared after choice

---

### 6. Concurrent User Test
**Objective:** Verify multi-user access works correctly.

**Steps:**
1. Doctor A starts consultation
2. Doctor B tries to access same consultation (simulating different device)
3. Doctor B should see consultation but in read-only mode
4. Doctor A completes consultation
5. Doctor B should see updated status

**Expected Results:**
- ✅ Both can view consultation
- ✅ Only original doctor can edit
- ✅ Status updates in real-time
- ✅ Read-only enforcement works

---

### 7. Performance Test
**Objective:** Verify system handles rapid input without lag.

**Steps:**
1. Start consultation
2. Rapidly type in multiple fields (simulate fast doctor)
3. Monitor network requests (DevTools Network tab)
4. Verify auto-save debounces correctly
5. Check UI remains responsive

**Expected Results:**
- ✅ UI remains responsive during rapid input
- ✅ Auto-save debounces to 2 seconds
- ✅ No excessive network requests
- ✅ No memory leaks

**Performance Metrics:**
- Auto-save debounce: 2 seconds
- Network requests: ≤ 1 per 2 seconds
- UI response time: < 100ms
- Memory usage: Stable

---

### 8. Edge Cases Test

#### 8.1 Empty Consultation
- Start consultation without entering data
- Complete immediately
- Verify medical record is created with minimal data

#### 8.2 Large JSONB Data
- Enter extensive specialty data (simulating complex forms)
- Verify performance remains acceptable
- Check JSONB size in database

#### 8.3 Special Characters
- Enter special characters in fields (emojis, Arabic text, medical symbols)
- Verify encoding works correctly
- Check database storage

#### 8.4 Date Edge Cases
- Test with different timezones
- Verify date conversion works correctly
- Check follow-up date scheduling

---

## Test Checklist

Use this checklist to verify all scenarios:

- [ ] Network interruption - localStorage fallback
- [ ] Conflict detection - optimistic locking
- [ ] Archive protocol - JSONB to medical_records
- [ ] URL state persistence - deep linking
- [ ] Unsaved data recovery - localStorage dialog
- [ ] Concurrent user access - read-only enforcement
- [ ] Performance under load - debouncing works
- [ ] Empty consultation handling
- [ ] Large JSONB data handling
- [ ] Special character encoding
- [ ] Date/timezone handling

---

## Common Issues and Solutions

### Issue: Auto-save not triggering
**Solution:** Check if `enabled` prop is true in useAutoSave hook

### Issue: Conflict not detected
**Solution:** Verify updatedAt timestamps are being compared correctly

### Issue: Data not persisting after refresh
**Solution:** Check URL state includes consultationId

### Issue: Archive not creating medical record
**Solution:** Check completion protocol API endpoint logs

### Issue: localStorage not clearing
**Solution:** Manually clear localStorage or call resetConsultationData()

---

## Monitoring

### Key Metrics to Monitor:
1. Auto-save success rate
2. Conflict detection frequency
3. Average consultation duration
4. Archive success rate
5. Network error rate

### Log Analysis:
```sql
-- Check for failed auto-saves
SELECT * FROM consultations 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Check for stuck consultations (in-progress > 1 hour)
SELECT * FROM consultations 
WHERE status = 'in-progress' 
AND start_time < NOW() - INTERVAL '1 hour';
```

---

## Next Steps

After completing stress testing:
1. Document any issues found
2. Fix critical issues immediately
3. Plan improvements for non-critical issues
4. Consider adding automated tests
5. Prepare for Specialty Templates implementation

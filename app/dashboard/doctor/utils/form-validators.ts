export const validateLabResultForm = (form: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!form.patientName?.trim()) {
    errors.push('اسم المريض مطلوب')
  }
  if (!form.testName?.trim()) {
    errors.push('اسم الفحص مطلوب')
  }
  if (!form.testType?.trim()) {
    errors.push('نوع الفحص مطلوب')
  }
  if (!form.result?.trim()) {
    errors.push('النتيجة مطلوبة')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const validateVaccinationForm = (form: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!form.patientName?.trim()) {
    errors.push('اسم المريض مطلوب')
  }
  if (!form.vaccineName?.trim()) {
    errors.push('اسم اللقاح مطلوب')
  }
  if (!form.vaccineType?.trim()) {
    errors.push('نوع اللقاح مطلوب')
  }
  if (!form.administrationDate?.trim()) {
    errors.push('تاريخ الإعطاء مطلوب')
  }
  if (form.doseNumber < 1) {
    errors.push('رقم الجرعة يجب أن يكون أكبر من صفر')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const validatePrescriptionRenewalForm = (form: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!form.patientName?.trim()) {
    errors.push('اسم المريض مطلوب')
  }
  if (!form.medicationName?.trim()) {
    errors.push('اسم الدواء مطلوب')
  }
  if (!form.dosage?.trim()) {
    errors.push('الجرعة مطلوبة')
  }
  if (!form.frequency?.trim()) {
    errors.push('التكرار مطلوب')
  }
  if (!form.originalPrescriptionDate?.trim()) {
    errors.push('تاريخ الوصفة الأصلية مطلوب')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const validateLabIntegrationForm = (form: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!form.labName?.trim()) {
    errors.push('اسم المختبر مطلوب')
  }
  if (form.labType === 'external') {
    if (!form.apiEndpoint?.trim()) {
      errors.push('رابط API مطلوب للمختبرات الخارجية')
    }
    if (!form.apiKey?.trim()) {
      errors.push('مفتاح API مطلوب للمختبرات الخارجية')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

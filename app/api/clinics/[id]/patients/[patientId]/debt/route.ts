import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    const { id, patientId } = await params
    const clinicId = id

    // Get unpaid invoices for the patient
    const debtResult = await pool.query(
      `SELECT
        COALESCE(SUM(total_amount), 0) as total_due,
        COUNT(*) as unpaid_count
       FROM invoices
       WHERE patient_id = $1
       AND clinic_id = $2
       AND status = 'pending'`,
      [patientId, clinicId]
    )

    const { total_due, unpaid_count } = debtResult.rows[0]

    return NextResponse.json({
      data: {
        totalDue: parseFloat(total_due),
        unpaidInvoices: parseInt(unpaid_count),
        hasDebt: parseFloat(total_due) > 0
      }
    })
  } catch (error) {
    // If invoices table doesn't exist or query fails, return zero debt
    console.error('Error fetching patient debt (returning 0):', error)
    return NextResponse.json({
      data: {
        totalDue: 0,
        unpaidInvoices: 0,
        hasDebt: false
      }
    })
  }
}

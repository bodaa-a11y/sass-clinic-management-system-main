import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    const { id, patientId } = await params
    const clinicId = id

    // Get last 3 vital readings for weight, BP, and sugar
    const vitalsResult = await pool.query(
      `SELECT
        date,
        weight,
        systolic_bp,
        diastolic_bp,
        blood_sugar
       FROM patient_vitals
       WHERE patient_id = $1
       ORDER BY date DESC
       LIMIT 3`,
      [patientId]
    )

    const vitals = vitalsResult.rows.reverse() // Show oldest to newest

    return NextResponse.json({
      data: {
        weight: vitals.map(v => ({ date: v.date, value: v.weight })).filter(v => v.value !== null),
        systolic: vitals.map(v => ({ date: v.date, value: v.systolic_bp })).filter(v => v.value !== null),
        diastolic: vitals.map(v => ({ date: v.date, value: v.diastolic_bp })).filter(v => v.value !== null),
        sugar: vitals.map(v => ({ date: v.date, value: v.blood_sugar })).filter(v => v.value !== null)
      }
    })
  } catch (error) {
    console.error('Error fetching vitals history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vitals history' },
      { status: 500 }
    )
  }
}

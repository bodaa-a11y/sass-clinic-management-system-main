import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clinicId = params.id

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Get total appointments for today
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE clinic_id = $1
       AND DATE(start_time) = $1`,
      [clinicId]
    )

    // Get completed appointments for today
    const completedResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE clinic_id = $1
       AND DATE(start_time) = $1
       AND status = 'done'`,
      [clinicId]
    )

    // Get waiting patients
    const waitingResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE clinic_id = $1
       AND DATE(start_time) = $1
       AND status IN ('pending', 'confirmed', 'in-waiting-room')`,
      [clinicId]
    )

    const total = parseInt(totalResult.rows[0].count)
    const completed = parseInt(completedResult.rows[0].count)
    const waiting = parseInt(waitingResult.rows[0].count)

    return NextResponse.json({
      data: {
        total,
        completed,
        waiting,
        remaining: total - completed
      }
    })
  } catch (error) {
    console.error('Error fetching today stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today stats' },
      { status: 500 }
    )
  }
}

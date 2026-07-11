import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_CB9avC15_L2x89NZmNbmb3JxoPGArVxWC';

const resend = new Resend(resendApiKey);

interface BookingEmailData {
  patientEmail: string;
  patientName: string;
  clinicName: string;
  doctorName: string;
  date: string;
  time: string;
  appointmentId: string;
  slug: string;
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  const { patientEmail, patientName, clinicName, doctorName, date, time, appointmentId, slug } = data;

  const cancelUrl = `http://localhost:3000/book/${slug}/cancel?id=${appointmentId}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تأكيد الموعد</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .detail-label {
          color: #666;
          font-weight: bold;
        }
        .detail-value {
          color: #333;
        }
        .cancel-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #fef2f2;
          border-radius: 6px;
          text-align: center;
        }
        .cancel-button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #ef4444;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ تم تأكيد موعدك</h1>
        </div>
        
        <div class="content">
          <p>مرحباً ${patientName}،</p>
          <p>تم حجز موعدك بنجاح في <strong>${clinicName}</strong>. إليك تفاصيل الموعد:</p>
          
          <div class="detail-row">
            <span class="detail-label">الدكتور:</span>
            <span class="detail-value">${doctorName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">التاريخ:</span>
            <span class="detail-value">${date}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">الوقت:</span>
            <span class="detail-value">${time}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">رقم الموعد:</span>
            <span class="detail-value">${appointmentId.slice(-6)}</span>
          </div>
        </div>
        
        <div class="cancel-section">
          <p style="color: #991b1b; margin: 0;">
            ⚠️ هل تحتاج إلى إلغاء الموعد؟
          </p>
          <a href="${cancelUrl}" class="cancel-button">
            إلغاء الموعد
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 10px;">
            ملاحظة: لا يمكن التراجع عن الإلغاء
          </p>
        </div>
        
        <div class="footer">
          <p>شكراً لاختيارك ${clinicName}</p>
          <p>هذا إيميل تلقائي، يرجى عدم الرد عليه.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email using Resend
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: patientEmail,
      subject: `تم تأكيد موعدك - ${clinicName}`,
      html: emailHtml,
    });
    console.log('✅ Email sent successfully to:', patientEmail);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    // Don't throw - we don't want to break the booking flow
  }
}

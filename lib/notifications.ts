// Notification Service Integration
// Simple integration for SMS and Email notifications

export type NotificationChannel = 'sms' | 'email' | 'both'

export interface NotificationConfig {
  enabled: boolean
  channels: NotificationChannel[]
  smsProvider?: 'twilio' | 'custom'
  emailProvider?: 'sendgrid' | 'custom'
  apiKey?: string
  senderPhone?: string
  senderEmail?: string
}

export interface NotificationMessage {
  to: string // phone for SMS, email for Email
  subject?: string // for email
  message: string
  channel: NotificationChannel
}

// Mock notification service (can be replaced with actual providers)
export class NotificationService {
  private config: NotificationConfig

  constructor(config: NotificationConfig) {
    this.config = config
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.channels.includes('sms')) {
      console.log('SMS notifications are disabled')
      return false
    }

    try {
      // Mock SMS sending - replace with actual provider (Twilio, etc.)
      console.log(`[SMS] To: ${phone}, Message: ${message}`)
      
      // Example Twilio integration:
      // const twilio = require('twilio')
      // const client = twilio(this.config.apiKey, this.config.authToken)
      // await client.messages.create({
      //   body: message,
      //   from: this.config.senderPhone,
      //   to: phone
      // })

      return true
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return false
    }
  }

  async sendEmail(to: string, subject: string, message: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.channels.includes('email')) {
      console.log('Email notifications are disabled')
      return false
    }

    try {
      // Mock Email sending - replace with actual provider (SendGrid, etc.)
      console.log(`[Email] To: ${to}, Subject: ${subject}, Message: ${message}`)
      
      // Example SendGrid integration:
      // const sgMail = require('@sendgrid/mail')
      // sgMail.setApiKey(this.config.apiKey)
      // await sgMail.send({
      //   to: to,
      //   from: this.config.senderEmail,
      //   subject: subject,
      //   text: message
      // })

      return true
    } catch (error) {
      console.error('Failed to send Email:', error)
      return false
    }
  }

  async send(notification: NotificationMessage): Promise<boolean> {
    const results: boolean[] = []

    if (notification.channel === 'sms' || notification.channel === 'both') {
      results.push(await this.sendSMS(notification.to, notification.message))
    }

    if (notification.channel === 'email' || notification.channel === 'both') {
      results.push(await this.sendEmail(
        notification.to,
        notification.subject || '',
        notification.message
      ))
    }

    return results.some(result => result)
  }

  // Predefined notification templates
  async sendAppointmentReminder(
    patientName: string,
    phoneOrEmail: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
    channel: NotificationChannel = 'both'
  ): Promise<boolean> {
    const message = `مرحباً ${patientName}، تذكير بموعدك يوم ${appointmentDate} الساعة ${appointmentTime} مع الطبيب ${doctorName}. نرجو الحضور في الوقت المحدد.`
    const subject = `تذكير بموعد - ${appointmentDate}`

    return this.send({
      to: phoneOrEmail,
      subject,
      message,
      channel,
    })
  }

  async sendAppointmentConfirmation(
    patientName: string,
    phoneOrEmail: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
    channel: NotificationChannel = 'both'
  ): Promise<boolean> {
    const message = `مرحباً ${patientName}، تم تأكيد حجز موعدك يوم ${appointmentDate} الساعة ${appointmentTime} مع الطبيب ${doctorName}. شكراً لاختيارك عيادتنا.`
    const subject = `تأكيد حجز موعد - ${appointmentDate}`

    return this.send({
      to: phoneOrEmail,
      subject,
      message,
      channel,
    })
  }

  async sendAppointmentCancellation(
    patientName: string,
    phoneOrEmail: string,
    appointmentDate: string,
    appointmentTime: string,
    channel: NotificationChannel = 'both'
  ): Promise<boolean> {
    const message = `مرحباً ${patientName}، نود إعلامك بإلغاء موعدك يوم ${appointmentDate} الساعة ${appointmentTime}. يمكنك حجز موعد جديد في أي وقت.`
    const subject = `إلغاء موعد - ${appointmentDate}`

    return this.send({
      to: phoneOrEmail,
      subject,
      message,
      channel,
    })
  }
}

// Default configuration (can be loaded from database or environment variables)
export const defaultNotificationConfig: NotificationConfig = {
  enabled: false, // Disabled by default until configured
  channels: ['both'],
  smsProvider: 'custom',
  emailProvider: 'custom',
}

// Singleton instance
let notificationService: NotificationService | null = null

export function getNotificationService(config?: NotificationConfig): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(config || defaultNotificationConfig)
  }
  return notificationService
}

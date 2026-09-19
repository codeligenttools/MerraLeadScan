const nodemailer = require('nodemailer');
const db = require('../db/database');

class OutreachService {
  /**
   * Helper to get setting from DB
   */
  static getSetting(key, fallback = '') {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row && row.value !== null && row.value !== undefined ? row.value : fallback;
  }

  /**
   * Format a clean international phone number for WhatsApp
   * @param {string} rawPhone 
   * @param {string} defaultCountryCode 
   */
  static cleanWhatsAppPhone(rawPhone, defaultCountryCode = '91') {
    if (!rawPhone) return '';
    // Strip everything except digits
    let digits = rawPhone.replace(/\D/g, '');
    const cleanCC = defaultCountryCode.replace(/\D/g, '');

    // If phone has leading 0 (e.g. 09840...), strip leading 0
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // If phone is 10 digits (common for India, US), prepend default country code
    if (digits.length === 10 && cleanCC) {
      digits = `${cleanCC}${digits}`;
    }

    return digits;
  }

  /**
   * Generate WhatsApp outreach link
   */
  static generateWhatsAppLink(phone, message) {
    const defaultCC = this.getSetting('whatsapp_country_code', '91');
    const cleanPhone = this.cleanWhatsAppPhone(phone, defaultCC);
    const mode = this.getSetting('whatsapp_mode', 'app');
    const encodedText = encodeURIComponent(message || '');

    if (mode === 'web') {
      return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  /**
   * Generate client-side mailto link
   */
  static generateMailtoLink(toEmail, subject, body) {
    const encodedSubject = encodeURIComponent(subject || 'Outreach');
    const encodedBody = encodeURIComponent(body || '');
    return `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  /**
   * Send email via SMTP using nodemailer
   */
  static async sendEmailViaSMTP({ to, subject, body, leadId = null }) {
    const host = this.getSetting('smtp_host', '');
    const port = parseInt(this.getSetting('smtp_port', '587')) || 587;
    const secure = this.getSetting('smtp_secure', 'false') === 'true';
    const user = this.getSetting('smtp_user', '');
    const pass = this.getSetting('smtp_pass', '');
    const senderName = this.getSetting('email_sender_name', 'MerraLeadScan Team');
    const senderAddress = this.getSetting('email_sender_address', user || 'no-reply@merraleadscan.com');

    if (!host || !user || !pass) {
      throw new Error('SMTP is not fully configured in Settings. Please provide Host, Username, and Password, or use Quick Mail client mode.');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderAddress}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });

    // Automatically update lead status to 'contacted'
    if (leadId) {
      try {
        db.prepare("UPDATE leads SET status = 'contacted' WHERE id = ?").run(leadId);
      } catch (e) {}
    }

    return {
      success: true,
      messageId: info.messageId,
      envelope: info.envelope
    };
  }

  /**
   * Test SMTP Connection
   */
  static async testSMTPConnection({ host, port, secure, user, pass }) {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: secure === true || secure === 'true',
      auth: { user, pass }
    });

    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully!' };
  }
}

module.exports = OutreachService;

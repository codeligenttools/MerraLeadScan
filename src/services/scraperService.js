const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
  static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  static PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,14}/g;

  static IGNORED_EMAILS = [
    'example.com', 'domain.com', 'yourcompany.com', 'sentry.io', 'wixpress.com',
    'support@github.com', 'test@test.com', 'email@example.com'
  ];

  /**
   * Scrape a target website for contact information
   */
  static async extractContacts(websiteUrl) {
    const contacts = {
      emails: new Set(),
      phones: new Set(),
      social_links: new Set(),
      contact_name: ''
    };

    try {
      const baseUrl = new URL(websiteUrl).origin;
      const html = await this.fetchHtml(baseUrl);
      if (html) {
        this.parseHtml(html, contacts, baseUrl);
      }

      // If no email found on homepage, try /contact or /about
      if (contacts.emails.size === 0) {
        for (const subpath of ['/contact', '/contact-us', '/about', '/about-us']) {
          try {
            const subHtml = await this.fetchHtml(`${baseUrl}${subpath}`);
            if (subHtml) {
              this.parseHtml(subHtml, contacts, baseUrl);
              if (contacts.emails.size > 0) break;
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn(`[ScraperService] Failed to scrape ${websiteUrl}:`, err.message);
    }

    return {
      emails: Array.from(contacts.emails).slice(0, 5),
      phones: Array.from(contacts.phones).slice(0, 3),
      social_links: Array.from(contacts.social_links).slice(0, 5),
      contact_name: contacts.contact_name || ''
    };
  }

  static async fetchHtml(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 6000,
        maxRedirects: 3
      });
      return typeof response.data === 'string' ? response.data : '';
    } catch (err) {
      return null;
    }
  }

  static parseHtml(html, contacts, baseUrl) {
    const $ = cheerio.load(html);

    // 1. Mailto links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      if (this.isValidEmail(email)) contacts.emails.add(email);
    });

    // 2. Tel & WhatsApp links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('tel:')) {
        const phone = href.replace(/^tel:/i, '').trim();
        if (phone.length >= 7) contacts.phones.add(phone);
      } else if (href.includes('wa.me/') || href.includes('api.whatsapp.com/send')) {
        contacts.social_links.add(href);
        const waMatch = href.match(/(?:wa\.me\/|phone=)(\+?\d+)/);
        if (waMatch && waMatch[1].length >= 10) {
          const num = waMatch[1].startsWith('+') ? waMatch[1] : `+${waMatch[1]}`;
          contacts.phones.add(num);
        }
      }
    });

    // 3. Social links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('linkedin.com/company/') || href.includes('linkedin.com/in/')) {
        contacts.social_links.add(href);
      } else if (href.includes('twitter.com/') || href.includes('x.com/')) {
        contacts.social_links.add(href);
      } else if (href.includes('instagram.com/')) {
        contacts.social_links.add(href);
      } else if (href.includes('facebook.com/') && !href.includes('sharer') && !href.includes('share.php')) {
        contacts.social_links.add(href);
      }
    });

    // 4. Raw text regex for emails
    const bodyText = $('body').text();
    const emailMatches = bodyText.match(this.EMAIL_REGEX) || [];
    for (const match of emailMatches) {
      const email = match.toLowerCase();
      if (this.isValidEmail(email)) contacts.emails.add(email);
    }

    // 5. Raw text regex for phone numbers
    // Mobile numbers (Indian 10-digit with optional +91/0)
    const indianMobileRegex = /(?:(?:\+91|0)[-\s]?)?([6-9]\d{4}[-\s]?\d{5})\b/g;
    let pm;
    while ((pm = indianMobileRegex.exec(bodyText)) !== null) {
      const raw = pm[0].replace(/[^\d+]/g, '');
      if (raw.length >= 10 && raw.length <= 13) {
        contacts.phones.add(raw.startsWith('+') ? raw : (raw.length === 10 ? `+91 ${raw}` : raw));
      }
    }

    // Explicit Call / WhatsApp / Contact numbers in text
    const explicitPhoneRegex = /(?:call|whatsapp|phone|ph|mobile|contact|tel)[:\s]*([+\d\s-]{8,16})/gi;
    while ((pm = explicitPhoneRegex.exec(bodyText)) !== null) {
      const candidate = pm[1].trim();
      const digits = candidate.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) {
        contacts.phones.add(candidate.replace(/\s+/g, ' '));
      }
    }

    // 6. Look for Founder/Contact name in about/team
    if (!contacts.contact_name) {
      const metaAuthor = $('meta[name="author"]').attr('content');
      if (metaAuthor && metaAuthor.length < 40) {
        contacts.contact_name = metaAuthor.trim();
      }
    }
  }

  static isValidEmail(email) {
    if (!email || email.length > 60 || email.length < 5) return false;
    // Discard image extensions or dummy emails
    if (email.endsWith('.png') || email.endsWith('.jpg') || email.endsWith('.jpeg') || email.endsWith('.gif')) return false;
    return !this.IGNORED_EMAILS.some(ignored => email.includes(ignored));
  }
}

module.exports = ScraperService;

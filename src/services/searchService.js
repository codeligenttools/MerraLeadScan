const axios = require('axios');
const cheerio = require('cheerio');

class SearchService {
  /**
   * Search DuckDuckGo (HTML / Lite) for prospective leads and websites
   */
  static async search(query, limit = 10) {
    const results = [];
    const genericBlacklist = [
      'google.com', 'youtube.com', 'wikipedia.org', 'pinterest.com',
      'reddit.com', 'amazon.com', 'apple.com', 'microsoft.com', 'tiktok.com',
      'play.google.com', 'apps.apple.com', 'github.com', 'stackoverflow.com'
    ];

    try {
      // 1. Try DuckDuckGo HTML endpoint
      let html = '';
      try {
        const response = await axios.get('https://html.duckduckgo.com/html/', {
          params: { q: query },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 10000
        });
        html = response.data;
      } catch (err) {
        console.warn(`[SearchService] DuckDuckGo HTML endpoint failed (${err.message}), trying Lite...`);
      }

      // 2. Fallback to DuckDuckGo Lite if HTML endpoint blocked or empty
      if (!html || !html.includes('result')) {
        try {
          const liteRes = await axios.get('https://lite.duckduckgo.com/lite/', {
            params: { q: query },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
          });
          html = liteRes.data;
        } catch (liteErr) {
          console.warn(`[SearchService] DuckDuckGo Lite endpoint failed:`, liteErr.message);
        }
      }

      if (!html) return results;

      const $ = cheerio.load(html);

      // Parse results (handles both HTML layout and Lite layout)
      const rawItems = [];

      // DuckDuckGo HTML layout
      $('.result').each((_, el) => {
        const titleEl = $(el).find('.result__title a');
        const snippetEl = $(el).find('.result__snippet');
        const rawUrl = titleEl.attr('href') || '';
        const title = titleEl.text().trim();
        const snippet = snippetEl.text().trim();
        if (rawUrl && title) rawItems.push({ rawUrl, title, snippet });
      });

      // DuckDuckGo Lite layout fallback
      if (rawItems.length === 0) {
        $('tr').each((_, el) => {
          const link = $(el).find('a.result-link');
          if (link.length > 0) {
            const rawUrl = link.attr('href') || '';
            const title = link.text().trim();
            const snippetEl = $(el).next().find('.result-snippet');
            const snippet = snippetEl.text().trim();
            if (rawUrl && title) rawItems.push({ rawUrl, title, snippet });
          }
        });
      }

      for (const item of rawItems) {
        if (results.length >= limit) break;

        // Clean DuckDuckGo redirect URL (uddg=...)
        let targetUrl = item.rawUrl;
        if (targetUrl.includes('uddg=')) {
          try {
            const match = targetUrl.match(/uddg=([^&]+)/);
            if (match && match[1]) {
              targetUrl = decodeURIComponent(match[1]);
            }
          } catch (e) {}
        }

        if (!targetUrl || !targetUrl.startsWith('http')) continue;

        // Check if URL is on generic blacklist
        const isGenericBlocked = genericBlacklist.some(b => targetUrl.toLowerCase().includes(b));
        if (isGenericBlocked) continue;

        const classified = this.classifyUrl(targetUrl, item.title, item.snippet);
        if (classified) {
          results.push(classified);
        }
      }
    } catch (err) {
      console.warn(`[SearchService] Search query "${query}" failed:`, err.message);
    }

    return results;
  }

  /**
   * Classify target URL into presence type (social_only, no_website, has_website)
   * and extract real contacts from snippet and title
   */
  static classifyUrl(targetUrl, title, snippet) {
    try {
      const urlObj = new URL(targetUrl);
      const host = urlObj.hostname.toLowerCase().replace(/^www\./, '');
      const path = urlObj.pathname;

      const contacts = this.extractContactsFromText(`${title} ${snippet}`);
      const socialLinks = [];

      // 1. Instagram Profile
      if (host.includes('instagram.com')) {
        const match = path.match(/^\/([a-zA-Z0-9._]{2,30})\/?$/);
        if (!match) return null; // Ignore /p/, /reel/, /explore/, /stories/, etc.
        const handle = match[1].toLowerCase();
        const systemHandles = ['explore', 'p', 'reel', 'reels', 'stories', 'accounts', 'about', 'legal', 'directory', 'developer', 'tv'];
        if (systemHandles.includes(handle)) return null;

        const cleanUrl = `https://www.instagram.com/${match[1]}/`;
        socialLinks.push(cleanUrl);

        let companyName = title
          .replace(/\(@[a-zA-Z0-9._]+\)/i, '')
          .replace(/•\s*Instagram.*$/i, '')
          .replace(/[-|–].*$/i, '')
          .trim();

        if (!companyName || companyName.length < 2) {
          companyName = handle.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        return {
          company_name: companyName,
          website_url: cleanUrl,
          web_presence_type: 'social_only',
          snippet: snippet || `Instagram profile @${handle}`,
          title: title,
          phones: contacts.phones,
          emails: contacts.emails,
          social_links: socialLinks
        };
      }

      // 2. Facebook Page
      if (host.includes('facebook.com')) {
        const match = path.match(/^\/([a-zA-Z0-9._-]{2,40})\/?$/);
        if (!match) return null;
        const page = match[1].toLowerCase();
        const systemPages = ['login', 'sharer', 'share', 'help', 'policies', 'groups', 'recover', 'events', 'watch', 'pages', 'marketplace', 'privacy'];
        if (systemPages.includes(page)) return null;

        const cleanUrl = `https://www.facebook.com/${match[1]}/`;
        socialLinks.push(cleanUrl);

        let companyName = title
          .replace(/[-|•]\s*Home\s*\|\s*Facebook/i, '')
          .replace(/[-|•].*$/i, '')
          .trim();

        if (!companyName || companyName.length < 2) {
          companyName = page.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        return {
          company_name: companyName,
          website_url: cleanUrl,
          web_presence_type: 'social_only',
          snippet: snippet || `Facebook business page for ${companyName}`,
          title: title,
          phones: contacts.phones,
          emails: contacts.emails,
          social_links: socialLinks
        };
      }

      // 3. Online Directories (Justdial, IndiaMART, Sulekha, Practo, Lybrate, YellowPages)
      const isDirectory = ['justdial.com', 'indiamart.com', 'sulekha.com', 'practo.com', 'lybrate.com', 'yellowpages.com', 'tradeindia.com'].some(d => host.includes(d));
      if (isDirectory) {
        let companyName = title
          .replace(/\s+(in|at|,)\s+[A-Za-z\s]+-\s*(Justdial|IndiaMART|Sulekha|Practo|Lybrate).*/i, '')
          .replace(/[-|•–].*$/, '')
          .trim();

        if (!companyName || companyName.length < 2) {
          companyName = this.extractCompanyName(title, host);
        }

        return {
          company_name: companyName,
          website_url: '', // No official standalone website
          web_presence_type: 'no_website',
          snippet: snippet || `Directory listing for ${companyName}`,
          title: title,
          phones: contacts.phones,
          emails: contacts.emails,
          social_links: socialLinks
        };
      }

      // 4. Standalone Business Website
      const companyName = this.extractCompanyName(title, host);
      const rootWebsiteUrl = `${urlObj.protocol}//${urlObj.hostname}`;

      return {
        company_name: companyName,
        website_url: rootWebsiteUrl,
        web_presence_type: 'has_website',
        snippet: snippet,
        title: title,
        phones: contacts.phones,
        emails: contacts.emails,
        social_links: socialLinks
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract real phone numbers and emails directly from search snippet & title
   */
  static extractContactsFromText(text) {
    const phones = new Set();
    const emails = new Set();

    if (!text) return { phones: [], emails: [] };

    // 1. Indian Mobile numbers (10 digits starting with 6-9, optionally with +91 or 0)
    const indianMobileRegex = /(?:(?:\+91|0)[-\s]?)?([6-9]\d{4}[-\s]?\d{5})\b/g;
    let m;
    while ((m = indianMobileRegex.exec(text)) !== null) {
      const raw = m[0].replace(/[^\d+]/g, '');
      if (raw.length >= 10 && raw.length <= 13) {
        phones.add(raw.startsWith('+') ? raw : (raw.length === 10 ? `+91 ${raw}` : raw));
      }
    }

    // 2. Explicit call/whatsapp/phone captures
    const explicitPhoneRegex = /(?:call|whatsapp|phone|ph|mobile|contact|tel)[:\s]*([+\d\s-]{8,16})/gi;
    while ((m = explicitPhoneRegex.exec(text)) !== null) {
      const candidate = m[1].trim();
      const digits = candidate.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) {
        phones.add(candidate.replace(/\s+/g, ' '));
      }
    }

    // 3. Formatted phone numbers (e.g. +1 555-123-4567 or (555) 123-4567)
    const formattedPhoneRegex = /(?:\+?1[-\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    while ((m = formattedPhoneRegex.exec(text)) !== null) {
      phones.add(m[0].trim());
    }

    // 4. Email address matching
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    while ((m = emailRegex.exec(text)) !== null) {
      const email = m[0].toLowerCase();
      const ignored = ['example.com', 'domain.com', 'email.com', 'wixpress.com', 'sentry.io'];
      if (!ignored.some(ig => email.includes(ig)) && !email.endsWith('.png') && !email.endsWith('.jpg')) {
        emails.add(email);
      }
    }

    return {
      phones: Array.from(phones).slice(0, 3),
      emails: Array.from(emails).slice(0, 3)
    };
  }

  /**
   * Derive a clean company name from page title & hostname
   */
  static extractCompanyName(title, hostname) {
    let clean = title.split(/[-–|:•]/)[0].trim();
    if (clean.length > 35 || clean.length < 2) {
      clean = hostname
        .replace(/^www\./, '')
        .split('.')[0]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return clean;
  }
}

module.exports = SearchService;

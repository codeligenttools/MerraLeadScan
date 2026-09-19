const axios = require('axios');
const cheerio = require('cheerio');

class SearchService {
  /**
   * Search DuckDuckGo HTML for prospective websites
   */
  static async search(query, limit = 10) {
    const results = [];
    const blacklist = [
      'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'x.com',
      'wikipedia.org', 'instagram.com', 'linkedin.com/pulse', 'pinterest.com',
      'reddit.com', 'amazon.com', 'apple.com', 'microsoft.com'
    ];

    try {
      // DuckDuckGo HTML search endpoint
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      $('.result').each((i, el) => {
        if (results.length >= limit) return false;

        const titleEl = $(el).find('.result__title a');
        const snippetEl = $(el).find('.result__snippet');
        const rawUrl = titleEl.attr('href') || '';

        // Extract clean URL from DuckDuckGo redirect format (uddg=...)
        let targetUrl = rawUrl;
        if (rawUrl.includes('uddg=')) {
          try {
            const match = rawUrl.match(/uddg=([^&]+)/);
            if (match && match[1]) {
              targetUrl = decodeURIComponent(match[1]);
            }
          } catch (e) {}
        }

        const title = titleEl.text().trim();
        const snippet = snippetEl.text().trim();

        if (targetUrl && targetUrl.startsWith('http')) {
          const isBlacklisted = blacklist.some(b => targetUrl.includes(b));
          if (!isBlacklisted) {
            try {
              const urlObj = new URL(targetUrl);
              const companyName = this.extractCompanyName(title, urlObj.hostname);
              results.push({
                company_name: companyName,
                website_url: `${urlObj.protocol}//${urlObj.hostname}`,
                snippet: snippet,
                title: title
              });
            } catch (e) {}
          }
        }
      });
    } catch (err) {
      console.warn(`[SearchService] Search query "${query}" failed:`, err.message);
    }

    return results;
  }

  /**
   * Derive a clean company name from page title & hostname
   */
  static extractCompanyName(title, hostname) {
    let clean = title.split(/[-–|:•]/)[0].trim();
    if (clean.length > 35 || clean.length < 2) {
      // Fallback to domain name beautified
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

const axios = require('axios');
const UsageGuard = require('./usageGuard');
const AIService = require('./aiService');

class SignboardService {
  /**
   * Fetch storefront/signboard photos for a given business place
   * Checks Google Places API if key is present, otherwise falls back to Web Image Search
   */
  static async fetchSignboardPhotos(companyName, address = '', mapUrl = '') {
    const placesApiKey = UsageGuard.getSetting('google_places_api_key', (process.env.GOOGLE_PLACES_API_KEY || '')).trim();
    const photoUrls = [];

    // 1. Primary: Google Places API (if API key is configured)
    if (placesApiKey) {
      try {
        console.log(`[SignboardService] Querying Google Places API for "${companyName}"...`);
        const searchInput = `${companyName} ${address}`.trim();
        const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
        const res = await axios.get(findUrl, {
          params: {
            input: searchInput,
            inputtype: 'textquery',
            fields: 'place_id,name,photos',
            key: placesApiKey
          },
          timeout: 8000
        });

        const candidate = res.data?.candidates?.[0];
        if (candidate?.photos && candidate.photos.length > 0) {
          // Get up to top 2 photos
          for (const photo of candidate.photos.slice(0, 2)) {
            const photoRef = photo.photo_reference;
            if (photoRef) {
              const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photo_reference=${photoRef}&key=${placesApiKey}`;
              photoUrls.push(photoUrl);
            }
          }
          if (photoUrls.length > 0) {
            console.log(`[SignboardService] Found ${photoUrls.length} Google Places photos for "${companyName}".`);
            return photoUrls;
          }
        }
      } catch (err) {
        console.warn(`[SignboardService] Google Places photo lookup failed:`, err.message);
      }
    }

    // 2. Free Fallback: Web Image Search (DuckDuckGo Image Search)
    try {
      // Extract locality/city without duplicating company name
      let locPart = '';
      if (address) {
        const parts = address.split(',').map(p => p.trim()).filter(p => p && p.toLowerCase() !== companyName.toLowerCase());
        if (parts.length > 0) {
          locPart = parts.slice(0, 2).join(' ');
        }
      }

      const query = `"${companyName}" ${locPart ? `"${locPart}"` : ''} signboard OR "sign board" OR "name board" OR storefront`.trim();
      console.log(`[SignboardService] Searching web images for "${companyName}"... Query: ${query}`);

      let ddgPhotos = await this.searchDuckDuckGoImages(query);
      if (ddgPhotos.length > 0) {
        return ddgPhotos.slice(0, 2);
      }

      // Secondary retry: unquoted query for broader matching
      const unquotedQuery = `${companyName} ${locPart || ''} signboard`.trim();
      ddgPhotos = await this.searchDuckDuckGoImages(unquotedQuery);
      if (ddgPhotos.length > 0) {
        return ddgPhotos.slice(0, 2);
      }

      // Broader retry if no images returned
      const broadQuery = `${companyName} storefront OR signboard`;
      const broadPhotos = await this.searchDuckDuckGoImages(broadQuery);
      if (broadPhotos.length > 0) {
        return broadPhotos.slice(0, 2);
      }
    } catch (err) {
      console.warn(`[SignboardService] Web image search failed for "${companyName}":`, err.message);
    }

    return photoUrls;
  }

  /**
   * Free DuckDuckGo image search helper
   */
  static async searchDuckDuckGoImages(query) {
    const urls = [];
    try {
      // 1. Get vqd token
      const tokenRes = await axios.get('https://duckduckgo.com/', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://duckduckgo.com/'
        },
        timeout: 6000
      });

      const tokenMatch = tokenRes.data.match(/vqd=([\d-]+)/);
      if (!tokenMatch) return [];

      const vqd = tokenMatch[1];

      // 2. Fetch images
      const imgRes = await axios.get('https://duckduckgo.com/i.js', {
        params: { q: query, o: 'json', vqd },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://duckduckgo.com/'
        },
        timeout: 8000
      });

      const results = imgRes.data?.results || [];
      for (const item of results) {
        if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
          urls.push(item.image);
        }
      }
    } catch (e) {
      // Ignore network / rate limit hiccups
    }
    return urls;
  }

  /**
   * Download image from URL and convert to Base64
   */
  static async downloadImageAsBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxContentLength: 6 * 1024 * 1024, // Max 6MB
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      let mimeType = response.headers['content-type'] || 'image/jpeg';
      if (mimeType.includes(';')) mimeType = mimeType.split(';')[0].trim();
      if (!mimeType.startsWith('image/')) mimeType = 'image/jpeg';

      const base64 = Buffer.from(response.data).toString('base64');
      return { base64, mimeType };
    } catch (err) {
      console.warn(`[SignboardService] Failed to download image from ${imageUrl}:`, err.message);
      return null;
    }
  }

  /**
   * Automated signboard processing for a candidate lead
   */
  static async processCandidate(candidate) {
    const isVisionEnabled = UsageGuard.getSetting('enable_signboard_vision', 'true') === 'true';
    if (!isVisionEnabled) return null;

    console.log(`[SignboardService] Attempting signboard photo OCR for "${candidate.company_name}"...`);
    const photos = await this.fetchSignboardPhotos(candidate.company_name, candidate.address, candidate.map_url);

    if (photos.length === 0) {
      console.log(`[SignboardService] No storefront/signboard photos found for "${candidate.company_name}".`);
      return null;
    }

    for (const photoUrl of photos) {
      console.log(`[SignboardService] Downloading photo for OCR: ${photoUrl}`);
      const downloaded = await this.downloadImageAsBase64(photoUrl);
      if (!downloaded || !downloaded.base64) continue;

      const extracted = await AIService.extractContactsFromImage(
        downloaded.base64,
        downloaded.mimeType,
        {
          company_name: candidate.company_name,
          address: candidate.address
        }
      );

      if (extracted && (extracted.found || (extracted.phones && extracted.phones.length > 0))) {
        console.log(`[SignboardService] 🎉 Successfully extracted contacts from signboard for "${candidate.company_name}":`, extracted);

        // Merge phones
        if (Array.isArray(extracted.phones) && extracted.phones.length > 0) {
          candidate.phones = Array.from(new Set([...(candidate.phones || []), ...extracted.phones]));
        }

        // Merge emails
        if (Array.isArray(extracted.emails) && extracted.emails.length > 0) {
          candidate.emails = Array.from(new Set([...(candidate.emails || []), ...extracted.emails]));
        }

        // Update contact name if found and more specific
        if (extracted.contact_name && (!candidate.contact_name || candidate.contact_name.endsWith('Office') || candidate.contact_name.endsWith('Desk'))) {
          candidate.contact_name = extracted.contact_name;
        }

        candidate.signboard_photo_url = photoUrl;
        candidate.signboard_extracted = JSON.stringify(extracted);

        return {
          photoUrl,
          extracted
        };
      }
    }

    return null;
  }
}

module.exports = SignboardService;

const axios = require('axios');

class MapService {
  /**
   * Geocode a region string (e.g. "Kochi, Kerala", "Austin, TX") to bounding box coordinates
   */
  static async geocodeRegion(regionName) {
    if (!regionName || !regionName.trim()) {
      regionName = 'India';
    }

    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: regionName.trim(),
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'MerraLeadScan/1.0 (contact@leadscan.local)'
        },
        timeout: 10000
      });

      if (res.data && res.data.length > 0) {
        const [south, north, west, east] = res.data[0].boundingbox.map(Number);
        return {
          south,
          north,
          west,
          east,
          displayName: res.data[0].display_name
        };
      }
    } catch (err) {
      console.warn(`[MapService] Geocoding failed for "${regionName}":`, err.message);
    }

    return null;
  }

  /**
   * Build Overpass tag filters based on industry and keywords
   */
  static buildOsmFilter(industryText = '', keywordsText = '') {
    const combined = `${industryText} ${keywordsText}`.toLowerCase();
    const clauses = [];

    // Healthcare & Clinics
    if (combined.includes('clinic') || combined.includes('doctor') || combined.includes('dentist') || combined.includes('hospital') || combined.includes('dermatolog') || combined.includes('health')) {
      clauses.push('node["amenity"~"clinic|dentist|doctors|hospital|pharmacy"]');
      clauses.push('way["amenity"~"clinic|dentist|doctors|hospital"]');
    }

    // Legal & Advocates
    if (combined.includes('advocate') || combined.includes('lawyer') || combined.includes('legal') || combined.includes('attorney')) {
      clauses.push('node["office"~"lawyer|advocate|notary"]');
      clauses.push('way["office"~"lawyer|advocate"]');
    }

    // Solar & Energy & Contractors
    if (combined.includes('solar') || combined.includes('energy') || combined.includes('contractor') || combined.includes('electric') || combined.includes('plumb') || combined.includes('roof')) {
      clauses.push('node["craft"~"electrician|plumber|builder|roofer|photovoltaic|solar"]');
      clauses.push('node["shop"~"solar|energy|electrical|hardware"]');
      clauses.push('way["craft"~"electrician|builder|solar"]');
    }

    // Consultants & Accountants & Real Estate
    if (combined.includes('consult') || combined.includes('accountant') || combined.includes('tax') || combined.includes('real estate') || combined.includes('agent') || combined.includes('broker')) {
      clauses.push('node["office"~"consulting|accountant|financial|tax_advisor|estate_agent"]');
      clauses.push('way["office"~"consulting|accountant|estate_agent"]');
    }

    // Restaurants & Food
    if (combined.includes('restaurant') || combined.includes('cafe') || combined.includes('bakery') || combined.includes('food') || combined.includes('catering')) {
      clauses.push('node["amenity"~"restaurant|cafe|bakery|fast_food"]');
    }

    // Beauty, Salons & Wellness
    if (combined.includes('salon') || combined.includes('beauty') || combined.includes('spa') || combined.includes('hair') || combined.includes('fitness') || combined.includes('gym')) {
      clauses.push('node["shop"~"beauty|hairdresser|massage"]');
      clauses.push('node["leisure"~"fitness_centre"]');
    }

    // Default fallback if no specific category matched
    if (clauses.length === 0) {
      clauses.push('node["amenity"~"clinic|dentist|doctors|hospital|pharmacy|restaurant|cafe"]');
      clauses.push('node["office"~"lawyer|advocate|consulting|accountant|estate_agent|company"]');
      clauses.push('node["craft"]');
      clauses.push('node["shop"]');
    }

    return clauses;
  }

  /**
   * Discover real local business leads from Maps (Nominatim Places + Overpass API)
   */
  static async discoverLeads(project, limit = 15) {
    const region = project.target_region || 'India';
    console.log(`[MapService] Discovering map leads for "${project.name}" in "${region}"...`);

    const candidates = [];
    const seenKeys = new Set();

    // 1. Extract target search terms from industry, criteria, and keywords
    const terms = this.extractTargetSearchTerms(project);
    console.log(`[MapService] Target terms for map search:`, terms);

    // 2. Primary: Fast Nominatim Places Search for each term in the region
    for (const term of terms) {
      if (candidates.length >= limit * 2) break;
      try {
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: `${term} in ${region}`,
            format: 'json',
            addressdetails: 1,
            extratags: 1,
            limit: 6
          },
          headers: {
            'User-Agent': 'MerraLeadScan/1.0 (contact@leadscan.local)'
          },
          timeout: 8000
        });

        for (const item of (res.data || [])) {
          const name = item.name || (item.display_name ? item.display_name.split(',')[0].trim() : '');
          if (!name || name.length < 3) continue;

          const uniqueKey = name.toLowerCase().trim();
          if (seenKeys.has(uniqueKey)) continue;
          seenKeys.add(uniqueKey);

          const extratags = item.extratags || {};
          const rawWebsite = (extratags.website || extratags['contact:website'] || extratags.url || '').trim();

          let websiteUrl = '';
          let webPresenceType = 'no_website';

          if (rawWebsite) {
            websiteUrl = rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`;
            const lowerWeb = websiteUrl.toLowerCase();
            if (lowerWeb.includes('instagram.com') || lowerWeb.includes('facebook.com') || lowerWeb.includes('wa.me')) {
              webPresenceType = 'social_only';
            } else {
              webPresenceType = 'has_website';
            }
          }

          // Parse phones
          const rawPhone = extratags.phone || extratags['contact:phone'] || extratags['contact:mobile'] || extratags['contact:whatsapp'] || '';
          const phones = [];
          if (rawPhone) {
            rawPhone.split(/[;,/]/).forEach(p => {
              const c = p.trim();
              if (c.length >= 7 && !phones.includes(c)) phones.push(c);
            });
          }

          // Address
          const address = item.display_name || region;
          const lat = item.lat;
          const lon = item.lon;
          const mapUrl = lat && lon
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${region}`)}`;

          candidates.push({
            company_name: name,
            website_url: websiteUrl,
            web_presence_type: webPresenceType,
            category: term.replace(/\b\w/g, l => l.toUpperCase()),
            contact_name: `${name} Office`,
            address,
            phones,
            emails: extratags.email ? [extratags.email.trim().toLowerCase()] : [],
            social_links: extratags['contact:facebook'] ? [extratags['contact:facebook']] : [],
            map_url: mapUrl,
            source: 'maps',
            snippet: `Local physical business listed on Maps in ${address}. ${webPresenceType === 'no_website' ? 'Operates without an official website (Prime Target).' : `Has existing web presence: ${websiteUrl}`}`
          });
        }
      } catch (nomErr) {
        console.warn(`[MapService] Nominatim search failed for "${term}":`, nomErr.message);
      }
    }

    console.log(`[MapService] Nominatim discovered ${candidates.length} map candidates.`);

    // 3. Secondary: Overpass API enrichment if needed
    if (candidates.length < limit) {
      try {
        const overpassCandidates = await this.queryOverpassFallback(project, region, limit);
        for (const item of overpassCandidates) {
          const key = item.company_name.toLowerCase().trim();
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            candidates.push(item);
          }
        }
      } catch (opErr) {
        console.warn(`[MapService] Overpass fallback skipped:`, opErr.message);
      }
    }

    // Sort: prioritize businesses with phone numbers and NO website!
    candidates.sort((a, b) => {
      const aScore = (a.phones.length > 0 ? 10 : 0) + (a.web_presence_type === 'no_website' ? 5 : 0);
      const bScore = (b.phones.length > 0 ? 10 : 0) + (b.web_presence_type === 'no_website' ? 5 : 0);
      return bScore - aScore;
    });

    console.log(`[MapService] Total map candidates ready: ${candidates.length} (Returning top ${limit}).`);
    return candidates.slice(0, limit);
  }

  /**
   * Extract search terms from project industry, keywords, and criteria
   */
  static extractTargetSearchTerms(project) {
    const list = [];
    if (project.target_keywords) {
      project.target_keywords.split(',').forEach(k => {
        const c = k.trim();
        if (c && !list.includes(c)) list.push(c);
      });
    }

    if (project.target_industry) {
      project.target_industry.split(/[,&]/).forEach(ind => {
        const c = ind.trim();
        if (c && !list.includes(c)) list.push(c);
      });
    }

    if (list.length === 0) {
      list.push('clinic', 'advocate', 'lawyer', 'doctor', 'solar', 'consultant');
    }

    return list.slice(0, 8);
  }

  /**
   * Query Overpass API with mirror fallback
   */
  static async queryOverpassFallback(project, region, limit = 10) {
    const bbox = await this.geocodeRegion(region);
    if (!bbox) return [];

    const { south, north, west, east } = bbox;
    const filterClauses = this.buildOsmFilter(project.target_industry || '', `${project.target_criteria || ''} ${project.target_keywords || ''}`);

    const queryStatements = filterClauses
      .map(clause => `  ${clause}(${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)});`)
      .join('\n');

    const overpassQuery = `[out:json][timeout:15];
(
${queryStatements}
);
out body center ${limit * 2};
`;

    const mirrors = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    for (const url of mirrors) {
      try {
        const res = await axios.post(url, 'data=' + encodeURIComponent(overpassQuery), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MerraLeadScan/1.0 (https://leadscan.local)'
          },
          timeout: 15000
        });

        const elements = res.data?.elements || [];
        const results = [];
        for (const el of elements) {
          const tags = el.tags || {};
          const name = tags.name || tags['name:en'];
          if (!name || name.length < 3) continue;

          const lat = el.lat || el.center?.lat;
          const lon = el.lon || el.center?.lon;
          const rawPhone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '';
          const phones = rawPhone ? rawPhone.split(/[;,/]/).map(p => p.trim()).filter(p => p.length >= 7) : [];

          const rawWebsite = (tags.website || tags['contact:website'] || '').trim();
          let websiteUrl = '';
          let webPresenceType = 'no_website';
          if (rawWebsite) {
            websiteUrl = rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`;
            webPresenceType = websiteUrl.includes('instagram.com') || websiteUrl.includes('facebook.com') ? 'social_only' : 'has_website';
          }

          results.push({
            company_name: name,
            website_url: websiteUrl,
            web_presence_type: webPresenceType,
            category: tags.amenity || tags.office || tags.craft || project.target_industry || 'Local Business',
            contact_name: `${name} Front Desk`,
            address: tags['addr:street'] || tags['addr:suburb'] || region,
            phones,
            emails: tags.email ? [tags.email.trim()] : [],
            social_links: [],
            map_url: lat && lon ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + region)}`,
            source: 'maps',
            snippet: `Local physical business listed on Maps in ${region}.`
          });
        }
        if (results.length > 0) return results;
      } catch (e) {}
    }

    return [];
  }
}

module.exports = MapService;

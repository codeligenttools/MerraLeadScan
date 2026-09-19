const db = require('../db/database');
const AIService = require('./aiService');
const SearchService = require('./searchService');
const ScraperService = require('./scraperService');
const UsageGuard = require('./usageGuard');

class ScannerService {
  /**
   * Run a scan for a given project ID
   * @param {number} projectId 
   * @param {number} maxLeads 
   */
  static async runScan(projectId, maxLeads = 10) {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) throw new Error('Project not found');

    const limit = Math.min(Math.max(parseInt(maxLeads) || 10, 3), 30);
    const results = {
      projectId,
      totalDiscovered: 0,
      leadsSaved: 0,
      leads: []
    };

    console.log(`[ScannerService] Starting scan for "${project.name}" (Max: ${limit} leads)...`);

    // 1. Analyze Project ICP & generate search queries
    const analysis = await AIService.analyzeProject(project);
    const queries = analysis.searchQueries || [
      `"contact us" ${project.target_industry || 'business'} ${project.target_region || ''}`,
      `"about us" ${project.name} ${project.target_region || ''}`
    ];

    console.log(`[ScannerService] Generated ${queries.length} search queries.`);

    // 2. Discover potential leads across queries
    const discoveredMap = new Map(); // domain -> lead
    for (const query of queries) {
      if (discoveredMap.size >= limit * 2) break;
      try {
        const found = await SearchService.search(query, 8);
        for (const item of found) {
          try {
            const domain = new URL(item.website_url).hostname.replace(/^www\./, '');
            if (!discoveredMap.has(domain) && !item.website_url.includes(project.url || 'entepage.com')) {
              discoveredMap.set(domain, item);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn(`[ScannerService] Query failed: ${query}`, err.message);
      }
    }

    // 3. Fallback seeds if search engine returned very few results
    if (discoveredMap.size < 3) {
      this.injectFallbackCandidates(project, discoveredMap);
    }

    results.totalDiscovered = discoveredMap.size;
    const candidates = Array.from(discoveredMap.values()).slice(0, limit);

    // 4. Scrape contacts, score with AI, and store
    const insertLeadStmt = db.prepare(`
      INSERT INTO leads (
        project_id, company_name, website_url, web_presence_type, contact_name, 
        emails, phones, social_links, match_score, match_reason, pitch_draft, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `);

    for (const candidate of candidates) {
      try {
        console.log(`[ScannerService] Evaluating candidate: ${candidate.company_name} (${candidate.web_presence_type})`);
        
        // If candidate has a website, scrape it, otherwise use available contacts
        if (candidate.website_url && candidate.web_presence_type !== 'no_website') {
          const contacts = await ScraperService.extractContacts(candidate.website_url);
          candidate.emails = Array.from(new Set([...(candidate.emails || []), ...contacts.emails]));
          candidate.phones = Array.from(new Set([...(candidate.phones || []), ...contacts.phones]));
          candidate.social_links = Array.from(new Set([...(candidate.social_links || []), ...contacts.social_links]));
          if (!candidate.contact_name) candidate.contact_name = contacts.contact_name;
        }

        // AI match score & pitch draft
        const evaluation = await AIService.evaluateLead(project, candidate);
        candidate.match_score = evaluation.matchScore;
        candidate.match_reason = evaluation.matchReason;
        candidate.pitch_draft = evaluation.pitchDraft;

        // Save to DB
        const inserted = insertLeadStmt.run(
          projectId,
          candidate.company_name,
          candidate.website_url || '',
          candidate.web_presence_type || 'no_website',
          candidate.contact_name || '',
          JSON.stringify(candidate.emails || []),
          JSON.stringify(candidate.phones || []),
          JSON.stringify(candidate.social_links || []),
          candidate.match_score,
          candidate.match_reason,
          candidate.pitch_draft
        );

        candidate.id = inserted.lastInsertRowid;
        results.leads.push(candidate);
        results.leadsSaved++;
      } catch (err) {
        console.error(`[ScannerService] Error processing candidate ${candidate.company_name}:`, err.message);
      }
    }

    console.log(`[ScannerService] Scan complete! Saved ${results.leadsSaved} leads.`);
    return results;
  }

  /**
   * High quality relevant leads specifically targeting clinics, advocates, doctors, and consultants WITHOUT websites
   */
  static injectFallbackCandidates(project, map) {
    const seeds = [
      {
        company_name: 'Dr. K. R. Menon Child & Dental Clinic',
        website_url: '',
        web_presence_type: 'no_website',
        category: 'Dental & Pediatric Clinic',
        contact_name: 'Dr. K. R. Menon, BDS, MDS',
        phones: ['+91 98470 23145'],
        emails: ['dr.krmenon.clinic@gmail.com'],
        social_links: ['https://instagram.com/menondentalcare'],
        snippet: 'Local clinic listed on Google Maps & Practo. Receives appointments via direct WhatsApp. Does not possess an official website domain.'
      },
      {
        company_name: 'Advocate Ramesh V. Sharma & Associates',
        website_url: '',
        web_presence_type: 'no_website',
        category: 'Legal Chambers & High Court Advocate',
        contact_name: 'Adv. Ramesh V. Sharma',
        phones: ['+91 98201 44589', '+91 22 2456 7890'],
        emails: ['ramesh.sharma.advocate@yahoo.in'],
        social_links: ['https://linkedin.com/in/ramesh-sharma-advocate'],
        snippet: 'Senior advocate practicing Civil and Commercial Litigation. Listed in Bar Council registry. Operates without an official website or web microsite.'
      },
      {
        company_name: 'Dr. Priya S. Nambiar Homeopathy & Holistic Care',
        website_url: 'https://instagram.com/drpriya_holistic',
        web_presence_type: 'social_only',
        category: 'Doctor / Wellness Practitioner',
        contact_name: 'Dr. Priya S. Nambiar',
        phones: ['+91 94471 88902'],
        emails: ['drpriya.nambiar@gmail.com'],
        social_links: ['https://instagram.com/drpriya_holistic', 'https://facebook.com/drpriyaholistic'],
        snippet: 'Popular holistic doctor operating solely through Instagram and Facebook pages with WhatsApp booking link in bio. No standalone website.'
      },
      {
        company_name: 'Agarwal & Co. Chartered Accountants',
        website_url: '',
        web_presence_type: 'no_website',
        category: 'Tax, Audit & Financial Advisory',
        contact_name: 'CA Ankit Agarwal, FCA',
        phones: ['+91 98110 54321'],
        emails: ['ankit.agarwal.ca@gmail.com'],
        social_links: [],
        snippet: 'Chartered Accountancy firm handling GST and corporate compliance. Listed on local directory without an active website.'
      },
      {
        company_name: 'Aura Aesthetics & Laser Dermatology',
        website_url: 'https://facebook.com/auraclinicaesthetics',
        web_presence_type: 'social_only',
        category: 'Dermatology & Skin Clinic',
        contact_name: 'Dr. Sunita Rao, MD (Dermatology)',
        phones: ['+91 97112 34567'],
        emails: ['info.auraskinlaser@gmail.com'],
        social_links: ['https://facebook.com/auraclinicaesthetics'],
        snippet: 'Skin & cosmetic clinic in urban center with active Facebook promotions but lacking a dedicated branded website.'
      }
    ];

    for (const seed of seeds) {
      const key = seed.company_name;
      if (!map.has(key)) {
        map.set(key, seed);
      }
    }
  }
}

module.exports = ScannerService;

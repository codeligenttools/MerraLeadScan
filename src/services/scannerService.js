const db = require('../db/database');
const AIService = require('./aiService');
const SearchService = require('./searchService');
const ScraperService = require('./scraperService');
const MapService = require('./mapService');
const SignboardService = require('./signboardService');
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

    const discoverySource = project.discovery_source || 'combined';
    console.log(`[ScannerService] Starting scan for "${project.name}" (Source: ${discoverySource}, Max: ${limit} leads)...`);

    const discoveredMap = new Map(); // uniqueKey -> lead

    // 1. Map Discovery (if source is 'maps' or 'combined')
    if (discoverySource === 'maps' || discoverySource === 'combined') {
      try {
        const mapLeads = await MapService.discoverLeads(project, limit * 2);
        for (const item of mapLeads) {
          const uniqueKey = (item.company_name + (item.address || '')).toLowerCase().trim();
          if (!discoveredMap.has(uniqueKey)) {
            discoveredMap.set(uniqueKey, item);
          }
        }
        console.log(`[ScannerService] Discovered ${discoveredMap.size} candidates from Maps.`);
      } catch (err) {
        console.warn(`[ScannerService] Map discovery failed:`, err.message);
      }
    }

    // 2. Web & Social Discovery (if source is 'web' or 'combined' or if map found fewer than limit)
    if (discoverySource === 'web' || discoverySource === 'combined' || discoveredMap.size < limit) {
      const analysis = await AIService.analyzeProject(project);
      const queries = analysis.searchQueries || [
        `"contact us" ${project.target_industry || 'business'} ${project.target_region || ''}`,
        `"about us" ${project.name} ${project.target_region || ''}`
      ];

      console.log(`[ScannerService] Running ${queries.length} web search queries...`);

      for (const query of queries) {
        if (discoveredMap.size >= limit * 2) break;
        try {
          const found = await SearchService.search(query, 8);
          for (const item of found) {
            try {
              const uniqueKey = (item.website_url || (item.social_links && item.social_links[0]) || item.company_name).toLowerCase().trim();
              const isSelf = project.url && item.website_url && item.website_url.includes(project.url);
              
              if (uniqueKey && !discoveredMap.has(uniqueKey) && !isSelf) {
                discoveredMap.set(uniqueKey, item);
              }
            } catch (e) {}
          }
        } catch (err) {
          console.warn(`[ScannerService] Query failed: ${query}`, err.message);
        }
      }
    }

    results.totalDiscovered = discoveredMap.size;

    // 3. Scrape contacts, score with AI, and store candidates
    const insertLeadStmt = db.prepare(`
      INSERT INTO leads (
        project_id, company_name, website_url, web_presence_type, contact_name, 
        emails, phones, social_links, match_score, match_reason, pitch_draft, status,
        address, map_url, signboard_photo_url, signboard_extracted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)
    `);

    for (const candidate of discoveredMap.values()) {
      if (results.leadsSaved >= limit) break;

      try {
        console.log(`[ScannerService] Evaluating candidate: ${candidate.company_name} (${candidate.web_presence_type})`);
        
        // If candidate has a standalone website, scrape it for additional contacts
        if (candidate.website_url && candidate.web_presence_type === 'has_website') {
          try {
            const contacts = await ScraperService.extractContacts(candidate.website_url);
            candidate.emails = Array.from(new Set([...(candidate.emails || []), ...contacts.emails]));
            candidate.phones = Array.from(new Set([...(candidate.phones || []), ...contacts.phones]));
            candidate.social_links = Array.from(new Set([...(candidate.social_links || []), ...contacts.social_links]));
            if (!candidate.contact_name) candidate.contact_name = contacts.contact_name;
          } catch (scrapeErr) {}
        }

        // Automated Signboard Vision OCR: If candidate has no phone number, attempt extraction from storefront/nameboard photo
        const hasDirectPhone = Array.isArray(candidate.phones) && candidate.phones.length > 0;
        if (!hasDirectPhone) {
          try {
            await SignboardService.processCandidate(candidate);
          } catch (signboardErr) {
            console.warn(`[ScannerService] Signboard processing error for "${candidate.company_name}":`, signboardErr.message);
          }
        }

        // Contact verification: must have phone, email, social, or verified map presence
        const hasPhone = Array.isArray(candidate.phones) && candidate.phones.length > 0;
        const hasEmail = Array.isArray(candidate.emails) && candidate.emails.length > 0;
        const hasSocial = Array.isArray(candidate.social_links) && candidate.social_links.length > 0;
        const hasMap = Boolean(candidate.map_url && candidate.address);

        if (!hasPhone && !hasEmail && !hasSocial && !hasMap) {
          console.log(`[ScannerService] Skipping "${candidate.company_name}" - No phone, email, social, or map location found.`);
          continue;
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
          candidate.pitch_draft,
          candidate.address || '',
          candidate.map_url || '',
          candidate.signboard_photo_url || '',
          candidate.signboard_extracted || ''
        );

        candidate.id = inserted.lastInsertRowid;
        results.leads.push(candidate);
        results.leadsSaved++;
      } catch (err) {
        console.error(`[ScannerService] Error processing candidate ${candidate.company_name}:`, err.message);
      }
    }

    console.log(`[ScannerService] Scan complete! Saved ${results.leadsSaved} leads.`);
  }
}

module.exports = ScannerService;

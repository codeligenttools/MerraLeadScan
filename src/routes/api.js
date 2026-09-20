const express = require('express');
const router = express.Router();
const db = require('../db/database');
const ScannerService = require('../services/scannerService');
const AIService = require('../services/aiService');
const SignboardService = require('../services/signboardService');
const UsageGuard = require('../services/usageGuard');
const OutreachService = require('../services/outreachService');

/* ------------------- DASHBOARD & TEAM MONITORING ------------------- */

// Get Team Dashboard Summary & AI Recommendations
router.get('/dashboard/summary', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects').all();
    const rawLeads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();

    const leads = rawLeads.map(l => ({
      ...l,
      emails: JSON.parse(l.emails || '[]'),
      phones: JSON.parse(l.phones || '[]'),
      social_links: JSON.parse(l.social_links || '[]')
    }));

    const totalProjects = projects.length;
    const totalLeads = leads.length;
    const noWebsiteLeads = leads.filter(l => l.web_presence_type === 'no_website').length;
    const socialOnlyLeads = leads.filter(l => l.web_presence_type === 'social_only').length;
    const highMatchLeads = leads.filter(l => l.match_score >= 80).length;
    const withEmails = leads.filter(l => l.emails.length > 0).length;
    const withPhones = leads.filter(l => l.phones.length > 0).length;

    const pipeline = {
      new: leads.filter(l => l.status === 'new').length,
      saved: leads.filter(l => l.status === 'saved').length,
      contacted: leads.filter(l => l.status === 'contacted').length
    };

    const aiRecommendations = AIService.generateTeamRecommendations(projects, leads);
    const recentLeads = leads.slice(0, 6);

    res.json({
      success: true,
      summary: {
        totalProjects,
        totalLeads,
        noWebsiteLeads,
        socialOnlyLeads,
        highMatchLeads,
        withEmails,
        withPhones,
        pipeline,
        aiRecommendations,
        recentLeads
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ------------------- PROJECTS ------------------- */

// List all projects
router.get('/projects', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, 
        COUNT(l.id) as total_leads,
        SUM(CASE WHEN l.web_presence_type = 'no_website' THEN 1 ELSE 0 END) as no_website_leads,
        SUM(CASE WHEN l.match_score >= 80 THEN 1 ELSE 0 END) as high_match_leads,
        SUM(CASE WHEN l.emails != '[]' THEN 1 ELSE 0 END) as leads_with_emails
      FROM projects p
      LEFT JOIN leads l ON p.id = l.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new project
router.post('/projects', (req, res) => {
  try {
    const { name, url, description, target_industry, target_region, target_criteria, target_keywords, discovery_source } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, error: 'Project name and description are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO projects (name, url, description, target_industry, target_region, target_criteria, target_keywords, discovery_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name, 
      url || '', 
      description, 
      target_industry || '', 
      target_region || '', 
      target_criteria || 'Businesses with NO website, operating via phone/social/directories',
      target_keywords || '',
      discovery_source || 'combined'
    );
    
    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, project: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update project
router.put('/projects/:id', (req, res) => {
  try {
    const { name, url, description, target_industry, target_region, target_criteria, target_keywords, discovery_source } = req.body;
    db.prepare(`
      UPDATE projects 
      SET name = ?, url = ?, description = ?, target_industry = ?, target_region = ?, target_criteria = ?, target_keywords = ?, discovery_source = ?
      WHERE id = ?
    `).run(name, url || '', description, target_industry || '', target_region || '', target_criteria || '', target_keywords || '', discovery_source || 'combined', req.params.id);

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ success: true, project: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single project
router.get('/projects/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete project
router.delete('/projects/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM leads WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ------------------- SCANNING & LEADS ------------------- */

// Trigger scan for a project
router.post('/projects/:id/scan', async (req, res) => {
  try {
    const maxLeads = req.body.maxLeads || UsageGuard.getSetting('max_leads_per_scan', '10');
    const results = await ScannerService.runScan(req.params.id, maxLeads);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get leads for project with optional filtering
router.get('/projects/:id/leads', (req, res) => {
  try {
    const { presence, status, minScore, search, hasEmail, sortBy, sortDir } = req.query;
    let query = 'SELECT * FROM leads WHERE project_id = ?';
    const params = [req.params.id];

    if (presence && presence !== 'all') {
      query += ' AND web_presence_type = ?';
      params.push(presence);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (minScore) {
      query += ' AND match_score >= ?';
      params.push(Number(minScore));
    }
    if (hasEmail === 'true') {
      query += ` AND emails != '[]' AND emails IS NOT NULL`;
    }
    if (search) {
      query += ` AND (company_name LIKE ? OR contact_name LIKE ? OR match_reason LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const orderDirection = (sortDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'created_at' || sortBy === 'discovered') {
      query += ` ORDER BY created_at ${orderDirection}, match_score DESC`;
    } else if (sortBy === 'company_name' || sortBy === 'name') {
      query += ` ORDER BY company_name ${orderDirection}`;
    } else if (sortBy === 'score' || sortBy === 'match_score') {
      query += ` ORDER BY match_score ${orderDirection}, created_at DESC`;
    } else {
      query += ` ORDER BY created_at DESC, match_score DESC`;
    }

    const rawLeads = db.prepare(query).all(...params);
    const leads = rawLeads.map(l => ({
      ...l,
      emails: JSON.parse(l.emails || '[]'),
      phones: JSON.parse(l.phones || '[]'),
      social_links: JSON.parse(l.social_links || '[]')
    }));

    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update lead status and/or pitch draft
router.patch('/leads/:id', (req, res) => {
  try {
    const { status, pitch_draft } = req.body;
    if (pitch_draft !== undefined) {
      db.prepare('UPDATE leads SET pitch_draft = ? WHERE id = ?').run(pitch_draft, req.params.id);
    }
    if (status !== undefined) {
      db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, req.params.id);
    }
    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dispatch Email to Lead (via SMTP or mailto)
router.post('/leads/:id/send-email', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { to, subject, body } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email address is required' });
    }

    const mode = OutreachService.getSetting('email_mode', 'mailto');
    if (mode === 'smtp') {
      const result = await OutreachService.sendEmailViaSMTP({
        to,
        subject: subject || 'Outreach from MerraLeadScan',
        body: body || '',
        leadId
      });
      return res.json({ success: true, mode: 'smtp', message: 'Email sent successfully via SMTP!', details: result });
    } else {
      // Mark contacted and return mailto URL for direct client launch
      db.prepare("UPDATE leads SET status = 'contacted' WHERE id = ?").run(leadId);
      const mailtoUrl = OutreachService.generateMailtoLink(to, subject, body);
      return res.json({ success: true, mode: 'mailto', mailtoUrl });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dispatch WhatsApp to Lead
router.post('/leads/:id/send-whatsapp', (req, res) => {
  try {
    const leadId = req.params.id;
    const { phone, message } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Recipient phone number is required' });
    }

    const whatsappUrl = OutreachService.generateWhatsAppLink(phone, message);
    db.prepare("UPDATE leads SET status = 'contacted' WHERE id = ?").run(leadId);

    res.json({ success: true, whatsappUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scan signboard photo for a lead on-demand
router.post('/leads/:id/scan-signboard', async (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    let { photoUrl } = req.body;

    // If no custom photoUrl provided, attempt to fetch it automatically
    if (!photoUrl) {
      const photos = await SignboardService.fetchSignboardPhotos(lead.company_name, lead.address, lead.map_url);
      if (photos.length === 0) {
        return res.status(404).json({ success: false, error: 'No storefront or signboard photos found automatically. You can paste an image URL directly.' });
      }
      photoUrl = photos[0];
    }

    const downloaded = await SignboardService.downloadImageAsBase64(photoUrl);
    if (!downloaded || !downloaded.base64) {
      return res.status(400).json({ success: false, error: 'Failed to download image from the provided URL.' });
    }

    const extracted = await AIService.extractContactsFromImage(
      downloaded.base64,
      downloaded.mimeType,
      {
        company_name: lead.company_name,
        address: lead.address
      }
    );

    if (!extracted || (!extracted.found && (!extracted.phones || extracted.phones.length === 0))) {
      return res.json({
        success: false,
        message: 'No readable contact details or phone numbers detected in this photo.',
        photoUrl,
        extracted
      });
    }

    // Merge extracted phones and emails
    const existingPhones = JSON.parse(lead.phones || '[]');
    const existingEmails = JSON.parse(lead.emails || '[]');
    const newPhones = Array.from(new Set([...existingPhones, ...(extracted.phones || [])]));
    const newEmails = Array.from(new Set([...existingEmails, ...(extracted.emails || [])]));
    let newContactName = lead.contact_name;
    if (extracted.contact_name && (!newContactName || newContactName.endsWith('Office') || newContactName.endsWith('Desk'))) {
      newContactName = extracted.contact_name;
    }

    db.prepare(`
      UPDATE leads 
      SET phones = ?, emails = ?, contact_name = ?, signboard_photo_url = ?, signboard_extracted = ?
      WHERE id = ?
    `).run(
      JSON.stringify(newPhones),
      JSON.stringify(newEmails),
      newContactName,
      photoUrl,
      JSON.stringify(extracted),
      lead.id
    );

    const updatedLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
    res.json({
      success: true,
      message: `Extracted ${extracted.phones.length} phone numbers from signboard!`,
      photoUrl,
      extracted,
      lead: {
        ...updatedLead,
        emails: JSON.parse(updatedLead.emails || '[]'),
        phones: JSON.parse(updatedLead.phones || '[]'),
        social_links: JSON.parse(updatedLead.social_links || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test SMTP connection
router.post('/outreach/test-smtp', async (req, res) => {
  try {
    const { host, port, secure, user, pass } = req.body;
    const result = await OutreachService.testSMTPConnection({ host, port, secure, user, pass });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete all leads (optionally filtered by projectId)
router.delete('/leads', (req, res) => {
  try {
    const { projectId } = req.query;
    let info;
    if (projectId) {
      info = db.prepare('DELETE FROM leads WHERE project_id = ?').run(projectId);
    } else {
      info = db.prepare('DELETE FROM leads').run();
    }
    res.json({ success: true, deleted: info.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete single lead
router.delete('/leads/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export leads as CSV for a specific project
router.get('/projects/:id/export', (req, res) => {
  try {
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(req.params.id);
    const rawLeads = db.prepare('SELECT * FROM leads WHERE project_id = ? ORDER BY match_score DESC').all(req.params.id);

    const headers = ['Company / Professional Name', 'Web Presence Type', 'Website URL', 'Contact Person', 'Emails', 'Phones', 'Social Links', 'Match Score', 'Match Reason', 'Outreach Pitch Draft', 'Status'];
    const csvRows = [headers.join(',')];

    for (const lead of rawLeads) {
      const emails = JSON.parse(lead.emails || '[]').join('; ');
      const phones = JSON.parse(lead.phones || '[]').join('; ');
      const socials = JSON.parse(lead.social_links || '[]').join('; ');

      const row = [
        `"${(lead.company_name || '').replace(/"/g, '""')}"`,
        `"${lead.web_presence_type || 'no_website'}"`,
        `"${(lead.website_url || '').replace(/"/g, '""')}"`,
        `"${(lead.contact_name || '').replace(/"/g, '""')}"`,
        `"${emails.replace(/"/g, '""')}"`,
        `"${phones.replace(/"/g, '""')}"`,
        `"${socials.replace(/"/g, '""')}"`,
        lead.match_score,
        `"${(lead.match_reason || '').replace(/"/g, '""')}"`,
        `"${(lead.pitch_draft || '').replace(/"/g, '""')}"`,
        `"${lead.status || 'new'}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const safeProjectName = (project?.name || 'leads').toLowerCase().replace(/[^a-z0-9]/g, '_');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeProjectName}_leads.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export all projects as CSV
router.get('/projects-export', (req, res) => {
  try {
    const rawProjects = db.prepare(`
      SELECT p.*,
        COUNT(l.id) as total_leads,
        SUM(CASE WHEN l.web_presence_type = 'no_website' THEN 1 ELSE 0 END) as no_website_leads,
        SUM(CASE WHEN l.match_score >= 80 THEN 1 ELSE 0 END) as high_match_leads,
        SUM(CASE WHEN l.emails IS NOT NULL AND l.emails != '[]' AND l.emails != '' THEN 1 ELSE 0 END) as leads_with_emails
      FROM projects p
      LEFT JOIN leads l ON l.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

    const headers = [
      'Project ID',
      'Project Name',
      'URL',
      'Description',
      'Target Region',
      'Target Industry',
      'Discovery Source',
      'Target Criteria',
      'Target Keywords',
      'Total Leads',
      'No Website Leads',
      'High Match Leads (80%+)',
      'Verified Email Leads',
      'Created At'
    ];
    const csvRows = [headers.join(',')];

    for (const p of rawProjects) {
      const row = [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.url || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${(p.target_region || '').replace(/"/g, '""')}"`,
        `"${(p.target_industry || '').replace(/"/g, '""')}"`,
        `"${(p.discovery_source || 'combined').replace(/"/g, '""')}"`,
        `"${(p.target_criteria || '').replace(/"/g, '""')}"`,
        `"${(p.target_keywords || '').replace(/"/g, '""')}"`,
        p.total_leads || 0,
        p.no_website_leads || 0,
        p.high_match_leads || 0,
        p.leads_with_emails || 0,
        `"${(p.created_at || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="all_projects.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export all leads (or recent leads) as CSV
router.get('/leads-export', (req, res) => {
  try {
    const limitClause = req.query.limit ? `LIMIT ${parseInt(req.query.limit, 10)}` : '';
    const rawLeads = db.prepare(`
      SELECT l.*, p.name as project_name
      FROM leads l
      LEFT JOIN projects p ON p.id = l.project_id
      ORDER BY l.match_score DESC, l.created_at DESC
      ${limitClause}
    `).all();

    const headers = ['Project Name', 'Company / Professional Name', 'Web Presence Type', 'Website URL', 'Contact Person', 'Emails', 'Phones', 'Social Links', 'Match Score', 'Match Reason', 'Outreach Pitch Draft', 'Status', 'Discovered At'];
    const csvRows = [headers.join(',')];

    for (const lead of rawLeads) {
      const emails = JSON.parse(lead.emails || '[]').join('; ');
      const phones = JSON.parse(lead.phones || '[]').join('; ');
      const socials = JSON.parse(lead.social_links || '[]').join('; ');

      const row = [
        `"${(lead.project_name || '').replace(/"/g, '""')}"`,
        `"${(lead.company_name || '').replace(/"/g, '""')}"`,
        `"${lead.web_presence_type || 'no_website'}"`,
        `"${(lead.website_url || '').replace(/"/g, '""')}"`,
        `"${(lead.contact_name || '').replace(/"/g, '""')}"`,
        `"${emails.replace(/"/g, '""')}"`,
        `"${phones.replace(/"/g, '""')}"`,
        `"${socials.replace(/"/g, '""')}"`,
        lead.match_score,
        `"${(lead.match_reason || '').replace(/"/g, '""')}"`,
        `"${(lead.pitch_draft || '').replace(/"/g, '""')}"`,
        `"${lead.status || 'new'}"`,
        `"${lead.created_at || ''}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ------------------- USAGE & SETTINGS ------------------- */

// Get current AI usage and budget stats
router.get('/usage', (req, res) => {
  try {
    const summary = UsageGuard.getUsageSummary();
    res.json({ success: true, usage: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset usage logs
router.post('/usage/reset', (req, res) => {
  try {
    UsageGuard.resetUsageLogs();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    // Check both database and process.env
    const envGemini = (process.env.GEMINI_API_KEY || '').trim();
    const envOpenAI = (process.env.OPENAI_API_KEY || '').trim();
    const envPlaces = (process.env.GOOGLE_PLACES_API_KEY || '').trim();

    const effectiveGemini = (settings.gemini_api_key || envGemini).trim();
    const effectiveOpenAI = (settings.openai_api_key || envOpenAI).trim();
    const effectivePlaces = (settings.google_places_api_key || envPlaces).trim();

    settings.gemini_source = settings.gemini_api_key ? 'saved' : (envGemini ? 'env' : 'none');
    settings.openai_source = settings.openai_api_key ? 'saved' : (envOpenAI ? 'env' : 'none');
    settings.places_source = settings.google_places_api_key ? 'saved' : (envPlaces ? 'env' : 'none');

    settings.gemini_api_key = effectiveGemini;
    settings.openai_api_key = effectiveOpenAI;
    settings.google_places_api_key = effectivePlaces;

    settings.has_gemini_key = Boolean(effectiveGemini);
    settings.has_openai_key = Boolean(effectiveOpenAI);
    settings.has_places_key = Boolean(effectivePlaces);

    // Mask sensitive keys for client
    if (effectiveGemini) {
      settings.gemini_api_key_masked = effectiveGemini.slice(0, 6) + '...' + effectiveGemini.slice(-4);
    }
    if (effectiveOpenAI) {
      settings.openai_api_key_masked = effectiveOpenAI.slice(0, 6) + '...' + effectiveOpenAI.slice(-4);
    }
    if (effectivePlaces) {
      settings.google_places_api_key_masked = effectivePlaces.slice(0, 6) + '...' + effectivePlaces.slice(-4);
    }
    if (settings.smtp_pass) {
      settings.smtp_pass_masked = '••••••••';
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update settings
router.post('/settings', (req, res) => {
  try {
    const allowedKeys = [
      'ai_provider', 'gemini_api_key', 'openai_api_key', 'google_places_api_key', 'enable_signboard_vision',
      'budget_cap_usd', 'enable_cost_guard', 'fallback_to_free', 'max_leads_per_scan',
      'email_mode', 'email_sender_name', 'email_sender_address', 'email_default_subject',
      'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass',
      'whatsapp_mode', 'whatsapp_country_code'
    ];

    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        UsageGuard.setSetting(key, req.body[key]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

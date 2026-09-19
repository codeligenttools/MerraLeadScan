const express = require('express');
const router = express.Router();
const db = require('../db/database');
const ScannerService = require('../services/scannerService');
const AIService = require('../services/aiService');
const UsageGuard = require('../services/usageGuard');

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
    const { name, url, description, target_industry, target_region, target_criteria } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, error: 'Project name and description are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO projects (name, url, description, target_industry, target_region, target_criteria)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name, 
      url || '', 
      description, 
      target_industry || '', 
      target_region || '', 
      target_criteria || 'Businesses with NO website, operating via phone/social/directories'
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
    const { name, url, description, target_industry, target_region, target_criteria } = req.body;
    db.prepare(`
      UPDATE projects 
      SET name = ?, url = ?, description = ?, target_industry = ?, target_region = ?, target_criteria = ?
      WHERE id = ?
    `).run(name, url || '', description, target_industry || '', target_region || '', target_criteria || '', req.params.id);

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
    const { status, minScore, hasEmail, search, presence } = req.query;
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

    query += ' ORDER BY match_score DESC, created_at DESC';

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

// Update lead status
router.patch('/leads/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
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

// Export leads as CSV
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
    // Mask sensitive keys for client
    if (settings.gemini_api_key) {
      settings.gemini_api_key_masked = settings.gemini_api_key.slice(0, 4) + '...' + settings.gemini_api_key.slice(-4);
    }
    if (settings.openai_api_key) {
      settings.openai_api_key_masked = settings.openai_api_key.slice(0, 4) + '...' + settings.openai_api_key.slice(-4);
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
      'ai_provider', 'gemini_api_key', 'openai_api_key',
      'budget_cap_usd', 'enable_cost_guard', 'fallback_to_free', 'max_leads_per_scan'
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

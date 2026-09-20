const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'leadscan.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and speed
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT,
    description TEXT NOT NULL,
    target_industry TEXT,
    target_region TEXT,
    target_criteria TEXT DEFAULT 'Businesses with NO website, operating via phone/social/directories (clinics, advocates, doctors, consultants)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    website_url TEXT,
    web_presence_type TEXT DEFAULT 'no_website',
    contact_name TEXT,
    emails TEXT DEFAULT '[]',
    phones TEXT DEFAULT '[]',
    social_links TEXT DEFAULT '[]',
    match_score INTEGER DEFAULT 0,
    match_reason TEXT,
    pitch_draft TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    operation TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    estimated_cost REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe column addition if table already existed
try {
  db.exec("ALTER TABLE leads ADD COLUMN web_presence_type TEXT DEFAULT 'no_website'");
} catch (e) {}

try {
  db.exec("ALTER TABLE projects ADD COLUMN target_criteria TEXT DEFAULT 'Businesses with NO website, operating via phone/social/directories (clinics, advocates, doctors, consultants)'");
} catch (e) {}

try {
  db.exec("ALTER TABLE projects ADD COLUMN target_keywords TEXT DEFAULT ''");
} catch (e) {}

try {
  db.exec("ALTER TABLE projects ADD COLUMN discovery_source TEXT DEFAULT 'combined'");
} catch (e) {}

try {
  db.exec("ALTER TABLE leads ADD COLUMN address TEXT DEFAULT ''");
} catch (e) {}

try {
  db.exec("ALTER TABLE leads ADD COLUMN map_url TEXT DEFAULT ''");
} catch (e) {}

try {
  db.exec("ALTER TABLE leads ADD COLUMN signboard_photo_url TEXT DEFAULT ''");
} catch (e) {}

try {
  db.exec("ALTER TABLE leads ADD COLUMN signboard_extracted TEXT DEFAULT ''");
} catch (e) {}

// Default settings helper
function initDefaultSettings() {
  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  const setSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  const defaults = {
    ai_provider: 'gemini', // 'gemini' | 'openai' | 'free_heuristics'
    gemini_api_key: '',
    openai_api_key: '',
    google_places_api_key: '',
    enable_signboard_vision: 'true', // Auto extract contacts from Google Maps / web storefront signboard photos
    budget_cap_usd: '2.00', // Hard cap limit in USD (e.g. $2.00)
    enable_cost_guard: 'true',
    fallback_to_free: 'true', // Seamlessly fallback to free local heuristics if budget cap is hit
    max_leads_per_scan: '10',
    // Outreach Settings
    email_mode: 'mailto', // 'mailto' | 'smtp'
    email_sender_name: 'Entepage Team',
    email_sender_address: '',
    email_default_subject: 'Custom Website & WhatsApp Lead Routing for {{company}}',
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_pass: '',
    whatsapp_mode: 'app', // 'app' (wa.me) | 'web' (web.whatsapp.com)
    whatsapp_country_code: '91'
  };

  for (const [key, value] of Object.entries(defaults)) {
    const existing = getSetting.get(key);
    if (!existing) {
      setSetting.run(key, value);
    }
  }
}

initDefaultSettings();

module.exports = db;

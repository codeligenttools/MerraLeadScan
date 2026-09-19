const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./src/db/database');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// API Routes
app.use('/api', apiRoutes);

// Seed first project (EntePage) if empty
function seedInitialProject() {
  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  if (count === 0) {
    console.log('[Server] Seeding first project: Entepage (https://entepage.com/)...');
    const stmt = db.prepare(`
      INSERT INTO projects (name, url, description, target_industry, target_region, target_criteria)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      'Entepage',
      'https://entepage.com/',
      'All-inclusive modern business websites and verified directory microsites for ₹2,499/year. Includes custom branded site, high-speed SSL hosting, direct WhatsApp lead routing, Google SEO, and routine content updates without developer maintenance fees.',
      'Small Businesses, Local Clinics, Restaurants, Boutiques, Professional Consultants, Home Services',
      'India & Global',
      'Target businesses with NO website or only social media (Instagram/FB) profiles. Prioritize local clinics, doctors, advocates/lawyers, CAs, and consultants who receive inquiries via WhatsApp/phone.'
    );
    console.log('[Server] Successfully seeded Entepage as the first project!');
  } else {
    // Ensure target_criteria is set for Entepage
    db.prepare(`
      UPDATE projects 
      SET target_criteria = 'Target businesses with NO website or only social media (Instagram/FB) profiles. Prioritize local clinics, doctors, advocates/lawyers, CAs, and consultants who receive inquiries via WhatsApp/phone.'
      WHERE target_criteria IS NULL OR target_criteria = ''
    `).run();
  }
}

seedInitialProject();

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 LeadScan AI is running at http://localhost:${PORT}`);
  console.log(`💡 Cost Guard & Budget Limiter Active`);
  console.log(`====================================================`);
});

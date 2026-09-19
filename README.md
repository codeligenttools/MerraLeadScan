# MerraLeadScan

**MerraLeadScan** is an intelligent, low-cost lead generation and internet prospecting platform. It discovers high-converting business leads across the web, extracts verified contact information (phones, WhatsApp, emails, social handles), scores ICP (Ideal Customer Profile) fit, and drafts personalized outreach pitches—all with strict zero-cost AI limits.

---

## ✨ Features

- 🎯 **Targeted Lead Prospecting**: Scan search engines, public directories, and social platforms for specific buyer personas (e.g. clinics, advocates, doctors, and businesses lacking an official website).
- 🔍 **Automated Contact Extraction**: Scrapes public pages to extract phone numbers, WhatsApp routing, email addresses, and social profiles without manual effort.
- ⚡ **Dual AI & Free Heuristic Engine**:
  - **Free Heuristic Engine ($0.00 Cost)**: 100% operational out of the box without any API keys. Evaluates web presence and drafts pitches at zero cost.
  - **LLM Integration (Optional)**: Connect Google Gemini or OpenAI for dynamic, personalized cold outreach drafts.
- 🛡️ **AI Cost Guard & Budget Limiter**: Set a hard spending cap (e.g., $2.00). When reached, the system seamlessly falls back to free heuristics—never overcharging or halting.
- 📊 **Team Central Dashboard**: Real-time sales pipeline tracking (`New`, `Saved`, `Contacted`), KPI monitoring tiles, and live AI strategic recommendations for outreach teams.
- 📁 **Multi-Project Management**: Configure custom search criteria, target industries, and geographic regions per project.
- 📥 **1-Click CSV Export & WhatsApp Outreach**: Direct WhatsApp messaging links and one-click lead export for CRM integration.

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/codeligenttools/MerraLeadScan.git
cd MerraLeadScan
npm install
```

### 2. Configuration (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` (optional):
```env
PORT=3000
GEMINI_API_KEY=your_gemini_key_here  # Optional
OPENAI_API_KEY=your_openai_key_here  # Optional
```
> **Note**: MerraLeadScan works fully **without** any API keys using its built-in Free Heuristic Engine!

### 3. Run the Application

```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite via `better-sqlite3`
- **Web Scraping**: Cheerio, Axios
- **AI Intelligence**: Google Gemini API, OpenAI API, and custom Rule-based Heuristic Engine
- **Frontend**: Vanilla JavaScript, Modern CSS with Glassmorphism, SVG Icons

---

## 📄 License

MIT License.

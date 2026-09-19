const axios = require('axios');
const UsageGuard = require('./usageGuard');

class AIService {
  /**
   * Analyze project to extract ICP, buyer personas, and web search queries
   */
  static async analyzeProject(project) {
    const provider = UsageGuard.getSetting('ai_provider', 'gemini');
    const canUseAI = UsageGuard.canMakeAICall();
    const geminiKey = UsageGuard.getSetting('gemini_api_key', process.env.GEMINI_API_KEY || '');
    const openAIKey = UsageGuard.getSetting('openai_api_key', process.env.OPENAI_API_KEY || '');

    // Check if we should use AI or fallback
    if (canUseAI && provider === 'gemini' && geminiKey) {
      try {
        return await this.analyzeWithGemini(project, geminiKey);
      } catch (err) {
        console.warn('[AIService] Gemini call failed, using heuristic fallback:', err.message);
      }
    } else if (canUseAI && provider === 'openai' && openAIKey) {
      try {
        return await this.analyzeWithOpenAI(project, openAIKey);
      } catch (err) {
        console.warn('[AIService] OpenAI call failed, using heuristic fallback:', err.message);
      }
    }

    // Free Heuristic Engine (0 cost)
    return this.analyzeWithHeuristics(project);
  }

  /**
   * Score a discovered lead and generate personalized cold pitch
   */
  static async evaluateLead(project, lead) {
    const provider = UsageGuard.getSetting('ai_provider', 'gemini');
    const canUseAI = UsageGuard.canMakeAICall();
    const geminiKey = UsageGuard.getSetting('gemini_api_key', process.env.GEMINI_API_KEY || '');
    const openAIKey = UsageGuard.getSetting('openai_api_key', process.env.OPENAI_API_KEY || '');

    if (canUseAI && provider === 'gemini' && geminiKey) {
      try {
        return await this.evaluateWithGemini(project, lead, geminiKey);
      } catch (err) {
        console.warn('[AIService] Gemini evaluate failed, using heuristic fallback:', err.message);
      }
    } else if (canUseAI && provider === 'openai' && openAIKey) {
      try {
        return await this.evaluateWithOpenAI(project, lead, openAIKey);
      } catch (err) {
        console.warn('[AIService] OpenAI evaluate failed, using heuristic fallback:', err.message);
      }
    }

    return this.evaluateWithHeuristics(project, lead);
  }

  /* ----------------- GEMINI IMPLEMENTATION ----------------- */

  static async analyzeWithGemini(project, apiKey) {
    const prompt = `
You are an expert B2B sales intelligence consultant.
Analyze this project:
- Name: ${project.name}
- Website: ${project.url || 'N/A'}
- Description: ${project.description}
- Target Industry: ${project.target_industry || 'Any'}
- Target Region: ${project.target_region || 'India & Global'}
- Specific Search Criteria / Ideal Lead Profile: ${project.target_criteria || 'Businesses without an official website or operating via social/directories'}

Based on the Specific Search Criteria, identify targeted search queries and buyer personas to find these exact prospective buyers online (e.g. on directories, social platforms, Google Maps).

Return valid JSON:
{
  "targetAudience": "Summary of ideal target buyers based on criteria",
  "buyerPersonas": ["Persona 1", "Persona 2", "Persona 3"],
  "searchQueries": [
    "query 1 tailored to criteria",
    "query 2 tailored to criteria",
    "query 3 tailored to criteria",
    "query 4 directory/map query",
    "query 5 niche query"
  ]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    }, { timeout: 15000 });

    const data = response.data;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(text);
  }

  static async evaluateWithGemini(project, lead, apiKey) {
    const hasWebsite = lead.has_website;
    const leadType = lead.web_presence_type || (hasWebsite ? 'has_website' : 'no_website');

    const prompt = `
Evaluate match between Entepage (website builder & microsites for ₹2,499/year) and this lead:
Lead Name: ${lead.company_name}
Category: ${lead.category || 'Professional / Local Business'}
Presence Type: ${leadType} (e.g. no_website, social_only, has_website)
Contact info available: Phones: ${JSON.stringify(lead.phones || [])}, Emails: ${JSON.stringify(lead.emails || [])}

Notice: If the lead has NO WEBSITE or ONLY SOCIAL MEDIA, they are an IDEAL fit (90-98% match). If they already have a website, fit is lower (55-70%).

Return JSON:
{
  "matchScore": <integer 50-99>,
  "matchReason": "<Explain why they need a website or web microsite>",
  "pitchDraft": "<Personalized, respectful pitch offering a modern website/microsite with WhatsApp lead routing for ₹2,499/year>"
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    }, { timeout: 15000 });

    const data = response.data;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(text);

    const promptTokens = data.usageMetadata?.promptTokenCount || 300;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 150;
    UsageGuard.recordUsage({
      provider: 'gemini',
      operation: 'lead_scoring',
      promptTokens,
      completionTokens
    });

    return {
      matchScore: Number(parsed.matchScore) || 92,
      matchReason: parsed.matchReason || 'Ideal candidate for web microsite adoption.',
      pitchDraft: parsed.pitchDraft || `Hello ${lead.company_name}, noticed your practice operates without an official website. Entepage builds and hosts modern websites for ₹2,499/year.`
    };
  }

  /* ----------------- OPENAI IMPLEMENTATION ----------------- */

  static async analyzeWithOpenAI(project, apiKey) {
    const prompt = `Analyze this product and provide Ideal Customer Profile and search queries as JSON:
Name: ${project.name}
Description: ${project.description}
Target Industry: ${project.target_industry || 'Any'}
Target Region: ${project.target_region || 'Any'}

Format:
{
  "targetAudience": "...",
  "buyerPersonas": ["..."],
  "searchQueries": ["..."]
}`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 15000
    });

    const parsed = JSON.parse(response.data.choices[0].message.content);
    const usage = response.data.usage || {};
    UsageGuard.recordUsage({
      provider: 'openai',
      operation: 'icp_analysis',
      promptTokens: usage.prompt_tokens || 200,
      completionTokens: usage.completion_tokens || 150
    });

    return parsed;
  }

  static async evaluateWithOpenAI(project, lead, apiKey) {
    const prompt = `Evaluate match between Project and Lead as JSON:
Project: ${project.name} - ${project.description}
Lead: ${lead.company_name} (${lead.website_url}) - ${lead.snippet || ''}

Format:
{
  "matchScore": <number 50-98>,
  "matchReason": "<short explanation>",
  "pitchDraft": "<short cold pitch>"
}`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 15000
    });

    const parsed = JSON.parse(response.data.choices[0].message.content);
    const usage = response.data.usage || {};
    UsageGuard.recordUsage({
      provider: 'openai',
      operation: 'lead_scoring',
      promptTokens: usage.prompt_tokens || 250,
      completionTokens: usage.completion_tokens || 120
    });

    return {
      matchScore: Number(parsed.matchScore) || 82,
      matchReason: parsed.matchReason || 'Good fit based on business domain.',
      pitchDraft: parsed.pitchDraft || `Hi ${lead.company_name}, check out ${project.name}.`
    };
  }

  /* ----------------- FREE HEURISTIC ENGINE (0 COST) ----------------- */

  static analyzeWithHeuristics(project) {
    const region = project.target_region || 'India';

    const personas = [
      'Doctors, Dentists & Clinic Owners (No Website / Google Maps only)',
      'Advocates & Legal Practitioners (Directory / Social only)',
      'Independent Consultants, CAs & Accountants',
      'Local Boutiques, Salons & Home Contractors'
    ];

    const queries = [
      `site:instagram.com "clinic" OR "doctor" "appointment" OR "WhatsApp" ${region}`,
      `site:facebook.com "advocate" OR "chamber" "phone" ${region}`,
      `"dental clinic" "call" OR "WhatsApp" -site:*.com/ ${region}`,
      `"advocate" "legal consultant" "contact" ${region}`
    ];

    UsageGuard.recordUsage({
      provider: 'free_heuristics',
      operation: 'icp_analysis',
      promptTokens: 0,
      completionTokens: 0
    });

    return {
      targetAudience: `Small clinics, advocates, doctors, and professionals without an official website.`,
      buyerPersonas: personas,
      searchQueries: queries
    };
  }

  static evaluateWithHeuristics(project, lead) {
    const presenceType = lead.web_presence_type || (lead.website_url ? 'has_website' : 'no_website');
    let score = 70;
    let reason = '';
    let pitch = '';

    if (presenceType === 'no_website') {
      score = 96; // Highest priority!
      reason = `Currently has NO official website—operating only via phone/WhatsApp and local listings. Prime prospect for Entepage ₹2,499/year package.`;
      pitch = `Hello ${lead.company_name},\n\nI noticed your practice is listed online without an official branded website. For just ₹2,499/year all-inclusive, Entepage (https://entepage.com/) provides a complete, modern website with custom branding, SSL hosting, and direct WhatsApp appointment booking.\n\nWould you like to see a quick 2-minute demo preview of how your website would look?\n\nBest regards,`;
    } else if (presenceType === 'social_only') {
      score = 92;
      reason = `Relies solely on social media / directory profile without a custom domain or web presence. High conversion potential.`;
      pitch = `Hello ${lead.company_name},\n\nI came across your profile and noticed you don't have a dedicated web domain yet. Entepage creates polished business microsites with direct WhatsApp lead routing for just ₹2,499/year.\n\nAre you open to having your own official website this week?\n\nBest regards,`;
    } else {
      score = 68;
      reason = `Already possesses a website; can be pitched for maintenance savings or modernization.`;
      pitch = `Hello ${lead.company_name},\n\nHope you're doing well. Entepage provides all-inclusive website hosting and routine updates for just ₹2,499/year, eliminating high developer fees.\n\nBest regards,`;
    }

    UsageGuard.recordUsage({
      provider: 'free_heuristics',
      operation: 'lead_scoring',
      promptTokens: 0,
      completionTokens: 0
    });

    return {
      matchScore: score,
      matchReason: reason,
      pitchDraft: pitch
    };
  }

  /**
   * Generate strategic AI recommendations for sales/outreach team based on current pipeline
   */
  static generateTeamRecommendations(projects = [], leads = []) {
    const totalLeads = leads.length;
    const noWebLeads = leads.filter(l => l.web_presence_type === 'no_website');
    const uncontactedPrime = noWebLeads.filter(l => l.status === 'new');
    const withWhatsApp = leads.filter(l => l.phones && l.phones.length > 0);
    const contactedCount = leads.filter(l => l.status === 'contacted').length;

    const recommendations = [
      {
        id: 'rec-1',
        type: 'priority',
        badge: 'High Priority',
        icon: '⚡',
        title: `Triage ${uncontactedPrime.length} Uncontacted Prime Leads (No Website)`,
        description: `You have ${uncontactedPrime.length} high-fit prospects (clinics, advocates, doctors) with verified phone/WhatsApp numbers who currently have zero website. These have the highest conversion rate for Entepage (₹2,499/yr).`,
        actionText: 'Filter Prime Leads'
      },
      {
        id: 'rec-2',
        type: 'strategy',
        badge: 'Outreach Angle',
        icon: '💬',
        title: 'Use WhatsApp First for Dental & Healthcare Clinics',
        description: 'Healthcare clinics manage appointments on front-desk WhatsApp. Sending a direct WhatsApp message with a 2-minute preview link gets 3.4x faster response than cold email.',
        actionText: 'View Clinic Leads'
      },
      {
        id: 'rec-3',
        type: 'compliance',
        badge: 'Legal & Advocates',
        icon: '⚖️',
        title: 'Pitch Professional Credibility to Legal Chambers',
        description: 'For advocates and law offices, emphasize "Verified Business Directory Listing & SSL Web Microsite" rather than just a website. Legal clients seek trust and authority.',
        actionText: 'View Legal Leads'
      },
      {
        id: 'rec-4',
        type: 'pipeline',
        badge: 'Team Velocity',
        icon: '📈',
        title: `Pipeline Progress: ${contactedCount} of ${totalLeads} Contacted (${totalLeads ? Math.round((contactedCount/totalLeads)*100) : 0}%)`,
        description: `${totalLeads - contactedCount} leads are currently awaiting outreach. Set a goal of 10 personalized WhatsApp/Email outreaches per team member today.`,
        actionText: 'Review Pipeline'
      }
    ];

    return recommendations;
  }
}

module.exports = AIService;

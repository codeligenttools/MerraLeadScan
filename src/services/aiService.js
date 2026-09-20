const axios = require('axios');
const UsageGuard = require('./usageGuard');

class AIService {
  /**
   * Analyze project to extract ICP, buyer personas, and web search queries
   */
  static async analyzeProject(project) {
    let provider = UsageGuard.getSetting('ai_provider', 'gemini');
    const canUseAI = UsageGuard.canMakeAICall();
    const geminiKey = UsageGuard.getSetting('gemini_api_key', (process.env.GEMINI_API_KEY || '')).trim();
    const openAIKey = UsageGuard.getSetting('openai_api_key', (process.env.OPENAI_API_KEY || '')).trim();

    // Auto-select provider if default has no key but another provider does
    if (provider === 'gemini' && !geminiKey && openAIKey) {
      provider = 'openai';
    } else if (provider === 'openai' && !openAIKey && geminiKey) {
      provider = 'gemini';
    }

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
    let provider = UsageGuard.getSetting('ai_provider', 'gemini');
    const canUseAI = UsageGuard.canMakeAICall();
    const geminiKey = UsageGuard.getSetting('gemini_api_key', (process.env.GEMINI_API_KEY || '')).trim();
    const openAIKey = UsageGuard.getSetting('openai_api_key', (process.env.OPENAI_API_KEY || '')).trim();

    // Auto-select provider if default has no key but another provider does
    if (provider === 'gemini' && !geminiKey && openAIKey) {
      provider = 'openai';
    } else if (provider === 'openai' && !openAIKey && geminiKey) {
      provider = 'gemini';
    }

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

  /* ----------------- VISION OCR IMPLEMENTATION ----------------- */

  /**
   * Extract contact information (phones, WhatsApp, contact person, email) from signboard/storefront image using Vision AI
   */
  static async extractContactsFromImage(imageBase64, mimeType = 'image/jpeg', businessContext = {}) {
    let provider = UsageGuard.getSetting('ai_provider', 'gemini');
    const canUseAI = UsageGuard.canMakeAICall();
    const geminiKey = UsageGuard.getSetting('gemini_api_key', (process.env.GEMINI_API_KEY || '')).trim();
    const openAIKey = UsageGuard.getSetting('openai_api_key', (process.env.OPENAI_API_KEY || '')).trim();

    if (provider === 'gemini' && !geminiKey && openAIKey) {
      provider = 'openai';
    } else if (provider === 'openai' && !openAIKey && geminiKey) {
      provider = 'gemini';
    }

    if (!canUseAI) {
      console.warn('[AIService] Cannot make Vision AI call (budget cap reached or cost guard active)');
      return { found: false, phones: [], emails: [], contact_name: '', board_text: '' };
    }

    if (provider === 'gemini' && geminiKey) {
      try {
        return await this.extractFromImageWithGemini(imageBase64, mimeType, businessContext, geminiKey);
      } catch (err) {
        console.warn('[AIService] Gemini Vision call failed:', err.message);
      }
    } else if (provider === 'openai' && openAIKey) {
      try {
        return await this.extractFromImageWithOpenAI(imageBase64, mimeType, businessContext, openAIKey);
      } catch (err) {
        console.warn('[AIService] OpenAI Vision call failed:', err.message);
      }
    }

    return { found: false, phones: [], emails: [], contact_name: '', board_text: '' };
  }

  static async extractFromImageWithGemini(imageBase64, mimeType, businessContext, apiKey) {
    const prompt = `
You are an expert OCR and data extraction system analyzing a storefront, signboard, flex board, or nameboard for this business:
Business Name: ${businessContext.company_name || 'Local Business'}
Location / Address: ${businessContext.address || 'India / Global'}

Your task is to carefully examine the image and read all text on any business signboards, storefront nameplates, banners, or window lettering.
Extract the following information:
1. "phones": An array of all phone numbers, mobile numbers, WhatsApp numbers, and landline numbers visible on the board.
   - For 10-digit Indian numbers, prefix with +91 if appropriate.
   - Clean up spacing and separators (e.g. "+91 98470 12345").
2. "contact_name": The primary contact person, doctor, advocate, owner, or proprietor name visible on the signboard (e.g. "Dr. Thomas George, BDS", "Adv. K. Ramesh", "P.K. Sharma").
3. "emails": Any email addresses visible on the board.
4. "board_text": A concise transcription or summary of the most prominent text on the signboard (e.g. "SURABHI DENTAL CLINIC - Dr. Thomas George BDS - Ph: 9847012345").
5. "found": boolean, true if any phone, email, or contact name was identified on the board, false otherwise.

Return ONLY valid JSON matching this exact structure:
{
  "found": true,
  "phones": ["+91 98470 12345"],
  "contact_name": "Dr. Thomas George, BDS",
  "emails": [],
  "board_text": "SURABHI DENTAL CLINIC - Dr. Thomas George BDS - Ph: 9847012345"
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    }, { timeout: 25000 });

    const data = response.data;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.warn('[AIService] Failed to parse Gemini Vision JSON:', e.message);
    }

    const promptTokens = data.usageMetadata?.promptTokenCount || 450;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 100;
    UsageGuard.recordUsage({
      provider: 'gemini',
      operation: 'signboard_vision_ocr',
      promptTokens,
      completionTokens
    });

    const phones = Array.isArray(parsed.phones) ? parsed.phones.filter(p => typeof p === 'string' && p.length >= 7) : [];
    const emails = Array.isArray(parsed.emails) ? parsed.emails.filter(e => typeof e === 'string' && e.includes('@')) : [];

    return {
      found: Boolean(parsed.found || phones.length > 0 || parsed.contact_name),
      phones,
      contact_name: parsed.contact_name || '',
      emails,
      board_text: parsed.board_text || ''
    };
  }

  static async extractFromImageWithOpenAI(imageBase64, mimeType, businessContext, apiKey) {
    const prompt = `You are an expert OCR system. Extract contact details from this business signboard or storefront image for:
Business: ${businessContext.company_name || 'Business'} in ${businessContext.address || ''}.
Carefully examine the image to read text on any business signboards, storefront nameplates, or banners.
Extract:
- "phones": array of real phone/mobile/WhatsApp numbers visible on the board (or empty array [] if none)
- "contact_name": doctor, advocate, or proprietor name clearly visible on the board (e.g. "Dr. Thomas George", or empty string "" if none)
- "emails": array of emails found (or empty array [] if none)
- "board_text": snippet of key text read on the board (or empty string "" if none)
- "found": boolean, true ONLY if a real phone number or genuine person name was read from the board, false otherwise

Return JSON:
{
  "found": false,
  "phones": [],
  "contact_name": "",
  "emails": [],
  "board_text": ""
}`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 25000
    });

    const parsed = JSON.parse(response.data.choices[0].message.content || '{}');
    const usage = response.data.usage || {};
    UsageGuard.recordUsage({
      provider: 'openai',
      operation: 'signboard_vision_ocr',
      promptTokens: usage.prompt_tokens || 500,
      completionTokens: usage.completion_tokens || 100
    });

    const phones = Array.isArray(parsed.phones) ? parsed.phones.filter(p => typeof p === 'string' && p.length >= 7) : [];
    const emails = Array.isArray(parsed.emails) ? parsed.emails.filter(e => typeof e === 'string' && e.includes('@')) : [];
    
    let cleanContactName = (parsed.contact_name || '').trim();
    if (cleanContactName.toLowerCase().includes('dr. / adv') || cleanContactName.toLowerCase() === 'doctor' || cleanContactName.toLowerCase() === 'name') {
      cleanContactName = '';
    }

    return {
      found: Boolean((parsed.found && (phones.length > 0 || cleanContactName)) || phones.length > 0),
      phones,
      contact_name: cleanContactName,
      emails,
      board_text: parsed.board_text || ''
    };
  }

  /* ----------------- FREE HEURISTIC ENGINE (0 COST) ----------------- */

  /**
   * Extract distinct target niches, personas, or keywords dynamically from project configuration
   */
  static extractTargetTerms(project) {
    const terms = new Set();

    // 1. Explicit target_keywords from project form
    if (project.target_keywords && project.target_keywords.trim()) {
      project.target_keywords.split(/[,;\n]+/).forEach(k => {
        const clean = k.trim();
        if (clean.length >= 2) terms.add(clean);
      });
    }

    // 2. From target_industry
    if (project.target_industry && project.target_industry.trim()) {
      project.target_industry.split(/[,;\n]+/).forEach(k => {
        const clean = k.trim();
        if (clean.length >= 2) terms.add(clean);
      });
    }

    // 3. Extract keywords from target_criteria (e.g. clinics, doctors, advocates, contractors)
    if (project.target_criteria && project.target_criteria.trim()) {
      const phrases = project.target_criteria.split(/[,;\n\.\(\)\/]+/);
      for (const phrase of phrases) {
        let clean = phrase
          .replace(/\b(target|prioritize|businesses|with|no|website|without|only|social|media|who|receive|inquiries|via|or|and|profiles|directories|looking|for|small|local|practicing)\b/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (clean.length >= 3 && clean.length <= 35 && !['phone', 'whatsapp', 'email', 'directories'].includes(clean.toLowerCase())) {
          terms.add(clean);
        }
      }
    }

    // Fallback if none extracted
    if (terms.size === 0) {
      if (project.target_industry) terms.add(project.target_industry);
      terms.add(project.name);
    }

    return Array.from(terms);
  }

  static analyzeWithHeuristics(project) {
    const region = project.target_region ? `"${project.target_region}"` : '';
    const terms = this.extractTargetTerms(project);
    const criteria = (project.target_criteria || '').toLowerCase();
    const isNoWebsiteFocus = criteria.includes('no website') || criteria.includes('without website') || criteria.includes('social');

    const queries = [];
    const personas = [];

    for (const term of terms) {
      personas.push(`${term} in ${project.target_region || 'Target Market'} (Target Lead)`);

      if (isNoWebsiteFocus) {
        queries.push(`site:instagram.com "${term}" "WhatsApp" OR "phone" ${region}`.trim());
        queries.push(`site:facebook.com "${term}" "call" OR "WhatsApp" ${region}`.trim());
        queries.push(`"${term}" "call" OR "WhatsApp" "contact" ${region}`.trim());
        queries.push(`"${term}" "phone" OR "mobile" "WhatsApp" ${region}`.trim());
        queries.push(`site:justdial.com "${term}" "phone" ${region}`.trim());
      } else {
        queries.push(`"${term}" "contact us" "phone" OR "email" ${region}`.trim());
        queries.push(`"${term}" "email" OR "phone" "contact" ${region}`.trim());
        queries.push(`"${term}" "WhatsApp" OR "call" "get in touch" ${region}`.trim());
        queries.push(`site:linkedin.com/company "${term}" ${region}`.trim());
      }
    }

    const uniqueQueries = Array.from(new Set(queries)).slice(0, 8);
    const uniquePersonas = Array.from(new Set(personas)).slice(0, 6);

    UsageGuard.recordUsage({
      provider: 'free_heuristics',
      operation: 'icp_analysis',
      promptTokens: 0,
      completionTokens: 0
    });

    return {
      targetAudience: `Target prospects for ${project.name}: ${terms.join(', ')} in ${project.target_region || 'Global'}`,
      buyerPersonas: uniquePersonas,
      searchQueries: uniqueQueries
    };
  }

  static evaluateWithHeuristics(project, lead) {
    const presenceType = lead.web_presence_type || (lead.website_url ? 'has_website' : 'no_website');
    let score = 75;
    let reason = '';
    let pitch = '';

    const projectName = project.name || 'Our Company';
    const projectUrl = project.url ? ` (${project.url})` : '';
    const projectDescSnippet = project.description ? project.description.split('.')[0] + '.' : 'our specialized services.';

    if (presenceType === 'no_website') {
      score = 96;
      reason = `Currently has NO official website—operating only via phone/WhatsApp and local listings. Prime prospect for ${projectName}.`;
      pitch = `Hello ${lead.company_name},\n\nI noticed your business is listed online without an official branded website. ${projectName}${projectUrl} provides ${projectDescSnippet}\n\nWould you like to see a quick 2-minute preview of how this can help your business attract more clients?\n\nBest regards,\n${projectName} Team`;
    } else if (presenceType === 'social_only') {
      score = 92;
      reason = `Relies solely on social media / directory profile without a custom domain. High conversion fit for ${projectName}.`;
      pitch = `Hello ${lead.company_name},\n\nI came across your profile and noticed you don't have a dedicated web domain yet. ${projectName}${projectUrl} specializes in ${projectDescSnippet}\n\nAre you open to having your own official website this week?\n\nBest regards,\n${projectName} Team`;
    } else {
      score = 70;
      reason = `Already possesses a website; can be pitched for upgrades, optimization, or complementary services from ${projectName}.`;
      pitch = `Hello ${lead.company_name},\n\nI came across your website and wanted to reach out. ${projectName}${projectUrl} helps businesses by providing ${projectDescSnippet}\n\nAre you open to exploring how we can add value to your current setup?\n\nBest regards,\n${projectName} Team`;
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
    const primaryProj = projects[0] || { name: 'Your Business', target_industry: 'Target Clients' };
    const primaryTerms = AIService.extractTargetTerms(primaryProj);
    const nicheSummary = primaryTerms.length > 0 ? primaryTerms.slice(0, 3).join(', ') : (primaryProj.target_industry || 'prospects');

    const recommendations = [
      {
        id: 'rec-1',
        type: 'priority',
        badge: 'High Priority',
        icon: '⚡',
        title: `Triage ${uncontactedPrime.length} Uncontacted Prime Leads (No Website)`,
        description: `You have ${uncontactedPrime.length} high-fit prospects (${nicheSummary}) with verified phone/WhatsApp numbers who currently have zero website. These have the highest conversion rate for ${primaryProj.name}.`,
        actionText: 'Filter Prime Leads'
      },
      {
        id: 'rec-2',
        type: 'strategy',
        badge: 'Outreach Angle',
        icon: '💬',
        title: `Direct WhatsApp Outreach for ${nicheSummary}`,
        description: `Prospects in ${primaryProj.target_region || 'your target market'} manage inquiries actively on WhatsApp. Sending a direct personalized message with a quick value proposition gets 3.4x faster response than cold email.`,
        actionText: 'Start Outreach'
      },
      {
        id: 'rec-3',
        type: 'compliance',
        badge: 'Value Proposition',
        icon: '🎯',
        title: `Emphasize Credibility & Growth for ${primaryProj.name}`,
        description: `For ${nicheSummary}, emphasize verified presence and instant customer acquisition. Highlight how ${primaryProj.name} solves their specific pain points.`,
        actionText: 'Review Pitches'
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

const db = require('../db/database');

class UsageGuard {
  // Pricing per 1M tokens in USD
  static PRICING = {
    gemini: {
      input: 0.075 / 1000000,
      output: 0.30 / 1000000
    },
    openai: {
      input: 0.15 / 1000000,
      output: 0.60 / 1000000
    },
    free_heuristics: {
      input: 0,
      output: 0
    }
  };

  static getSetting(key, defaultValue = '') {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  }

  static setSetting(key, value) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
  }

  static getUsageSummary() {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_calls,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(SUM(estimated_cost), 0.0) as total_cost
      FROM usage_logs
    `).get();

    const budgetCap = parseFloat(this.getSetting('budget_cap_usd', '2.00')) || 2.00;
    const enableCostGuard = this.getSetting('enable_cost_guard', 'true') === 'true';
    const fallbackToFree = this.getSetting('fallback_to_free', 'true') === 'true';
    const currentSpend = Number(stats.total_cost || 0);

    const isCapReached = enableCostGuard && currentSpend >= budgetCap;
    const remainingBudget = Math.max(0, budgetCap - currentSpend);

    return {
      totalCalls: stats.total_calls,
      totalTokens: stats.total_prompt_tokens + stats.total_completion_tokens,
      totalPromptTokens: stats.total_prompt_tokens,
      totalCompletionTokens: stats.total_completion_tokens,
      totalSpendUSD: Number(currentSpend.toFixed(4)),
      budgetCapUSD: budgetCap,
      remainingBudgetUSD: Number(remainingBudget.toFixed(4)),
      isCapReached,
      enableCostGuard,
      fallbackToFree,
      provider: this.getSetting('ai_provider', 'gemini'),
      hasGeminiKey: Boolean(this.getSetting('gemini_api_key') || (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim())),
      hasOpenAIKey: Boolean(this.getSetting('openai_api_key') || (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()))
    };
  }

  static canMakeAICall() {
    const summary = this.getUsageSummary();
    if (!summary.enableCostGuard) return true;
    return summary.totalSpendUSD < summary.budgetCapUSD;
  }

  static calculateCost(provider, promptTokens = 0, completionTokens = 0) {
    const rates = this.PRICING[provider] || this.PRICING.free_heuristics;
    return (promptTokens * rates.input) + (completionTokens * rates.output);
  }

  static recordUsage({ provider, operation, promptTokens = 0, completionTokens = 0 }) {
    const estimatedCost = this.calculateCost(provider, promptTokens, completionTokens);
    db.prepare(`
      INSERT INTO usage_logs (provider, operation, prompt_tokens, completion_tokens, estimated_cost)
      VALUES (?, ?, ?, ?, ?)
    `).run(provider, operation, promptTokens, completionTokens, estimatedCost);

    return {
      promptTokens,
      completionTokens,
      estimatedCost
    };
  }

  static resetUsageLogs() {
    db.prepare('DELETE FROM usage_logs').run();
  }
}

module.exports = UsageGuard;

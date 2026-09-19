// LeadScan AI - Frontend Application Logic

let state = {
  currentView: 'dashboard', // 'dashboard' | 'projects' | 'leads'
  projects: [],
  activeProjectId: null,
  leads: [],
  usage: null,
  settings: null,
  dashboardSummary: null,
  isScanning: false
};

// DOM Elements
const navProjectCount = document.getElementById('navProjectCount');
const tabBtnDashboard = document.getElementById('tabBtnDashboard');
const tabBtnProjects = document.getElementById('tabBtnProjects');
const tabBtnLeads = document.getElementById('tabBtnLeads');

const viewDashboard = document.getElementById('viewDashboard');
const viewProjects = document.getElementById('viewProjects');
const viewLeads = document.getElementById('viewLeads');

// Dashboard Elements
const dashTotalProjects = document.getElementById('dashTotalProjects');
const dashTotalLeads = document.getElementById('dashTotalLeads');
const dashNoWebsiteLeads = document.getElementById('dashNoWebsiteLeads');
const dashHighMatchLeads = document.getElementById('dashHighMatchLeads');
const pipeNewCount = document.getElementById('pipeNewCount');
const pipeSavedCount = document.getElementById('pipeSavedCount');
const pipeContactedCount = document.getElementById('pipeContactedCount');
const segNew = document.getElementById('segNew');
const segSaved = document.getElementById('segSaved');
const segContacted = document.getElementById('segContacted');
const aiRecommendationsGrid = document.getElementById('aiRecommendationsGrid');
const allProjectsGrid = document.getElementById('allProjectsGrid');

// Leads View Elements
const projectSelect = document.getElementById('projectSelect');
const maxLeadsInput = document.getElementById('maxLeadsInput');
const btnStartScan = document.getElementById('btnStartScan');
const projectMetaBox = document.getElementById('projectMetaBox');
const projTitle = document.getElementById('projTitle');
const projUrlLink = document.getElementById('projUrlLink');
const projDesc = document.getElementById('projDesc');
const projTags = document.getElementById('projTags');

const scanTracker = document.getElementById('scanTracker');
const scanProgressFill = document.getElementById('scanProgressFill');
const scanStatusTitle = document.getElementById('scanStatusTitle');
const scanStatusSubtitle = document.getElementById('scanStatusSubtitle');
const scanTimeBadge = document.getElementById('scanTimeBadge');

const metricTotalLeads = document.getElementById('metricTotalLeads');
const metricNoWebsite = document.getElementById('metricNoWebsite');
const metricHighMatch = document.getElementById('metricHighMatch');
const metricWithEmails = document.getElementById('metricWithEmails');
const budgetDisplay = document.getElementById('budgetDisplay');
const budgetBadge = document.getElementById('budgetBadge');

const leadsContainer = document.getElementById('leadsContainer');
const emptyState = document.getElementById('emptyState');
const leadSearchInput = document.getElementById('leadSearchInput');
const presenceFilter = document.getElementById('presenceFilter');
const statusFilter = document.getElementById('statusFilter');
const scoreFilter = document.getElementById('scoreFilter');
const hasEmailFilter = document.getElementById('hasEmailFilter');
const btnExportCSV = document.getElementById('btnExportCSV');

// Modals
const modalNewProject = document.getElementById('modalNewProject');
const modalProjectHeading = document.getElementById('modalProjectHeading');
const editProjectId = document.getElementById('editProjectId');
const btnNewProject = document.getElementById('btnNewProject');
const btnCloseNewProj = document.getElementById('btnCloseNewProj');
const btnCancelNewProj = document.getElementById('btnCancelNewProj');
const formNewProject = document.getElementById('formNewProject');
const inputProjName = document.getElementById('inputProjName');
const inputProjUrl = document.getElementById('inputProjUrl');
const inputProjDesc = document.getElementById('inputProjDesc');
const inputProjCriteria = document.getElementById('inputProjCriteria');
const inputProjIndustry = document.getElementById('inputProjIndustry');
const inputProjRegion = document.getElementById('inputProjRegion');

const modalSettings = document.getElementById('modalSettings');
const btnOpenSettings = document.getElementById('btnOpenSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnCancelSettings = document.getElementById('btnCancelSettings');
const formSettings = document.getElementById('formSettings');
const selectProvider = document.getElementById('selectProvider');
const groupGeminiKey = document.getElementById('groupGeminiKey');
const groupOpenAIKey = document.getElementById('groupOpenAIKey');
const inputGeminiKey = document.getElementById('inputGeminiKey');
const inputOpenAIKey = document.getElementById('inputOpenAIKey');
const inputBudgetCap = document.getElementById('inputBudgetCap');
const inputMaxLeadsSetting = document.getElementById('inputMaxLeadsSetting');
const checkEnableCostGuard = document.getElementById('checkEnableCostGuard');
const checkFallbackFree = document.getElementById('checkFallbackFree');
const btnResetUsage = document.getElementById('btnResetUsage');

const modalPitch = document.getElementById('modalPitch');
const btnClosePitch = document.getElementById('btnClosePitch');
const btnCopyPitch = document.getElementById('btnCopyPitch');
const pitchTextarea = document.getElementById('pitchTextarea');
const pitchLeadName = document.getElementById('pitchLeadName');
const toast = document.getElementById('toast');

/* ----------------- INITIALIZATION & NAVIGATION ----------------- */

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadUsage();
  await loadSettings();
  await loadProjects();
  await loadDashboard();
});

function switchView(viewName) {
  state.currentView = viewName;
  tabBtnDashboard.classList.toggle('active', viewName === 'dashboard');
  tabBtnProjects.classList.toggle('active', viewName === 'projects');
  tabBtnLeads.classList.toggle('active', viewName === 'leads');

  viewDashboard.classList.toggle('hidden', viewName !== 'dashboard');
  viewProjects.classList.toggle('hidden', viewName !== 'projects');
  viewLeads.classList.toggle('hidden', viewName !== 'leads');

  if (viewName === 'dashboard') {
    loadDashboard();
  } else if (viewName === 'projects') {
    renderProjectsList();
  } else if (viewName === 'leads') {
    if (state.activeProjectId) onProjectChanged();
  }
}

function setupEventListeners() {
  projectSelect.addEventListener('change', (e) => {
    state.activeProjectId = Number(e.target.value);
    onProjectChanged();
  });

  btnStartScan.addEventListener('click', startScan);

  // Filters
  leadSearchInput.addEventListener('input', debounce(loadLeads, 300));
  presenceFilter.addEventListener('change', loadLeads);
  statusFilter.addEventListener('change', loadLeads);
  scoreFilter.addEventListener('change', loadLeads);
  hasEmailFilter.addEventListener('change', loadLeads);

  // Export
  btnExportCSV.addEventListener('click', () => {
    if (!state.activeProjectId) return;
    window.location.href = `/api/projects/${state.activeProjectId}/export`;
  });

  // Modal: New Project
  btnNewProject.addEventListener('click', () => openCreateProjectModal());
  btnCloseNewProj.addEventListener('click', () => modalNewProject.classList.add('hidden'));
  btnCancelNewProj.addEventListener('click', () => modalNewProject.classList.add('hidden'));
  formNewProject.addEventListener('submit', handleSaveProjectSubmit);

  // Modal: Settings
  btnOpenSettings.addEventListener('click', openSettingsModal);
  budgetBadge.addEventListener('click', openSettingsModal);
  btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));
  btnCancelSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));
  formSettings.addEventListener('submit', handleSaveSettings);
  btnResetUsage.addEventListener('click', handleResetUsage);

  selectProvider.addEventListener('change', (e) => {
    groupGeminiKey.classList.toggle('hidden', e.target.value !== 'gemini');
    groupOpenAIKey.classList.toggle('hidden', e.target.value !== 'openai');
  });

  // Modal: Pitch
  btnClosePitch.addEventListener('click', () => modalPitch.classList.add('hidden'));
  btnCopyPitch.addEventListener('click', () => {
    navigator.clipboard.writeText(pitchTextarea.value);
    showToast('Pitch copied to clipboard!');
  });
}

/* ----------------- DASHBOARD LOGIC ----------------- */

async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard/summary');
    const data = await res.json();
    if (data.success) {
      state.dashboardSummary = data.summary;
      const s = data.summary;

      dashTotalProjects.textContent = s.totalProjects;
      dashTotalLeads.textContent = s.totalLeads;
      dashNoWebsiteLeads.textContent = s.noWebsiteLeads;
      dashHighMatchLeads.textContent = s.highMatchLeads;

      // Pipeline
      pipeNewCount.textContent = s.pipeline.new;
      pipeSavedCount.textContent = s.pipeline.saved;
      pipeContactedCount.textContent = s.pipeline.contacted;

      const totalPipe = s.pipeline.new + s.pipeline.saved + s.pipeline.contacted || 1;
      segNew.style.width = `${Math.round((s.pipeline.new / totalPipe) * 100)}%`;
      segSaved.style.width = `${Math.round((s.pipeline.saved / totalPipe) * 100)}%`;
      segContacted.style.width = `${Math.round((s.pipeline.contacted / totalPipe) * 100)}%`;

      // AI Recommendations
      renderRecommendations(s.aiRecommendations || []);
    }
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderRecommendations(recs) {
  aiRecommendationsGrid.innerHTML = recs.map(r => {
    let badgeClass = 'badge-priority';
    if (r.type === 'strategy') badgeClass = 'badge-strategy';
    if (r.type === 'compliance') badgeClass = 'badge-compliance';
    if (r.type === 'pipeline') badgeClass = 'badge-pipeline';

    return `
      <div class="recommendation-card">
        <div>
          <div class="rec-top-row">
            <span class="rec-badge ${badgeClass}">${escapeHtml(r.badge)}</span>
            <span style="font-size:1.2rem;">${r.icon}</span>
          </div>
          <h4 class="rec-title">${escapeHtml(r.title)}</h4>
          <p class="rec-desc">${escapeHtml(r.description)}</p>
        </div>
        <button class="rec-action-btn" onclick="handleRecAction('${r.type}')">${escapeHtml(r.actionText)} &rarr;</button>
      </div>
    `;
  }).join('');
}

function handleRecAction(type) {
  switchView('leads');
  if (type === 'priority') {
    presenceFilter.value = 'no_website';
    loadLeads();
  } else if (type === 'strategy') {
    leadSearchInput.value = 'clinic';
    loadLeads();
  } else if (type === 'compliance') {
    leadSearchInput.value = 'advocate';
    loadLeads();
  }
}

/* ----------------- PROJECTS LIST LOGIC ----------------- */

function renderProjectsList() {
  navProjectCount.textContent = state.projects.length;

  allProjectsGrid.innerHTML = state.projects.map(p => `
    <div class="project-card">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 class="project-card-title">${escapeHtml(p.name)}</h3>
            ${p.url ? `<a href="${escapeHtml(p.url)}" target="_blank" class="lead-domain-link">${escapeHtml(p.url)} &rarr;</a>` : ''}
          </div>
          <span class="tag-pill" style="font-size:0.7rem;">${escapeHtml(p.target_region || 'Global')}</span>
        </div>

        <p class="proj-desc" style="margin-top:10px; font-size:0.85rem;">${escapeHtml(p.description)}</p>

        <div class="project-card-criteria">
          <strong style="color:var(--accent-cyan); display:block; margin-bottom:2px;">🎯 Target Lead Criteria:</strong>
          ${escapeHtml(p.target_criteria || 'No specific criteria set.')}
        </div>

        <div class="project-card-stats">
          <div class="p-stat-box">
            <div class="p-stat-val" style="color:#fff;">${p.total_leads || 0}</div>
            <div class="p-stat-lbl">Total Leads</div>
          </div>
          <div class="p-stat-box">
            <div class="p-stat-val" style="color:var(--accent-rose);">${p.no_website_leads || 0}</div>
            <div class="p-stat-lbl">No Website ⭐</div>
          </div>
          <div class="p-stat-box">
            <div class="p-stat-val" style="color:var(--accent-emerald);">${p.high_match_leads || 0}</div>
            <div class="p-stat-lbl">High Match</div>
          </div>
        </div>
      </div>

      <div class="project-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEditProject(${p.id})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Edit Criteria
        </button>

        <button class="btn btn-primary btn-sm" onclick="selectProjectAndOpenLeads(${p.id})">
          Open Leads &rarr;
        </button>
      </div>
    </div>
  `).join('');
}

function selectProjectAndOpenLeads(projectId) {
  state.activeProjectId = projectId;
  projectSelect.value = projectId;
  switchView('leads');
}

function openCreateProjectModal() {
  editProjectId.value = '';
  modalProjectHeading.textContent = 'Add New Project';
  formNewProject.reset();
  applyPresetCriteria('no_website');
  modalNewProject.classList.remove('hidden');
}

function openEditProject(projectId) {
  const p = state.projects.find(proj => proj.id === projectId);
  if (!p) return;

  editProjectId.value = p.id;
  modalProjectHeading.textContent = `Edit Project: ${p.name}`;
  inputProjName.value = p.name;
  inputProjUrl.value = p.url || '';
  inputProjDesc.value = p.description;
  inputProjCriteria.value = p.target_criteria || '';
  inputProjIndustry.value = p.target_industry || '';
  inputProjRegion.value = p.target_region || '';

  modalNewProject.classList.remove('hidden');
}

function applyPresetCriteria(type) {
  if (type === 'no_website') {
    inputProjCriteria.value = 'Target businesses with NO website or only social media (Instagram/FB) profiles. Prioritize local clinics, doctors, advocates/lawyers, CAs, and consultants who receive inquiries via WhatsApp/phone.';
  } else if (type === 'social_only') {
    inputProjCriteria.value = 'Find businesses operating solely through Instagram business pages or Facebook pages with contact numbers in bio and no custom domain.';
  } else if (type === 'b2b') {
    inputProjCriteria.value = 'Target small B2B service firms with outdated or non-responsive websites that require modernization and WhatsApp lead capture.';
  }
}

async function handleSaveProjectSubmit(e) {
  e.preventDefault();
  const id = editProjectId.value;
  const payload = {
    name: inputProjName.value.trim(),
    url: inputProjUrl.value.trim(),
    description: inputProjDesc.value.trim(),
    target_criteria: inputProjCriteria.value.trim(),
    target_industry: inputProjIndustry.value.trim(),
    target_region: inputProjRegion.value.trim()
  };

  try {
    const url = id ? `/api/projects/${id}` : '/api/projects';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      modalNewProject.classList.add('hidden');
      formNewProject.reset();
      await loadProjects();
      await loadDashboard();
      if (id) {
        showToast('Project updated successfully!');
      } else {
        state.activeProjectId = data.project.id;
        showToast(`Created project "${data.project.name}"!`);
      }
      if (state.currentView === 'projects') renderProjectsList();
    }
  } catch (err) {
    showToast('Failed to save project.');
  }
}

/* ----------------- API CALLS & DATA ----------------- */

async function loadProjects() {
  try {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (data.success && data.projects.length > 0) {
      state.projects = data.projects;
      projectSelect.innerHTML = state.projects.map(p => 
        `<option value="${p.id}">${escapeHtml(p.name)} (${p.total_leads || 0} leads)</option>`
      ).join('');

      if (!state.activeProjectId) {
        state.activeProjectId = state.projects[0].id;
      }
      projectSelect.value = state.activeProjectId;
      onProjectChanged();
    } else {
      projTitle.textContent = 'No Projects Found';
      projDesc.textContent = 'Click "+ New Project" above to create your first project and begin scanning for leads.';
    }
  } catch (err) {
    console.error('Error loading projects:', err);
  }
}

async function onProjectChanged() {
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj) return;

  projTitle.textContent = proj.name;
  if (proj.url) {
    projUrlLink.href = proj.url;
    projUrlLink.textContent = proj.url;
    projUrlLink.classList.remove('hidden');
  } else {
    projUrlLink.classList.add('hidden');
  }

  projDesc.textContent = proj.description;

  const tags = [];
  if (proj.target_industry) tags.push(proj.target_industry);
  if (proj.target_region) tags.push(proj.target_region);
  projTags.innerHTML = tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('');

  await loadLeads();
}

async function loadLeads() {
  if (!state.activeProjectId) return;

  const search = leadSearchInput.value.trim();
  const presence = presenceFilter.value;
  const status = statusFilter.value;
  const minScore = scoreFilter.value;
  const hasEmail = hasEmailFilter.checked;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (presence !== 'all') params.append('presence', presence);
  if (status !== 'all') params.append('status', status);
  if (minScore !== '0') params.append('minScore', minScore);
  if (hasEmail) params.append('hasEmail', 'true');

  try {
    const res = await fetch(`/api/projects/${state.activeProjectId}/leads?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      state.leads = data.leads;
      renderLeads();
      updateMetrics();
    }
  } catch (err) {
    console.error('Error loading leads:', err);
  }
}

function updateMetrics() {
  const total = state.leads.length;
  const noWeb = state.leads.filter(l => l.web_presence_type === 'no_website').length;
  const highMatch = state.leads.filter(l => l.match_score >= 80).length;
  const withEmails = state.leads.filter(l => l.emails && l.emails.length > 0).length;

  metricTotalLeads.textContent = total;
  if (metricNoWebsite) metricNoWebsite.textContent = noWeb;
  metricHighMatch.textContent = highMatch;
  metricWithEmails.textContent = withEmails;
}

function renderLeads() {
  if (state.leads.length === 0) {
    leadsContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  leadsContainer.innerHTML = state.leads.map(lead => {
    const scoreClass = lead.match_score >= 85 ? 'match-high' : 'match-medium';
    
    // Web presence badge
    let presenceBadge = '';
    if (lead.web_presence_type === 'no_website') {
      presenceBadge = `<span class="badge-presence badge-no-web">🔥 No Website (Prime Target)</span>`;
    } else if (lead.web_presence_type === 'social_only') {
      presenceBadge = `<span class="badge-presence badge-social">📱 Social Profile Only (IG/FB)</span>`;
    } else {
      presenceBadge = `<span class="badge-presence badge-has-web">🌐 Has Website</span>`;
    }

    // Website link or text
    const websiteHtml = lead.website_url
      ? `<a href="${escapeHtml(lead.website_url)}" target="_blank" class="lead-domain-link">${escapeHtml(lead.website_url)} &rarr;</a>`
      : `<span style="font-size:0.8rem; color: var(--accent-rose); font-weight:600;">🚫 No Website Listed (Direct WhatsApp/Phone Only)</span>`;

    // Contact person name
    const contactPersonHtml = lead.contact_name
      ? `<div style="font-size:0.85rem; color:#e2e8f0; font-weight:600; margin-top:2px;">👤 ${escapeHtml(lead.contact_name)}</div>`
      : '';

    // Emails list
    const emailsHtml = (lead.emails && lead.emails.length > 0)
      ? lead.emails.map(email => `
          <div class="contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <a href="mailto:${escapeHtml(email)}" class="email-chip">${escapeHtml(email)}</a>
            <button class="copy-mini-btn" onclick="copyText('${escapeHtml(email)}', 'Email copied!')" title="Copy Email">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
        `).join('')
      : `<div class="contact-item"><span style="color: var(--text-dim);">No public email detected</span></div>`;

    // Phones list
    const phonesHtml = (lead.phones && lead.phones.length > 0)
      ? lead.phones.map(phone => `
          <div class="contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <a href="tel:${escapeHtml(phone)}" style="color: #cbd5e1; text-decoration: none;">${escapeHtml(phone)}</a>
            <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" target="_blank" class="whatsapp-mini-btn" title="Open WhatsApp Chat">
              💬 WhatsApp
            </a>
          </div>
        `).join('')
      : '';

    // Social Links
    const socialsHtml = (lead.social_links && lead.social_links.length > 0)
      ? `<div class="social-pills-row">${lead.social_links.map(link => {
          let label = 'Profile';
          if (link.includes('instagram.com')) label = 'Instagram';
          else if (link.includes('facebook.com')) label = 'Facebook';
          else if (link.includes('linkedin.com')) label = 'LinkedIn';
          return `<a href="${escapeHtml(link)}" target="_blank" class="social-pill">${label} &rarr;</a>`;
        }).join('')}</div>`
      : '';

    return `
      <div class="lead-card" id="leadCard-${lead.id}">
        <div>
          <div class="lead-top-row">
            <div>
              <div style="margin-bottom: 6px;">${presenceBadge}</div>
              <h3 class="lead-company-name">${escapeHtml(lead.company_name)}</h3>
              ${contactPersonHtml}
              <div style="margin-top: 4px;">${websiteHtml}</div>
            </div>
            <div class="match-badge ${scoreClass}">
              <span>${lead.match_score}%</span>
              <span class="match-label">Match</span>
            </div>
          </div>

          <div class="lead-reason-box" style="margin-top: 14px;">
            ${escapeHtml(lead.match_reason || 'Identified as prospective match.')}
          </div>

          <div class="lead-contacts-box" style="margin-top: 14px;">
            ${emailsHtml}
            ${phonesHtml}
            ${socialsHtml}
          </div>
        </div>

        <div class="lead-footer">
          <select class="lead-status-select" onchange="updateLeadStatus(${lead.id}, this.value)">
            <option value="new" ${lead.status === 'new' ? 'selected' : ''}>Status: New</option>
            <option value="saved" ${lead.status === 'saved' ? 'selected' : ''}>Status: Saved</option>
            <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Status: Contacted</option>
          </select>

          <div class="lead-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="viewPitch(${lead.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              View Pitch
            </button>
            <button class="btn btn-secondary btn-sm" onclick="deleteLead(${lead.id})" title="Delete Lead" style="color: var(--accent-rose); padding: 6px 9px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ----------------- SCANNING EXECUTION ----------------- */

async function startScan() {
  if (state.isScanning || !state.activeProjectId) return;
  state.isScanning = true;
  btnStartScan.disabled = true;
  btnStartScan.innerHTML = `<span class="scanner-anim" style="width:16px;height:16px;border-width:2px;"></span> Scanning...`;

  scanTracker.classList.remove('hidden');
  scanProgressFill.style.width = '10%';
  scanStatusTitle.textContent = 'Analyzing Ideal Customer Profile...';
  scanStatusSubtitle.textContent = 'AI generating tailored search queries and target personas';

  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');

  step1.className = 'step-item active';
  step2.className = 'step-item';
  step3.className = 'step-item';
  step4.className = 'step-item';

  // Progress simulation steps for visual feedback
  const timer1 = setTimeout(() => {
    scanProgressFill.style.width = '35%';
    step1.className = 'step-item completed';
    step2.className = 'step-item active';
    scanStatusTitle.textContent = 'Searching Web & Directories...';
    scanStatusSubtitle.textContent = 'Querying search engines for matching businesses';
  }, 1200);

  const timer2 = setTimeout(() => {
    scanProgressFill.style.width = '65%';
    step2.className = 'step-item completed';
    step3.className = 'step-item active';
    scanStatusTitle.textContent = 'Extracting Public Contact Details...';
    scanStatusSubtitle.textContent = 'Parsing websites, /contact pages, emails, and phone numbers';
  }, 2800);

  const timer3 = setTimeout(() => {
    scanProgressFill.style.width = '85%';
    step3.className = 'step-item completed';
    step4.className = 'step-item active';
    scanStatusTitle.textContent = 'Scoring Leads & Drafting Pitches...';
    scanStatusSubtitle.textContent = 'Calculating fit percentages and writing personalized outreach messages';
  }, 4400);

  try {
    const maxLeads = maxLeadsInput.value;
    const res = await fetch(`/api/projects/${state.activeProjectId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxLeads })
    });

    const data = await res.json();
    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout(timer3);

    scanProgressFill.style.width = '100%';
    step4.className = 'step-item completed';
    scanStatusTitle.textContent = 'Scan Complete!';
    scanStatusSubtitle.textContent = `Successfully saved ${data.results?.leadsSaved || 0} leads.`;

    await loadLeads();
    await loadUsage();

    showToast(`Scan complete! Found ${data.results?.leadsSaved || 0} new leads.`);
    setTimeout(() => {
      scanTracker.classList.add('hidden');
    }, 3000);
  } catch (err) {
    console.error('Scan error:', err);
    showToast('Scan encountered an error. Check console.');
  } finally {
    state.isScanning = false;
    btnStartScan.disabled = false;
    btnStartScan.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      Scan Internet for Leads
    `;
  }
}

/* ----------------- USAGE & BUDGET ----------------- */

async function loadUsage() {
  try {
    const res = await fetch('/api/usage');
    const data = await res.json();
    if (data.success) {
      state.usage = data.usage;
      const spent = state.usage.totalSpendUSD;
      const cap = state.usage.budgetCapUSD;
      if (budgetDisplay) {
        budgetDisplay.textContent = `$${spent.toFixed(2)} / $${cap.toFixed(2)}`;
      }

      // Update modal stats if modal elements exist
      const statCalls = document.getElementById('statCalls');
      const statTokens = document.getElementById('statTokens');
      const statSpend = document.getElementById('statSpend');
      const statRemaining = document.getElementById('statRemaining');
      if (statCalls) statCalls.textContent = state.usage.totalCalls;
      if (statTokens) statTokens.textContent = state.usage.totalTokens.toLocaleString();
      if (statSpend) statSpend.textContent = `$${spent.toFixed(4)}`;
      if (statRemaining) statRemaining.textContent = `$${state.usage.remainingBudgetUSD.toFixed(4)}`;
    }
  } catch (err) {
    console.error('Error loading usage:', err);
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success) {
      state.settings = data.settings;
      selectProvider.value = state.settings.ai_provider || 'gemini';
      inputBudgetCap.value = state.settings.budget_cap_usd || '2.00';
      inputMaxLeadsSetting.value = state.settings.max_leads_per_scan || '10';
      checkEnableCostGuard.checked = state.settings.enable_cost_guard === 'true';
      checkFallbackFree.checked = state.settings.fallback_to_free === 'true';

      groupGeminiKey.classList.toggle('hidden', selectProvider.value !== 'gemini');
      groupOpenAIKey.classList.toggle('hidden', selectProvider.value !== 'openai');
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

function openSettingsModal() {
  loadUsage();
  loadSettings();
  modalSettings.classList.remove('hidden');
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const payload = {
    ai_provider: selectProvider.value,
    budget_cap_usd: inputBudgetCap.value,
    max_leads_per_scan: inputMaxLeadsSetting.value,
    enable_cost_guard: String(checkEnableCostGuard.checked),
    fallback_to_free: String(checkFallbackFree.checked)
  };

  if (inputGeminiKey.value.trim()) {
    payload.gemini_api_key = inputGeminiKey.value.trim();
  }
  if (inputOpenAIKey.value.trim()) {
    payload.openai_api_key = inputOpenAIKey.value.trim();
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      modalSettings.classList.add('hidden');
      await loadUsage();
      showToast('Settings & Cost Guard saved!');
    }
  } catch (err) {
    showToast('Failed to save settings.');
  }
}

async function handleResetUsage() {
  if (!confirm('Are you sure you want to reset AI usage logs and spend count?')) return;
  try {
    await fetch('/api/usage/reset', { method: 'POST' });
    await loadUsage();
    showToast('Usage statistics reset.');
  } catch (e) {}
}

async function updateLeadStatus(leadId, status) {
  try {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showToast(`Lead marked as ${status}`);
    await loadDashboard();
  } catch (e) {}
}

async function deleteLead(leadId) {
  if (!confirm('Delete this lead?')) return;
  try {
    await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    state.leads = state.leads.filter(l => l.id !== leadId);
    renderLeads();
    updateMetrics();
    await loadDashboard();
    showToast('Lead deleted.');
  } catch (e) {}
}

function viewPitch(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  pitchLeadName.textContent = `Tailored for ${lead.company_name} (${lead.website_url || 'No Website'})`;
  pitchTextarea.value = lead.pitch_draft || 'No pitch draft generated.';
  modalPitch.classList.remove('hidden');
}

/* ----------------- HELPERS & EXPORTS ----------------- */

function copyText(text, msg) {
  navigator.clipboard.writeText(text);
  showToast(msg || 'Copied!');
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Window global bindings for inline HTML
window.copyText = copyText;
window.updateLeadStatus = updateLeadStatus;
window.deleteLead = deleteLead;
window.viewPitch = viewPitch;
window.switchView = switchView;
window.applyPresetCriteria = applyPresetCriteria;
window.openCreateProjectModal = openCreateProjectModal;
window.openEditProject = openEditProject;
window.selectProjectAndOpenLeads = selectProjectAndOpenLeads;
window.handleRecAction = handleRecAction;

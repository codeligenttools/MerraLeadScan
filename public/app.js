// MerraLeadScan - Frontend Application Logic

let state = {
  currentView: 'dashboard', // 'dashboard' | 'projects' | 'leads'
  projects: [],
  activeProjectId: null,
  leads: [],
  usage: null,
  settings: null,
  dashboardSummary: null,
  isScanning: false,
  leadsViewMode: localStorage.getItem('leadscan_view_mode') || 'cards', // 'cards' | 'list'
  currentPage: 1,
  pageSize: Number(localStorage.getItem('leadscan_page_size')) || 10,
  leadSortBy: 'created_at',
  leadSortDir: 'desc',
  projectsViewMode: localStorage.getItem('leadscan_proj_view_mode') || 'cards', // 'cards' | 'list'
  projectsCurrentPage: 1,
  projectsPageSize: Number(localStorage.getItem('leadscan_proj_page_size')) || 6
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
const dashRecentLeadsContainer = document.getElementById('dashRecentLeadsContainer');
const allProjectsGrid = document.getElementById('allProjectsGrid');
const projectSearchInput = document.getElementById('projectSearchInput');

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
const sortFilter = document.getElementById('sortFilter');
const hasEmailFilter = document.getElementById('hasEmailFilter');
const btnExportCSV = document.getElementById('btnExportCSV');
const btnExportProjectsCSV = document.getElementById('btnExportProjectsCSV');
const btnExportRecentLeadsCSV = document.getElementById('btnExportRecentLeadsCSV');
const btnDeleteProjectLeads = document.getElementById('btnDeleteProjectLeads');
const btnViewCards = document.getElementById('btnViewCards');
const btnViewList = document.getElementById('btnViewList');
const leadsPaginationBar = document.getElementById('leadsPaginationBar');
const paginationRangeText = document.getElementById('paginationRangeText');
const paginationTotalText = document.getElementById('paginationTotalText');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const paginationNav = document.getElementById('paginationNav');

// Projects View Toggle & Pagination
const btnProjViewCards = document.getElementById('btnProjViewCards');
const btnProjViewList = document.getElementById('btnProjViewList');
const projectsPaginationBar = document.getElementById('projectsPaginationBar');
const projPaginationRangeText = document.getElementById('projPaginationRangeText');
const projPaginationTotalText = document.getElementById('projPaginationTotalText');
const projPageSizeSelect = document.getElementById('projPageSizeSelect');
const projPaginationNav = document.getElementById('projPaginationNav');

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
const inputProjKeywords = document.getElementById('inputProjKeywords');
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
const btnToggleGeminiKey = document.getElementById('btnToggleGeminiKey');
const btnToggleOpenAIKey = document.getElementById('btnToggleOpenAIKey');
const statusGeminiKey = document.getElementById('statusGeminiKey');
const statusOpenAIKey = document.getElementById('statusOpenAIKey');
const inputBudgetCap = document.getElementById('inputBudgetCap');
const inputMaxLeadsSetting = document.getElementById('inputMaxLeadsSetting');
const checkEnableCostGuard = document.getElementById('checkEnableCostGuard');
const checkFallbackFree = document.getElementById('checkFallbackFree');
const btnResetUsage = document.getElementById('btnResetUsage');

// Signboard Settings & Modal
const checkEnableSignboardVision = document.getElementById('checkEnableSignboardVision');
const inputPlacesKey = document.getElementById('inputPlacesKey');
const btnTogglePlacesKey = document.getElementById('btnTogglePlacesKey');
const statusPlacesKey = document.getElementById('statusPlacesKey');

const modalScanSignboard = document.getElementById('modalScanSignboard');
const btnCloseScanSignboard = document.getElementById('btnCloseScanSignboard');
const btnCancelScanSignboard = document.getElementById('btnCancelScanSignboard');
const formScanSignboard = document.getElementById('formScanSignboard');
const scanLeadId = document.getElementById('scanLeadId');
const modalScanLeadName = document.getElementById('modalScanLeadName');
const inputCustomPhotoUrl = document.getElementById('inputCustomPhotoUrl');
const scanPreviewContainer = document.getElementById('scanPreviewContainer');
const scanPreviewImg = document.getElementById('scanPreviewImg');
const scanResultInfo = document.getElementById('scanResultInfo');
const btnStartScanSignboard = document.getElementById('btnStartScanSignboard');

const modalPitch = document.getElementById('modalPitch');
const btnClosePitch = document.getElementById('btnClosePitch');
const btnCopyPitch = document.getElementById('btnCopyPitch');
const pitchTextarea = document.getElementById('pitchTextarea');
const pitchLeadName = document.getElementById('pitchLeadName');
const pitchRecipientPhone = document.getElementById('pitchRecipientPhone');
const pitchRecipientEmail = document.getElementById('pitchRecipientEmail');
const pitchEmailSubject = document.getElementById('pitchEmailSubject');
const btnSavePitch = document.getElementById('btnSavePitch');
const btnSendWhatsApp = document.getElementById('btnSendWhatsApp');
const btnSendEmail = document.getElementById('btnSendEmail');
let currentPitchLeadId = null;

// Settings Outreach Elements
const btnSettingsTabAI = document.getElementById('btnSettingsTabAI');
const btnSettingsTabOutreach = document.getElementById('btnSettingsTabOutreach');
const settingsSectionAI = document.getElementById('settingsSectionAI');
const settingsSectionOutreach = document.getElementById('settingsSectionOutreach');
const inputEmailMode = document.getElementById('inputEmailMode');
const inputSenderName = document.getElementById('inputSenderName');
const inputSenderAddress = document.getElementById('inputSenderAddress');
const inputEmailDefaultSubject = document.getElementById('inputEmailDefaultSubject');
const smtpSettingsGroup = document.getElementById('smtpSettingsGroup');
const inputSmtpHost = document.getElementById('inputSmtpHost');
const inputSmtpPort = document.getElementById('inputSmtpPort');
const checkSmtpSecure = document.getElementById('checkSmtpSecure');
const inputSmtpUser = document.getElementById('inputSmtpUser');
const inputSmtpPass = document.getElementById('inputSmtpPass');
const btnTestSmtp = document.getElementById('btnTestSmtp');
const inputWhatsAppMode = document.getElementById('inputWhatsAppMode');
const inputWhatsAppCC = document.getElementById('inputWhatsAppCC');

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

  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.classList.toggle('full-fit-list', viewName === 'leads' && state.leadsViewMode === 'list');
  }

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

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      const val = sortFilter.value;
      if (val === 'created_desc') {
        state.leadSortBy = 'created_at';
        state.leadSortDir = 'desc';
      } else if (val === 'created_asc') {
        state.leadSortBy = 'created_at';
        state.leadSortDir = 'asc';
      } else if (val === 'score_desc') {
        state.leadSortBy = 'match_score';
        state.leadSortDir = 'desc';
      } else if (val === 'score_asc') {
        state.leadSortBy = 'match_score';
        state.leadSortDir = 'asc';
      } else if (val === 'name_asc') {
        state.leadSortBy = 'company_name';
        state.leadSortDir = 'asc';
      }
      applyLeadSort();
      state.currentPage = 1;
      renderLeads();
    });
  }

  // Export & Bulk Actions
  btnExportCSV.addEventListener('click', () => {
    if (state.activeProjectId) {
      window.location.href = `/api/projects/${state.activeProjectId}/export`;
    } else {
      window.location.href = '/api/leads-export';
    }
  });

  if (btnExportProjectsCSV) {
    btnExportProjectsCSV.addEventListener('click', () => {
      window.location.href = '/api/projects-export';
    });
  }

  if (btnExportRecentLeadsCSV) {
    btnExportRecentLeadsCSV.addEventListener('click', () => {
      if (state.activeProjectId) {
        window.location.href = `/api/projects/${state.activeProjectId}/export`;
      } else {
        window.location.href = '/api/leads-export?limit=50';
      }
    });
  }

  if (btnDeleteProjectLeads) {
    btnDeleteProjectLeads.addEventListener('click', deleteProjectLeads);
  }

  // View Mode Toggle (Cards vs List)
  if (btnViewCards) {
    btnViewCards.addEventListener('click', () => switchLeadsViewMode('cards'));
  }
  if (btnViewList) {
    btnViewList.addEventListener('click', () => switchLeadsViewMode('list'));
  }
  if (btnViewCards && btnViewList) {
    btnViewCards.classList.toggle('active', state.leadsViewMode === 'cards');
    btnViewList.classList.toggle('active', state.leadsViewMode === 'list');
  }
  if (leadsContainer) {
    leadsContainer.classList.toggle('list-mode', state.leadsViewMode === 'list');
  }
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.classList.toggle('full-fit-list', state.currentView === 'leads' && state.leadsViewMode === 'list');
  }

  // Pagination page size change
  if (pageSizeSelect) {
    pageSizeSelect.value = String(state.pageSize);
    pageSizeSelect.addEventListener('change', (e) => {
      state.pageSize = Number(e.target.value);
      localStorage.setItem('leadscan_page_size', state.pageSize);
      state.currentPage = 1;
      renderLeads();
    });
  }

  // Project search in Projects view
  if (projectSearchInput) {
    projectSearchInput.addEventListener('input', () => {
      state.projectsCurrentPage = 1;
      renderProjectsList();
    });
  }

  // Projects View Mode Toggle (Cards vs List)
  if (btnProjViewCards) {
    btnProjViewCards.addEventListener('click', () => switchProjectsViewMode('cards'));
  }
  if (btnProjViewList) {
    btnProjViewList.addEventListener('click', () => switchProjectsViewMode('list'));
  }
  if (btnProjViewCards && btnProjViewList) {
    btnProjViewCards.classList.toggle('active', state.projectsViewMode === 'cards');
    btnProjViewList.classList.toggle('active', state.projectsViewMode === 'list');
  }

  // Projects Pagination page size change
  if (projPageSizeSelect) {
    projPageSizeSelect.value = String(state.projectsPageSize);
    projPageSizeSelect.addEventListener('change', (e) => {
      state.projectsPageSize = Number(e.target.value);
      localStorage.setItem('leadscan_proj_page_size', state.projectsPageSize);
      state.projectsCurrentPage = 1;
      renderProjectsList();
    });
  }

  // Modal: New Project
  if (btnNewProject) {
    btnNewProject.addEventListener('click', () => openCreateProjectModal());
  }
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
    updateKeyVisibility();
  });

  const eyeSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeOffSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  if (btnToggleGeminiKey) {
    btnToggleGeminiKey.addEventListener('click', () => {
      const isPwd = inputGeminiKey.type === 'password';
      inputGeminiKey.type = isPwd ? 'text' : 'password';
      btnToggleGeminiKey.innerHTML = isPwd ? eyeOffSvg : eyeSvg;
    });
  }
  if (btnToggleOpenAIKey) {
    btnToggleOpenAIKey.addEventListener('click', () => {
      const isPwd = inputOpenAIKey.type === 'password';
      inputOpenAIKey.type = isPwd ? 'text' : 'password';
      btnToggleOpenAIKey.innerHTML = isPwd ? eyeOffSvg : eyeSvg;
    });
  }
  if (btnTogglePlacesKey) {
    btnTogglePlacesKey.addEventListener('click', () => {
      const isPwd = inputPlacesKey.type === 'password';
      inputPlacesKey.type = isPwd ? 'text' : 'password';
      btnTogglePlacesKey.innerHTML = isPwd ? eyeOffSvg : eyeSvg;
    });
  }

  // Modal: Signboard Scan Actions
  if (btnCloseScanSignboard) {
    btnCloseScanSignboard.addEventListener('click', () => modalScanSignboard.classList.add('hidden'));
  }
  if (btnCancelScanSignboard) {
    btnCancelScanSignboard.addEventListener('click', () => modalScanSignboard.classList.add('hidden'));
  }
  if (formScanSignboard) {
    formScanSignboard.addEventListener('submit', async (e) => {
      e.preventDefault();
      const leadId = scanLeadId.value;
      const photoUrl = inputCustomPhotoUrl.value.trim();

      try {
        btnStartScanSignboard.disabled = true;
        btnStartScanSignboard.innerHTML = `<span class="spinner-sm"></span> <span>Analyzing Signboard...</span>`;

        const res = await fetch(`/api/leads/${leadId}/scan-signboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message || 'Contacts extracted from signboard!');
          const l = state.leads.find(x => x.id === parseInt(leadId, 10));
          if (l && data.lead) {
            Object.assign(l, data.lead);
          }
          renderLeads();

          if (data.photoUrl) {
            scanPreviewContainer.classList.remove('hidden');
            scanPreviewImg.src = data.photoUrl;
            scanResultInfo.innerHTML = `
              <div class="ocr-success-box">
                <strong>✓ Extracted Contacts:</strong>
                <div>Phones: <strong>${(data.extracted?.phones || []).join(', ') || 'None'}</strong></div>
                ${data.extracted?.contact_name ? `<div>Name: <strong>${escapeHtml(data.extracted.contact_name)}</strong></div>` : ''}
                ${data.extracted?.board_text ? `<div style="font-size:0.8rem; color:#94a3b8; margin-top:4px;">Board Text: "${escapeHtml(data.extracted.board_text)}"</div>` : ''}
              </div>
            `;
          }
          setTimeout(() => {
            modalScanSignboard.classList.add('hidden');
          }, 1800);
        } else {
          showToast(data.error || data.message || 'No contacts found in photo');
          if (data.photoUrl) {
            scanPreviewContainer.classList.remove('hidden');
            scanPreviewImg.src = data.photoUrl;
            scanResultInfo.innerHTML = `<div class="ocr-fail-box">${escapeHtml(data.message || 'No readable contacts detected')}</div>`;
          }
        }
      } catch (err) {
        showToast('Error running Vision OCR on signboard');
      } finally {
        btnStartScanSignboard.disabled = false;
        btnStartScanSignboard.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Scan with Vision AI</span>
        `;
      }
    });
  }

  // Modal: Pitch Actions
  btnClosePitch.addEventListener('click', () => modalPitch.classList.add('hidden'));
  btnCopyPitch.addEventListener('click', () => {
    navigator.clipboard.writeText(pitchTextarea.value);
    showToast('Pitch copied to clipboard!');
  });

  // Save Pitch
  btnSavePitch.addEventListener('click', async () => {
    if (!currentPitchLeadId) return;
    const newPitch = pitchTextarea.value.trim();
    try {
      btnSavePitch.disabled = true;
      const res = await fetch(`/api/leads/${currentPitchLeadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch_draft: newPitch })
      });
      const data = await res.json();
      if (data.success) {
        const l = state.leads.find(x => x.id === currentPitchLeadId);
        if (l) l.pitch_draft = newPitch;
        showToast('Pitch saved successfully!');
      } else {
        showToast(data.error || 'Failed to save pitch');
      }
    } catch (err) {
      showToast('Error saving pitch');
    } finally {
      btnSavePitch.disabled = false;
    }
  });

  // Send WhatsApp
  btnSendWhatsApp.addEventListener('click', async () => {
    if (!currentPitchLeadId) return;
    const phone = pitchRecipientPhone.value.trim();
    const message = pitchTextarea.value.trim();
    if (!phone) {
      showToast('Please enter a WhatsApp phone number');
      pitchRecipientPhone.focus();
      return;
    }

    try {
      btnSendWhatsApp.disabled = true;
      const res = await fetch(`/api/leads/${currentPitchLeadId}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();
      if (data.success && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
        const l = state.leads.find(x => x.id === currentPitchLeadId);
        if (l) l.status = 'contacted';
        renderLeads();
        loadDashboard();
        showToast('WhatsApp launched & Lead marked as Contacted!');
      } else {
        showToast(data.error || 'Failed to generate WhatsApp link');
      }
    } catch (err) {
      showToast('Error preparing WhatsApp message');
    } finally {
      btnSendWhatsApp.disabled = false;
    }
  });

  // Send Email
  btnSendEmail.addEventListener('click', async () => {
    if (!currentPitchLeadId) return;
    const to = pitchRecipientEmail.value.trim();
    const subject = pitchEmailSubject.value.trim() || 'Outreach from MerraLeadScan';
    const body = pitchTextarea.value.trim();
    if (!to) {
      showToast('Please enter a recipient email address');
      pitchRecipientEmail.focus();
      return;
    }

    try {
      btnSendEmail.disabled = true;
      btnSendEmail.textContent = 'Sending...';
      const res = await fetch(`/api/leads/${currentPitchLeadId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body })
      });
      const data = await res.json();
      if (data.success) {
        if (data.mode === 'mailto' && data.mailtoUrl) {
          window.location.href = data.mailtoUrl;
          showToast('Email client opened & Lead marked as Contacted!');
        } else {
          showToast('Email sent successfully via SMTP!');
        }
        const l = state.leads.find(x => x.id === currentPitchLeadId);
        if (l) l.status = 'contacted';
        renderLeads();
        loadDashboard();
      } else {
        showToast(data.error || 'Failed to send email');
      }
    } catch (err) {
      showToast('Error dispatching email');
    } finally {
      btnSendEmail.disabled = false;
      btnSendEmail.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        Send Email
      `;
    }
  });

  // Test SMTP button
  if (btnTestSmtp) {
    btnTestSmtp.addEventListener('click', async () => {
      const host = inputSmtpHost.value.trim();
      const port = inputSmtpPort.value.trim();
      const secure = checkSmtpSecure.checked;
      const user = inputSmtpUser.value.trim();
      const pass = inputSmtpPass.value.trim();
      if (!host || !user) {
        showToast('Please enter SMTP Host and Username');
        return;
      }

      try {
        btnTestSmtp.disabled = true;
        btnTestSmtp.textContent = 'Testing...';
        const res = await fetch('/api/outreach/test-smtp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, secure, user, pass })
        });
        const data = await res.json();
        if (data.success) {
          showToast('✅ SMTP Connection verified successfully!');
        } else {
          showToast(`❌ SMTP Error: ${data.error}`);
        }
      } catch (err) {
        showToast('Failed to test SMTP connection');
      } finally {
        btnTestSmtp.disabled = false;
        btnTestSmtp.textContent = 'Test SMTP Connection';
      }
    });
  }
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

      // Recent Leads
      renderDashboardRecentLeads(s.recentLeads || []);
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

function renderDashboardRecentLeads(leads) {
  if (!dashRecentLeadsContainer) return;

  if (!leads || leads.length === 0) {
    dashRecentLeadsContainer.innerHTML = `
      <div class="dash-empty-recent">
        <span style="font-size: 1.8rem; margin-bottom: 8px; display: block;">🔍</span>
        <p style="color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;">No leads scanned yet.</p>
        <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">Launch an AI prospect scan on your active project to start discovering leads.</p>
        <button class="btn btn-accent btn-sm" style="margin-top: 14px;" onclick="switchView('leads')">
          Go to Leads Explorer &rarr;
        </button>
      </div>
    `;
    return;
  }

  dashRecentLeadsContainer.innerHTML = `
    <div class="dash-recent-leads-grid">
      ${leads.map(l => {
        const scoreClass = l.match_score >= 85 ? 'match-high' : 'match-medium';
        let presenceBadge = '';
        if (l.web_presence_type === 'no_website') {
          presenceBadge = `<span class="badge-presence badge-no-web">🔥 No Website</span>`;
        } else if (l.web_presence_type === 'social_only') {
          presenceBadge = `<span class="badge-presence badge-social">📱 Social Only</span>`;
        } else {
          presenceBadge = `<span class="badge-presence badge-has-web">🌐 Has Website</span>`;
        }

        const mapBtn = l.map_url
          ? `<a href="${escapeHtml(l.map_url)}" target="_blank" class="table-map-btn" title="View on Google Maps">📍 Maps</a>`
          : '';

        const phones = Array.isArray(l.phones) ? l.phones : [];
        const phoneHtml = phones.length > 0
          ? `<div class="dash-lead-contact">
              <a href="tel:${escapeHtml(phones[0])}" class="table-phone-link">${escapeHtml(phones[0])}</a>
              <a href="https://wa.me/${phones[0].replace(/[^0-9]/g, '')}" target="_blank" class="table-wa-icon" title="Chat on WhatsApp">💬</a>
            </div>`
          : '<span style="color: var(--text-muted); font-size: 0.75rem;">No phone</span>';

        return `
          <div class="dash-lead-mini-card">
            <div class="dash-lead-header">
              <div>
                <div class="dash-lead-name" title="${escapeHtml(l.company_name)}">${escapeHtml(l.company_name)}</div>
                ${l.contact_name ? `<div class="dash-lead-person">👤 ${escapeHtml(l.contact_name)}</div>` : ''}
              </div>
              <span class="table-score-badge ${scoreClass}">${l.match_score}%</span>
            </div>
            <div class="dash-lead-presence">
              ${presenceBadge}
              ${mapBtn}
            </div>
            ${l.address ? `<div class="dash-lead-addr" title="${escapeHtml(l.address)}">📍 ${escapeHtml(l.address)}</div>` : ''}
            <div class="dash-lead-footer">
              ${phoneHtml}
              <button class="btn btn-secondary btn-sm" onclick="selectLeadFromDashboard(${l.project_id}, ${l.id})" style="padding: 4px 10px; font-size: 0.75rem;">
                View &rarr;
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function selectLeadFromDashboard(projectId, leadId) {
  state.activeProjectId = projectId;
  if (projectSelect) projectSelect.value = projectId;
  switchView('leads');
}
window.selectLeadFromDashboard = selectLeadFromDashboard;

/* ----------------- PROJECTS LIST LOGIC ----------------- */

function switchProjectsViewMode(mode) {
  state.projectsViewMode = mode;
  localStorage.setItem('leadscan_proj_view_mode', mode);
  if (btnProjViewCards) btnProjViewCards.classList.toggle('active', mode === 'cards');
  if (btnProjViewList) btnProjViewList.classList.toggle('active', mode === 'list');
  if (allProjectsGrid) allProjectsGrid.classList.toggle('list-mode', mode === 'list');
  renderProjectsList();
}

function renderProjectsList() {
  navProjectCount.textContent = state.projects.length;

  if (allProjectsGrid) {
    allProjectsGrid.classList.toggle('list-mode', state.projectsViewMode === 'list');
  }
  if (btnProjViewCards && btnProjViewList) {
    btnProjViewCards.classList.toggle('active', state.projectsViewMode === 'cards');
    btnProjViewList.classList.toggle('active', state.projectsViewMode === 'list');
  }

  const q = projectSearchInput ? projectSearchInput.value.trim().toLowerCase() : '';
  const filtered = state.projects.filter(p => {
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.target_criteria && p.target_criteria.toLowerCase().includes(q)) ||
      (p.target_keywords && p.target_keywords.toLowerCase().includes(q)) ||
      (p.target_industry && p.target_industry.toLowerCase().includes(q)) ||
      (p.target_region && p.target_region.toLowerCase().includes(q))
    );
  });

  if (filtered.length === 0) {
    allProjectsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 24px;">
        <div class="empty-icon">📁</div>
        <h3>${q ? 'No projects matching "' + escapeHtml(q) + '"' : 'No monitored projects yet'}</h3>
        <p>${q ? 'Try a different search term or clear the filter.' : 'Create your first project to start scanning the web and Google Maps for prospects.'}</p>
        <button class="btn btn-primary" onclick="openCreateProjectModal()" style="margin-top: 14px;">
          + Create New Project
        </button>
      </div>
    `;
    if (projectsPaginationBar) projectsPaginationBar.classList.add('hidden');
    return;
  }

  // Pagination calculation
  const totalProjects = filtered.length;
  const totalPages = Math.ceil(totalProjects / state.projectsPageSize) || 1;
  if (state.projectsCurrentPage > totalPages) state.projectsCurrentPage = totalPages;
  if (state.projectsCurrentPage < 1) state.projectsCurrentPage = 1;

  const startIndex = (state.projectsCurrentPage - 1) * state.projectsPageSize;
  const endIndex = Math.min(startIndex + state.projectsPageSize, totalProjects);
  const pagedProjects = filtered.slice(startIndex, endIndex);

  if (state.projectsViewMode === 'list') {
    allProjectsGrid.innerHTML = renderProjectsTable(pagedProjects);
  } else {
    allProjectsGrid.innerHTML = renderProjectsCards(pagedProjects);
  }

  renderProjectsPaginationControls(totalProjects, totalPages, startIndex, endIndex);
}

function renderProjectsCards(projects) {
  return projects.map(p => {
    let sourceBadge = '';
    const src = p.discovery_source || 'combined';
    if (src === 'maps') {
      sourceBadge = `<span class="badge-source badge-source-maps">📍 Local Maps</span>`;
    } else if (src === 'web') {
      sourceBadge = `<span class="badge-source badge-source-web">🌐 Web Only</span>`;
    } else {
      sourceBadge = `<span class="badge-source badge-source-combined">⚡ Combined (Maps+Web)</span>`;
    }

    const keywordsHtml = p.target_keywords
      ? `<div class="project-card-keywords">${p.target_keywords.split(',').map(kw => kw.trim()).filter(Boolean).map(kw => `<span class="keyword-pill">🔍 ${escapeHtml(kw)}</span>`).join('')}</div>`
      : '';

    return `
      <div class="project-card">
        <div class="project-card-inner">
          <div class="project-card-top">
            <div>
              <h3 class="project-card-title">${escapeHtml(p.name)}</h3>
              <div class="project-card-meta">
                ${p.url ? `<a href="${escapeHtml(p.url)}" target="_blank" class="lead-domain-link">${escapeHtml(p.url)} &rarr;</a>` : ''}
                ${p.created_at ? `<span class="project-date-pill" title="Created on ${escapeHtml(p.created_at)}">📅 ${formatCreatedDate(p.created_at)}</span>` : ''}
              </div>
            </div>
            <div class="project-badges-row">
              <span class="tag-pill">${escapeHtml(p.target_region || 'Global')}</span>
              ${sourceBadge}
            </div>
          </div>

          <p class="proj-desc">${escapeHtml(p.description)}</p>

          <div class="project-card-criteria">
            <strong style="color:var(--accent-cyan); display:block; margin-bottom:4px; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em;">🎯 Target Lead Criteria</strong>
            ${escapeHtml(p.target_criteria || 'No specific criteria set.')}
          </div>

          ${keywordsHtml}

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
            <div class="p-stat-box">
              <div class="p-stat-val" style="color:var(--accent-cyan);">${p.leads_with_emails || 0}</div>
              <div class="p-stat-lbl">Verified Emails</div>
            </div>
          </div>
        </div>

        <div class="project-card-actions">
          <div class="project-actions-left">
            <button class="btn btn-accent btn-sm" onclick="quickScanProject(${p.id})" title="Launch Instant Lead Scan">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Scan Now
            </button>
            <button class="btn btn-primary btn-sm" onclick="selectProjectAndOpenLeads(${p.id})">
              Explore Leads &rarr;
            </button>
          </div>
          <div class="project-actions-right">
            <button class="btn btn-secondary btn-sm btn-icon-only" onclick="exportProjectLeads(${p.id})" title="Export to CSV">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openEditProject(${p.id})" title="Edit Project Criteria">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Edit
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteProject(${p.id})" title="Delete Project">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderProjectsTable(projects) {
  return `
    <div class="projects-table-wrapper">
      <table class="projects-table leads-table">
        <thead>
          <tr>
            <th class="col-proj-name">Project & URL</th>
            <th class="col-proj-source">Region & Source</th>
            <th class="col-proj-criteria">Criteria & Keywords</th>
            <th class="col-proj-stats">Leads Breakdown</th>
            <th class="col-proj-created">Created</th>
            <th class="col-proj-actions" style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => {
            let sourceBadge = '';
            const src = p.discovery_source || 'combined';
            if (src === 'maps') {
              sourceBadge = `<span class="badge-source badge-source-maps">📍 Maps</span>`;
            } else if (src === 'web') {
              sourceBadge = `<span class="badge-source badge-source-web">🌐 Web</span>`;
            } else {
              sourceBadge = `<span class="badge-source badge-source-combined">⚡ Combined</span>`;
            }

            const keywordsHtml = p.target_keywords
              ? `<div class="project-table-keywords">${p.target_keywords.split(',').map(kw => kw.trim()).filter(Boolean).map(kw => `<span class="keyword-pill">🔍 ${escapeHtml(kw)}</span>`).join('')}</div>`
              : '';

            return `
              <tr>
                <td class="col-proj-name">
                  <div class="table-company-name">${escapeHtml(p.name)}</div>
                  ${p.url ? `<a href="${escapeHtml(p.url)}" target="_blank" class="table-link">${escapeHtml(p.url.replace(/^https?:\/\//, ''))} &rarr;</a>` : ''}
                  <p class="table-proj-desc" title="${escapeHtml(p.description)}">${escapeHtml(p.description)}</p>
                </td>
                <td class="col-proj-source">
                  <div class="project-table-badges">
                    <span class="tag-pill">${escapeHtml(p.target_region || 'Global')}</span>
                    ${sourceBadge}
                    ${p.target_industry ? `<span class="tag-pill" style="color: #38bdf8;">${escapeHtml(p.target_industry)}</span>` : ''}
                  </div>
                </td>
                <td class="col-proj-criteria">
                  <div class="table-criteria-text" title="${escapeHtml(p.target_criteria || '')}">
                    ${escapeHtml(p.target_criteria || 'No specific criteria set.')}
                  </div>
                  ${keywordsHtml}
                </td>
                <td class="col-proj-stats">
                  <div class="table-stats-chips">
                    <span class="stat-chip chip-total" title="Total Leads">Total: <strong>${p.total_leads || 0}</strong></span>
                    <span class="stat-chip chip-noweb" title="No Website Leads">⭐ No Web: <strong>${p.no_website_leads || 0}</strong></span>
                    <span class="stat-chip chip-match" title="High Match Leads">80%+: <strong>${p.high_match_leads || 0}</strong></span>
                    <span class="stat-chip chip-email" title="Verified Emails">Emails: <strong>${p.leads_with_emails || 0}</strong></span>
                  </div>
                </td>
                <td class="col-proj-created">
                  <span class="table-date-badge" title="${escapeHtml(p.created_at || '')}">📅 ${formatCreatedDate(p.created_at)}</span>
                </td>
                <td class="col-proj-actions" style="text-align: right;">
                  <div class="table-actions-row">
                    <button class="btn btn-accent btn-sm" onclick="quickScanProject(${p.id})" title="Launch Instant Scan">
                      🚀 Scan
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="selectProjectAndOpenLeads(${p.id})" title="Open Leads">
                      Explore &rarr;
                    </button>
                    <button class="btn-action-icon" onclick="exportProjectLeads(${p.id})" title="Export to CSV">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                    <button class="btn-action-icon" onclick="openEditProject(${p.id})" title="Edit Project">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="btn-action-icon" onclick="deleteProject(${p.id})" title="Delete Project" style="color: var(--accent-rose);">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportProjectLeads(projectId) {
  if (!projectId) return;
  window.location.href = `/api/projects/${projectId}/export`;
}
window.exportProjectLeads = exportProjectLeads;

function renderProjectsPaginationControls(totalProjects, totalPages, startIndex, endIndex) {
  if (!projectsPaginationBar) return;

  if (totalProjects === 0) {
    projectsPaginationBar.classList.add('hidden');
    return;
  }
  projectsPaginationBar.classList.remove('hidden');

  if (projPaginationRangeText) {
    projPaginationRangeText.textContent = `${startIndex + 1}–${endIndex}`;
  }
  if (projPaginationTotalText) {
    projPaginationTotalText.textContent = totalProjects;
  }
  if (projPageSizeSelect) {
    projPageSizeSelect.value = String(state.projectsPageSize);
  }

  if (!projPaginationNav) return;

  let navHtml = '';

  // Prev button
  const prevDisabled = state.projectsCurrentPage <= 1;
  navHtml += `
    <button type="button" class="btn-page-nav" ${prevDisabled ? 'disabled' : ''} onclick="goToProjectPage(${state.projectsCurrentPage - 1})" title="Previous Page">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      <span>Prev</span>
    </button>
  `;

  // Page numbers
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (state.projectsCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (state.projectsCurrentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', state.projectsCurrentPage - 1, state.projectsCurrentPage, state.projectsCurrentPage + 1, '...', totalPages);
    }
  }

  pages.forEach(p => {
    if (p === '...') {
      navHtml += `<span class="page-ellipsis">&hellip;</span>`;
    } else {
      const isActive = p === state.projectsCurrentPage;
      navHtml += `
        <button type="button" class="btn-page-num ${isActive ? 'active' : ''}" onclick="goToProjectPage(${p})" title="Page ${p}">
          ${p}
        </button>
      `;
    }
  });

  // Next button
  const nextDisabled = state.projectsCurrentPage >= totalPages;
  navHtml += `
    <button type="button" class="btn-page-nav" ${nextDisabled ? 'disabled' : ''} onclick="goToProjectPage(${state.projectsCurrentPage + 1})" title="Next Page">
      <span>Next</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  `;

  projPaginationNav.innerHTML = navHtml;
}

function goToProjectPage(page) {
  const totalPages = Math.ceil(state.projects.length / state.projectsPageSize) || 1;
  if (page < 1 || page > totalPages) return;
  state.projectsCurrentPage = page;
  renderProjectsList();
  const target = document.querySelector('.projects-view-header');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
window.goToProjectPage = goToProjectPage;
window.switchProjectsViewMode = switchProjectsViewMode;

async function quickScanProject(projectId) {
  state.activeProjectId = projectId;
  if (projectSelect) projectSelect.value = projectId;
  switchView('leads');
  await onProjectChanged();
  startScan();
}

async function deleteProject(projectId) {
  const p = state.projects.find(x => x.id === projectId);
  const name = p ? p.name : 'this project';
  if (!confirm(`Are you sure you want to delete "${name}" and all associated leads? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`Deleted project "${name}".`);
      if (state.activeProjectId === projectId) {
        state.activeProjectId = null;
      }
      await loadProjects();
      await loadDashboard();
      if (state.currentView === 'projects') renderProjectsList();
    } else {
      showToast(data.error || 'Failed to delete project');
    }
  } catch (err) {
    showToast('Error deleting project');
  }
}
window.quickScanProject = quickScanProject;
window.deleteProject = deleteProject;

function selectProjectAndOpenLeads(projectId) {
  state.activeProjectId = projectId;
  projectSelect.value = projectId;
  switchView('leads');
}

function openCreateProjectModal() {
  editProjectId.value = '';
  modalProjectHeading.textContent = 'Add New Project';
  formNewProject.reset();
  const rCombined = document.getElementById('srcCombined');
  if (rCombined) rCombined.checked = true;
  applyPresetCriteria('maps');
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
  if (inputProjKeywords) inputProjKeywords.value = p.target_keywords || '';
  inputProjRegion.value = p.target_region || '';

  const src = p.discovery_source || 'combined';
  const r = document.querySelector(`input[name="discoverySource"][value="${src}"]`);
  if (r) r.checked = true;

  modalNewProject.classList.remove('hidden');
}

function applyPresetCriteria(type) {
  if (type === 'maps') {
    inputProjCriteria.value = 'Target local physical businesses on Google Maps & OpenStreetMap with NO official website (clinics, doctors, advocates/lawyers, contractors, local shops). Prioritize places with direct phone/WhatsApp numbers.';
    const r = document.getElementById('srcMaps');
    if (r) r.checked = true;
  } else if (type === 'no_website') {
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
  const srcRadio = document.querySelector('input[name="discoverySource"]:checked');
  const payload = {
    name: inputProjName.value.trim(),
    url: inputProjUrl.value.trim(),
    description: inputProjDesc.value.trim(),
    target_criteria: inputProjCriteria.value.trim(),
    target_industry: inputProjIndustry.value.trim(),
    target_keywords: inputProjKeywords ? inputProjKeywords.value.trim() : '',
    target_region: inputProjRegion.value.trim(),
    discovery_source: srcRadio ? srcRadio.value : 'combined'
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
  if (proj.target_keywords) tags.push(`🔍 ${proj.target_keywords}`);
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
  params.append('sortBy', state.leadSortBy);
  params.append('sortDir', state.leadSortDir);

  try {
    const res = await fetch(`/api/projects/${state.activeProjectId}/leads?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      state.leads = data.leads;
      state.currentPage = 1;
      applyLeadSort();
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

function switchLeadsViewMode(mode) {
  state.leadsViewMode = mode;
  localStorage.setItem('leadscan_view_mode', mode);
  if (btnViewCards) btnViewCards.classList.toggle('active', mode === 'cards');
  if (btnViewList) btnViewList.classList.toggle('active', mode === 'list');
  if (leadsContainer) leadsContainer.classList.toggle('list-mode', mode === 'list');
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.classList.toggle('full-fit-list', mode === 'list');
  }
  renderLeads();
}

function renderLeads() {
  if (leadsContainer) {
    leadsContainer.classList.toggle('list-mode', state.leadsViewMode === 'list');
  }
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.classList.toggle('full-fit-list', state.leadsViewMode === 'list');
  }

  if (state.leads.length === 0) {
    leadsContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    if (leadsPaginationBar) leadsPaginationBar.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // Pagination calculation
  const totalLeads = state.leads.length;
  const totalPages = Math.ceil(totalLeads / state.pageSize) || 1;
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, totalLeads);
  const pagedLeads = state.leads.slice(startIndex, endIndex);

  if (state.leadsViewMode === 'list') {
    leadsContainer.innerHTML = renderLeadsTable(pagedLeads);
  } else {
    leadsContainer.innerHTML = renderLeadsCards(pagedLeads);
  }

  renderPaginationControls(totalLeads, totalPages, startIndex, endIndex);
}

function renderPaginationControls(totalLeads, totalPages, startIndex, endIndex) {
  if (!leadsPaginationBar) return;

  if (totalLeads === 0) {
    leadsPaginationBar.classList.add('hidden');
    return;
  }
  leadsPaginationBar.classList.remove('hidden');

  if (paginationRangeText) {
    paginationRangeText.textContent = `${startIndex + 1}–${endIndex}`;
  }
  if (paginationTotalText) {
    paginationTotalText.textContent = totalLeads;
  }
  if (pageSizeSelect) {
    pageSizeSelect.value = String(state.pageSize);
  }

  if (!paginationNav) return;

  let navHtml = '';

  // Prev button
  const prevDisabled = state.currentPage <= 1;
  navHtml += `
    <button type="button" class="btn-page-nav" ${prevDisabled ? 'disabled' : ''} onclick="goToPage(${state.currentPage - 1})" title="Previous Page">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      <span>Prev</span>
    </button>
  `;

  // Page numbers
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (state.currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (state.currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', state.currentPage - 1, state.currentPage, state.currentPage + 1, '...', totalPages);
    }
  }

  pages.forEach(p => {
    if (p === '...') {
      navHtml += `<span class="page-ellipsis">&hellip;</span>`;
    } else {
      const isActive = p === state.currentPage;
      navHtml += `
        <button type="button" class="btn-page-num ${isActive ? 'active' : ''}" onclick="goToPage(${p})" title="Page ${p}">
          ${p}
        </button>
      `;
    }
  });

  // Next button
  const nextDisabled = state.currentPage >= totalPages;
  navHtml += `
    <button type="button" class="btn-page-nav" ${nextDisabled ? 'disabled' : ''} onclick="goToPage(${state.currentPage + 1})" title="Next Page">
      <span>Next</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  `;

  paginationNav.innerHTML = navHtml;
}

function goToPage(page) {
  const totalPages = Math.ceil(state.leads.length / state.pageSize) || 1;
  if (page < 1 || page > totalPages) return;
  state.currentPage = page;
  renderLeads();
  const target = document.querySelector('.leads-header');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
window.goToPage = goToPage;

function renderLeadsCards(leads = state.leads) {
  return leads.map(lead => {
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

    // Website link
    const websiteHtml = lead.website_url
      ? `<a href="${escapeHtml(lead.website_url)}" target="_blank" class="lead-domain-link">${escapeHtml(lead.website_url)} &rarr;</a>`
      : '';

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

    // Parse signboard extraction if present
    let signboardPhones = [];
    if (lead.signboard_extracted) {
      try {
        const ext = typeof lead.signboard_extracted === 'string' ? JSON.parse(lead.signboard_extracted) : lead.signboard_extracted;
        signboardPhones = ext.phones || [];
      } catch (e) {}
    }

    const signboardIconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px;"><rect x="3" y="3" width="18" height="12" rx="2"></rect><line x1="12" y1="15" x2="12" y2="21"></line><line x1="8" y1="21" x2="16" y2="21"></line></svg>`;

    // Phones list
    const phonesHtml = (lead.phones && lead.phones.length > 0)
      ? lead.phones.map(phone => {
          const isFromSignboard = signboardPhones.some(sp => sp.replace(/\D/g, '') === phone.replace(/\D/g, '')) || (Boolean(lead.signboard_photo_url) && signboardPhones.length > 0);
          const signboardBadge = isFromSignboard
            ? `<span class="phone-signboard-source-badge" title="Source: Signboard / Nameboard Photo${lead.signboard_photo_url ? ' (Click to view photo)' : ''}">${lead.signboard_photo_url ? `<a href="${escapeHtml(lead.signboard_photo_url)}" target="_blank" class="signboard-source-link">${signboardIconSvg}</a>` : signboardIconSvg}</span>`
            : '';
          return `
            <div class="contact-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <a href="tel:${escapeHtml(phone)}" style="color: #cbd5e1; text-decoration: none;">${escapeHtml(phone)}</a>
              ${signboardBadge}
              <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" target="_blank" class="whatsapp-mini-btn" title="Open WhatsApp Chat">
                💬 WhatsApp
              </a>
            </div>
          `;
        }).join('')
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

    // Address & Map URL
    const addressHtml = lead.address
      ? `<div class="lead-address-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>${escapeHtml(lead.address)}</span>
        </div>`
      : '';

    const mapButtonHtml = lead.map_url
      ? `<a href="${escapeHtml(lead.map_url)}" target="_blank" class="map-mini-btn" title="View on Google Maps">
          📍 View on Google Maps &rarr;
        </a>`
      : '';

    return `
      <div class="lead-card" id="leadCard-${lead.id}">
        <div>
          <div class="lead-top-row">
            <div>
              <div style="margin-bottom: 6px;">${presenceBadge}</div>
              <h3 class="lead-company-name">${escapeHtml(lead.company_name)}</h3>
              ${contactPersonHtml}
              ${addressHtml}
              <div style="margin-top: 4px;">${websiteHtml}</div>
              ${mapButtonHtml}
              ${lead.created_at ? `<div style="margin-top: 6px;"><span class="table-date-badge" title="Discovered: ${escapeHtml(lead.created_at)}">📅 Discovered: ${formatCreatedDate(lead.created_at)}</span></div>` : ''}
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

function renderLeadsTable(leads = state.leads) {
  return `
    <div class="leads-table-wrapper">
      <table class="leads-table">
        <thead>
          <tr>
            <th class="col-business">Company & Presence</th>
            <th class="col-location">Location</th>
            <th class="col-contacts">Contacts</th>
            <th class="col-ai">AI Match & Pitch</th>
            <th class="col-status">Status</th>
            <th class="col-discovered sortable" onclick="toggleLeadSort('created_at')" title="Click to sort by Discovered Date (${state.leadSortBy === 'created_at' && state.leadSortDir === 'desc' ? 'Currently Latest First' : 'Currently Oldest First'})">
              Discovered <span class="sort-indicator">${state.leadSortBy === 'created_at' ? (state.leadSortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
            </th>
            <th class="col-actions" style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(lead => {
            const scoreClass = lead.match_score >= 85 ? 'match-high' : 'match-medium';
            
            let presenceBadge = '';
            if (lead.web_presence_type === 'no_website') {
              presenceBadge = `<span class="badge-presence badge-no-web">🔥 No Website</span>`;
            } else if (lead.web_presence_type === 'social_only') {
              presenceBadge = `<span class="badge-presence badge-social">📱 Social Only</span>`;
            } else {
              presenceBadge = `<span class="badge-presence badge-has-web">🌐 Has Website</span>`;
            }

            const websiteHtml = lead.website_url
              ? `<a href="${escapeHtml(lead.website_url)}" target="_blank" class="table-link">${escapeHtml(lead.website_url.replace(/^https?:\/\//, ''))} &rarr;</a>`
              : '';

            const mapBtn = lead.map_url
              ? `<a href="${escapeHtml(lead.map_url)}" target="_blank" class="table-map-btn" title="View on Google Maps">📍 Google Maps</a>`
              : '';

            let tableSignboardPhones = [];
            if (lead.signboard_extracted) {
              try {
                const ext = typeof lead.signboard_extracted === 'string' ? JSON.parse(lead.signboard_extracted) : lead.signboard_extracted;
                tableSignboardPhones = ext.phones || [];
              } catch (e) {}
            }

            const signboardIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px;"><rect x="3" y="3" width="18" height="12" rx="2"></rect><line x1="12" y1="15" x2="12" y2="21"></line><line x1="8" y1="21" x2="16" y2="21"></line></svg>`;

            const phonesHtml = (lead.phones && lead.phones.length > 0)
              ? lead.phones.map(p => {
                  const isFromSignboard = tableSignboardPhones.some(sp => sp.replace(/\D/g, '') === p.replace(/\D/g, '')) || (Boolean(lead.signboard_photo_url) && tableSignboardPhones.length > 0);
                  const iconBadge = isFromSignboard
                    ? `<span class="table-phone-signboard-source-badge" title="Source: Signboard / Nameboard Photo${lead.signboard_photo_url ? ' (Click to view photo)' : ''}">${lead.signboard_photo_url ? `<a href="${escapeHtml(lead.signboard_photo_url)}" target="_blank" class="signboard-source-link">${signboardIconSvg}</a>` : signboardIconSvg}</span>`
                    : '';
                  return `
                    <div class="table-contact-item">
                      <a href="tel:${escapeHtml(p)}" class="table-phone-link">${escapeHtml(p)}</a>
                      ${iconBadge}
                      <a href="https://wa.me/${p.replace(/[^0-9]/g, '')}" target="_blank" class="table-wa-icon" title="Chat on WhatsApp">💬</a>
                    </div>
                  `;
                }).join('')
              : '<span style="color: var(--text-dim); font-size:0.78rem;">No phone</span>';

            const emailsHtml = (lead.emails && lead.emails.length > 0)
              ? lead.emails.map(e => `
                  <div class="table-contact-item">
                    <a href="mailto:${escapeHtml(e)}" class="table-email-link" title="${escapeHtml(e)}">${escapeHtml(e)}</a>
                  </div>
                `).join('')
              : '';

            return `
              <tr id="leadRow-${lead.id}">
                <td class="col-business">
                  <div class="table-company-name">${escapeHtml(lead.company_name)}</div>
                  ${lead.contact_name ? `<div class="table-contact-name">👤 ${escapeHtml(lead.contact_name)}</div>` : ''}
                  <div class="table-presence-row">
                    ${presenceBadge}
                    ${websiteHtml}
                  </div>
                </td>
                <td class="col-location">
                  <div class="table-address-text" title="${escapeHtml(lead.address || 'N/A')}">
                    ${escapeHtml(lead.address || 'N/A')}
                  </div>
                  ${mapBtn}
                </td>
                <td class="col-contacts">
                  ${phonesHtml}
                  ${emailsHtml}
                </td>
                <td class="col-ai">
                  <div class="table-ai-fit">
                    <span class="table-score-badge ${scoreClass}">${lead.match_score}%</span>
                    <button class="btn-pitch-preview" onclick="viewPitch(${lead.id})" title="View Pitch">
                      ⚡ Pitch
                    </button>
                  </div>
                  <div class="table-ai-reason" title="${escapeHtml(lead.match_reason || '')}">
                    ${escapeHtml(lead.match_reason || '')}
                  </div>
                </td>
                <td class="col-status">
                  <select class="lead-status-select table-status-select" onchange="updateLeadStatus(${lead.id}, this.value)">
                    <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="saved" ${lead.status === 'saved' ? 'selected' : ''}>Saved</option>
                    <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                  </select>
                </td>
                <td class="col-discovered">
                  <span class="table-date-badge" title="Discovered: ${escapeHtml(lead.created_at || '')}">
                    📅 ${formatCreatedDate(lead.created_at)}
                  </span>
                </td>
                <td class="col-actions" style="text-align: right;">
                  <button class="btn-action-icon" onclick="deleteLead(${lead.id})" title="Delete Lead">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
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

      // If user hasn't explicitly chosen provider, or provider is 'gemini' but only OpenAI key is given, auto-select OpenAI
      const hasGemini = Boolean(state.settings?.gemini_api_key || state.settings?.has_gemini_key);
      const hasOpenAI = Boolean(state.settings?.openai_api_key || state.settings?.has_openai_key);

      let currentProvider = state.settings.ai_provider || 'gemini';
      if ((currentProvider === 'gemini' || !state.settings.ai_provider) && !hasGemini && hasOpenAI) {
        currentProvider = 'openai';
      }
      selectProvider.value = currentProvider;

      updateProviderDropdownOptions();
      renderKeyStatus('gemini');
      renderKeyStatus('openai');
      renderKeyStatus('places');
      updateKeyVisibility();

      if (inputPlacesKey) inputPlacesKey.value = state.settings.google_places_api_key || '';
      if (checkEnableSignboardVision) checkEnableSignboardVision.checked = state.settings.enable_signboard_vision !== 'false';

      inputBudgetCap.value = state.settings.budget_cap_usd || '2.00';
      inputMaxLeadsSetting.value = state.settings.max_leads_per_scan || '10';
      checkEnableCostGuard.checked = state.settings.enable_cost_guard === 'true';
      checkFallbackFree.checked = state.settings.fallback_to_free === 'true';

      // Outreach Settings
      if (inputEmailMode) inputEmailMode.value = state.settings.email_mode || 'mailto';
      if (inputSenderName) inputSenderName.value = state.settings.email_sender_name || 'Entepage Team';
      if (inputSenderAddress) inputSenderAddress.value = state.settings.email_sender_address || '';
      if (inputEmailDefaultSubject) inputEmailDefaultSubject.value = state.settings.email_default_subject || 'Custom Website & WhatsApp Lead Routing for {{company}}';
      if (inputSmtpHost) inputSmtpHost.value = state.settings.smtp_host || '';
      if (inputSmtpPort) inputSmtpPort.value = state.settings.smtp_port || '587';
      if (checkSmtpSecure) checkSmtpSecure.checked = state.settings.smtp_secure === 'true';
      if (inputSmtpUser) inputSmtpUser.value = state.settings.smtp_user || '';
      if (inputSmtpPass) inputSmtpPass.value = ''; // masked on server
      if (inputWhatsAppMode) inputWhatsAppMode.value = state.settings.whatsapp_mode || 'app';
      if (inputWhatsAppCC) inputWhatsAppCC.value = state.settings.whatsapp_country_code || '91';

      toggleSmtpFields();
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

function updateProviderDropdownOptions() {
  if (!selectProvider) return;
  const geminiOption = selectProvider.querySelector('option[value="gemini"]');
  const openaiOption = selectProvider.querySelector('option[value="openai"]');
  const hasGemini = Boolean(state.settings?.gemini_api_key || state.settings?.has_gemini_key);
  const hasOpenAI = Boolean(state.settings?.openai_api_key || state.settings?.has_openai_key);

  if (geminiOption) {
    if (hasGemini) {
      const src = state.settings.gemini_source === 'env' ? 'via .env' : 'Saved';
      geminiOption.textContent = `Google Gemini (✓ Key Active ${src})`;
    } else {
      geminiOption.textContent = `Google Gemini (Recommended - Generous Free Tier)`;
    }
  }

  if (openaiOption) {
    if (hasOpenAI) {
      const src = state.settings.openai_source === 'env' ? 'via .env' : 'Saved';
      openaiOption.textContent = `OpenAI (gpt-4o-mini - ✓ Key Active ${src})`;
    } else {
      openaiOption.textContent = `OpenAI (gpt-4o-mini)`;
    }
  }
}

function renderKeyStatus(provider) {
  if (provider === 'gemini') {
    if (!inputGeminiKey || !statusGeminiKey) return;
    const hasKey = Boolean(state.settings?.gemini_api_key || state.settings?.has_gemini_key);
    if (hasKey) {
      inputGeminiKey.value = state.settings.gemini_api_key || '';
      const masked = state.settings.gemini_api_key_masked || (state.settings.gemini_api_key ? (state.settings.gemini_api_key.slice(0, 6) + '...' + state.settings.gemini_api_key.slice(-4)) : '••••');
      const isEnv = state.settings.gemini_source === 'env';
      statusGeminiKey.innerHTML = `
        <span class="badge-pill ${isEnv ? 'pill-env' : 'pill-saved'}">
          ${isEnv ? '● Active via .env' : '✓ Saved in Settings'}
        </span>
        <span class="key-status-text">${masked} is loaded & active</span>
      `;
    } else {
      inputGeminiKey.value = '';
      inputGeminiKey.placeholder = 'AIzaSy... (Leave empty to use Free Heuristics)';
      statusGeminiKey.innerHTML = `
        <span class="badge-pill pill-empty">No Key Detected</span>
        <span class="key-status-text">Enter key above or define GEMINI_API_KEY in .env</span>
      `;
    }
  } else if (provider === 'openai') {
    if (!inputOpenAIKey || !statusOpenAIKey) return;
    const hasKey = Boolean(state.settings?.openai_api_key || state.settings?.has_openai_key);
    if (hasKey) {
      inputOpenAIKey.value = state.settings.openai_api_key || '';
      const masked = state.settings.openai_api_key_masked || (state.settings.openai_api_key ? (state.settings.openai_api_key.slice(0, 6) + '...' + state.settings.openai_api_key.slice(-4)) : '••••');
      const isEnv = state.settings.openai_source === 'env';
      statusOpenAIKey.innerHTML = `
        <span class="badge-pill ${isEnv ? 'pill-env' : 'pill-saved'}">
          ${isEnv ? '● Active via .env' : '✓ Saved in Settings'}
        </span>
        <span class="key-status-text">${masked} is loaded & active</span>
      `;
    } else {
      inputOpenAIKey.value = '';
      inputOpenAIKey.placeholder = 'sk-... (Leave empty to use Free Heuristics)';
      statusOpenAIKey.innerHTML = `
        <span class="badge-pill pill-empty">No Key Detected</span>
        <span class="key-status-text">Enter key above or define OPENAI_API_KEY in .env</span>
      `;
    }
  } else if (provider === 'places') {
    if (!inputPlacesKey || !statusPlacesKey) return;
    const hasKey = Boolean(state.settings?.google_places_api_key || state.settings?.has_places_key);
    if (hasKey) {
      inputPlacesKey.value = state.settings.google_places_api_key || '';
      const masked = state.settings.google_places_api_key_masked || (state.settings.google_places_api_key ? (state.settings.google_places_api_key.slice(0, 6) + '...' + state.settings.google_places_api_key.slice(-4)) : '••••');
      const isEnv = state.settings.places_source === 'env';
      statusPlacesKey.innerHTML = `
        <span class="badge-pill ${isEnv ? 'pill-env' : 'pill-saved'}">
          ${isEnv ? '● Active via .env' : '✓ Saved in Settings'}
        </span>
        <span class="key-status-text">${masked} is loaded & active</span>
      `;
    } else {
      inputPlacesKey.value = '';
      inputPlacesKey.placeholder = 'AIzaSy... (Leave empty for free web image search)';
      statusPlacesKey.innerHTML = `
        <span class="badge-pill pill-empty">Free Web Image Search Mode</span>
        <span class="key-status-text">Optional. Free DuckDuckGo image search active if empty.</span>
      `;
    }
  }
}

function openScanSignboardModal(leadId) {
  const lead = state.leads.find(x => x.id === leadId);
  if (!lead) return;

  scanLeadId.value = lead.id;
  modalScanLeadName.textContent = `Analyzing signboard for "${lead.company_name}"`;
  inputCustomPhotoUrl.value = lead.signboard_photo_url || '';

  if (lead.signboard_photo_url) {
    scanPreviewContainer.classList.remove('hidden');
    scanPreviewImg.src = lead.signboard_photo_url;
    let info = '';
    try {
      const ext = JSON.parse(lead.signboard_extracted || '{}');
      if (ext.board_text) info = `<div class="ocr-success-box">Previous OCR: "${escapeHtml(ext.board_text)}"</div>`;
    } catch(e) {}
    scanResultInfo.innerHTML = info;
  } else {
    scanPreviewContainer.classList.add('hidden');
    scanPreviewImg.src = '';
    scanResultInfo.innerHTML = '';
  }

  modalScanSignboard.classList.remove('hidden');
}
window.openScanSignboardModal = openScanSignboardModal;

function updateKeyVisibility() {
  if (!selectProvider) return;
  const val = selectProvider.value;
  if (groupGeminiKey) groupGeminiKey.classList.toggle('hidden', val !== 'gemini');
  if (groupOpenAIKey) groupOpenAIKey.classList.toggle('hidden', val !== 'openai');
}

function openSettingsModal() {
  switchSettingsTab('ai');
  loadUsage();
  loadSettings();
  modalSettings.classList.remove('hidden');
}

function switchSettingsTab(tabName) {
  if (tabName === 'ai') {
    btnSettingsTabAI?.classList.add('active');
    btnSettingsTabOutreach?.classList.remove('active');
    settingsSectionAI?.classList.remove('hidden');
    settingsSectionOutreach?.classList.add('hidden');
  } else {
    btnSettingsTabOutreach?.classList.add('active');
    btnSettingsTabAI?.classList.remove('active');
    settingsSectionOutreach?.classList.remove('hidden');
    settingsSectionAI?.classList.add('hidden');
  }
}

function toggleSmtpFields() {
  if (smtpSettingsGroup && inputEmailMode) {
    smtpSettingsGroup.classList.toggle('hidden', inputEmailMode.value !== 'smtp');
  }
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const payload = {
    ai_provider: selectProvider.value,
    budget_cap_usd: inputBudgetCap.value,
    max_leads_per_scan: inputMaxLeadsSetting.value,
    enable_cost_guard: String(checkEnableCostGuard.checked),
    fallback_to_free: String(checkFallbackFree.checked),
    // Outreach Settings
    email_mode: inputEmailMode.value,
    email_sender_name: inputSenderName.value.trim(),
    email_sender_address: inputSenderAddress.value.trim(),
    email_default_subject: inputEmailDefaultSubject.value.trim(),
    smtp_host: inputSmtpHost.value.trim(),
    smtp_port: inputSmtpPort.value.trim(),
    smtp_secure: String(checkSmtpSecure.checked),
    smtp_user: inputSmtpUser.value.trim(),
    whatsapp_mode: inputWhatsAppMode.value,
    whatsapp_country_code: inputWhatsAppCC.value.trim(),
    google_places_api_key: inputPlacesKey ? inputPlacesKey.value.trim() : '',
    enable_signboard_vision: checkEnableSignboardVision ? String(checkEnableSignboardVision.checked) : 'true'
  };

  payload.gemini_api_key = inputGeminiKey.value.trim();
  payload.openai_api_key = inputOpenAIKey.value.trim();
  if (inputSmtpPass.value.trim()) {
    payload.smtp_pass = inputSmtpPass.value.trim();
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Settings saved successfully!');
      modalSettings.classList.add('hidden');
      await loadSettings();
      await loadUsage();
    }
  } catch (err) {
    showToast('Failed to save settings');
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
    const totalPages = Math.ceil(state.leads.length / state.pageSize) || 1;
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    renderLeads();
    updateMetrics();
    await loadDashboard();
    showToast('Lead deleted.');
  } catch (e) {}
}

async function deleteProjectLeads() {
  if (!state.activeProjectId) {
    showToast('Please select a project first.', 'error');
    return;
  }
  const project = state.projects.find(p => p.id === state.activeProjectId);
  const projName = project ? project.name : 'this project';

  if (!confirm(`Are you sure you want to delete all leads for "${projName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/leads?projectId=${state.activeProjectId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`Deleted ${data.deleted || 0} leads for "${projName}".`);
      await loadLeads();
      await loadDashboard();
      await loadProjects();
    } else {
      showToast(data.error || 'Failed to delete leads', 'error');
    }
  } catch (err) {
    showToast('Failed to delete leads: ' + err.message, 'error');
  }
}

function viewPitch(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  currentPitchLeadId = leadId;
  pitchLeadName.textContent = `Tailored for ${lead.company_name} (${lead.website_url || 'No Website'})`;
  pitchTextarea.value = lead.pitch_draft || 'No pitch draft generated.';

  // Prefill contact details
  const primaryPhone = (lead.phones && lead.phones.length > 0) ? lead.phones[0] : '';
  const primaryEmail = (lead.emails && lead.emails.length > 0) ? lead.emails[0] : '';
  if (pitchRecipientPhone) pitchRecipientPhone.value = primaryPhone;
  if (pitchRecipientEmail) pitchRecipientEmail.value = primaryEmail;

  const defaultSubj = state.settings?.email_default_subject || 'Custom Website & WhatsApp Integration for {{company}}';
  if (pitchEmailSubject) {
    pitchEmailSubject.value = defaultSubj.replace('{{company}}', lead.company_name);
  }

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

function formatCreatedDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

function applyLeadSort() {
  state.leads.sort((a, b) => {
    if (state.leadSortBy === 'created_at') {
      const dateA = new Date(a.created_at ? (a.created_at.includes('T') ? a.created_at : a.created_at.replace(' ', 'T') + 'Z') : 0).getTime();
      const dateB = new Date(b.created_at ? (b.created_at.includes('T') ? b.created_at : b.created_at.replace(' ', 'T') + 'Z') : 0).getTime();
      return state.leadSortDir === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (state.leadSortBy === 'company_name') {
      const nameA = (a.company_name || '').toLowerCase();
      const nameB = (b.company_name || '').toLowerCase();
      return state.leadSortDir === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else {
      const scoreA = Number(a.match_score) || 0;
      const scoreB = Number(b.match_score) || 0;
      return state.leadSortDir === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    }
  });
}

function toggleLeadSort(column) {
  if (column === 'created_at' || column === 'discovered') {
    if (state.leadSortBy === 'created_at') {
      state.leadSortDir = state.leadSortDir === 'desc' ? 'asc' : 'desc';
    } else {
      state.leadSortBy = 'created_at';
      state.leadSortDir = 'desc';
    }
    if (sortFilter) {
      sortFilter.value = state.leadSortDir === 'asc' ? 'created_asc' : 'created_desc';
    }
    applyLeadSort();
    renderLeads();
  }
}

// Window global bindings for inline HTML
window.formatCreatedDate = formatCreatedDate;
window.applyLeadSort = applyLeadSort;
window.toggleLeadSort = toggleLeadSort;
window.copyText = copyText;
window.updateLeadStatus = updateLeadStatus;
window.deleteLead = deleteLead;
window.viewPitch = viewPitch;
window.switchView = switchView;
window.applyPresetCriteria = applyPresetCriteria;
window.switchSettingsTab = switchSettingsTab;
window.toggleSmtpFields = toggleSmtpFields;
window.openCreateProjectModal = openCreateProjectModal;
window.openEditProject = openEditProject;
window.selectProjectAndOpenLeads = selectProjectAndOpenLeads;
window.handleRecAction = handleRecAction;

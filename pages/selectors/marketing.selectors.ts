/**
 * Marketing Module Selectors
 *
 * All selectors use data-testid attributes for reliability.
 * Reference: marketing-data-testid-list.md (122 testids total)
 *
 * Naming convention: marketing-{element-type}-{name}
 */
export const MarketingSelectors = {
  // ============================================
  // Sidebar Navigation
  // ============================================
  sidebar: {
    emailCampaigns: '[data-testid="marketing-nav-emailCampaigns"]',
    emailTemplates: '[data-testid="marketing-nav-emailTemplates"]',
    smsCampaigns: '[data-testid="marketing-nav-smsCampaigns"]',
    voiceCampaigns: '[data-testid="marketing-nav-voiceCampaigns"]',
  },

  // ============================================
  // Email Campaigns — List Page
  // ============================================
  campaigns: {
    heading: '[data-testid="marketing-heading"]',
    newCampaignBtn: '[data-testid="marketing-button-newCampaign"]',
    table: '[data-testid="marketing-campaigns-table"]',
    row: (id: string) => `[data-testid="marketing-campaign-row-${id}"]`,
    allRows: '[data-testid^="marketing-campaign-row-"]',
    name: (id: string) => `[data-testid="marketing-campaign-name-${id}"]`,
    statusBadge: (id: string) => `[data-testid="marketing-campaign-badge-status-${id}"]`,
    recipientsBadge: (id: string) => `[data-testid="marketing-campaign-badge-recipients-${id}"]`,
    menuBtn: (id: string) => `[data-testid="marketing-campaign-button-menu-${id}"]`,
    menuEdit: '[data-testid="marketing-menuitem-edit"]',
    menuDuplicate: '[data-testid="marketing-menuitem-duplicate"]',
    menuDelete: '[data-testid="marketing-menuitem-delete"]',
  },

  // ============================================
  // Email Campaign — Create Form
  // ============================================
  campaignForm: {
    backBtn: '[data-testid="marketing-button-back"]',
    accordionBasicInfo: '[data-testid="marketing-accordion-basicInfo"]',
    accordionSenderSettings: '[data-testid="marketing-accordion-senderSettings"]',
    campaignName: '[data-testid="marketing-input-campaignName"]',
    emailSubject: '[data-testid="marketing-input-emailSubject"]',
    previewText: '[data-testid="marketing-input-previewText"]',
    htmlContent: '[data-testid="marketing-input-htmlContent"]',
    saveCampaignBtn: '[data-testid="marketing-button-saveCampaign"]',
  },

  // ============================================
  // Email Campaign — Sender Settings (Create form)
  // ============================================
  senderSettings: {
    emailProvider: '[data-testid="marketing-select-emailProvider"]',
    addProviderLink: '[data-testid="marketing-link-addProvider"]',
    fromName: '[data-testid="marketing-input-fromName"]',
    replyToEmail: '[data-testid="marketing-input-replyToEmail"]',
  },

  // ============================================
  // Email Campaign — Edit Mode Tabs
  // ============================================
  campaignEdit: {
    backBtn: '[data-testid="campaign-back-button"]',
    contentTab: '[data-testid="campaign-tab-content"]',
    senderTab: '[data-testid="campaign-tab-sender"]',
    recipientsTab: '[data-testid="campaign-tab-recipients"]',
    testSendTab: '[data-testid="campaign-tab-test"]',
    deliveryTab: '[data-testid="campaign-tab-delivery"]',
    // Content tab fields
    nameInput: '[data-testid="campaign-name-input"]',
    subjectInput: '[data-testid="campaign-subject-input"]',
    previewTextInput: '[data-testid="campaign-preview-text-input"]',
    htmlInput: '[data-testid="campaign-body-html-input"]',
    htmlPreview: '[data-testid="campaign-body-html-preview"]',
    saveContentBtn: '[data-testid="campaign-save-content-button"]',
    // Sender tab fields
    providerSelect: '[data-testid="campaign-provider-select"]',
    fromNameInput: '[data-testid="campaign-from-name-input"]',
    replyToInput: '[data-testid="campaign-reply-to-input"]',
    saveSenderBtn: '[data-testid="campaign-save-sender-button"]',
    // Recipients tab
    addEventFilterBtn: '[data-testid="campaign-add-event-filter-button"]',
    addContactFilterBtn: '[data-testid="campaign-add-contact-filter-button"]',
    saveRecipientsBtn: '[data-testid="campaign-save-recipients-button"]',
    // Test & Send tab
    testEmailInput: '[data-testid="campaign-test-email-input"]',
    testSendBtn: '[data-testid="campaign-test-send-button"]',
    sendCampaignBtn: '[data-testid="campaign-send-button"]',
    sendDryRunCheckbox: '[data-testid="campaign-send-dryrun"]',
    sendConfirmBtn: '[data-testid="campaign-send-confirm"]',
    sendCancelBtn: '[data-testid="campaign-send-cancel"]',
    sendStopBtn: '[data-testid="campaign-send-stop"]',
    resumeBtn: '[data-testid="campaign-resume-button"]',
    sendAgainBtn: '[data-testid="campaign-send-again-button"]',
  },

  // ============================================
  // Campaign Stats
  // ============================================
  stats: {
    container: '[data-testid="marketing-stats-container"]',
    sending: '[data-testid="marketing-stats-sending"]',
    grid: '[data-testid="marketing-stats-grid"]',
    total: '[data-testid="marketing-stat-total"]',
    sent: '[data-testid="marketing-stat-sent"]',
    failed: '[data-testid="marketing-stat-failed"]',
    opened: '[data-testid="marketing-stat-opened"]',
  },

  // ============================================
  // Email Templates — List Page
  // ============================================
  templates: {
    heading: '[data-testid="marketing-templates-heading"]',
    createTemplateBtn: '[data-testid="marketing-button-createTemplate"]',
    grid: '[data-testid="marketing-templates-grid"]',
    card: (id: string) => `[data-testid="marketing-template-card-${id}"]`,
    allCards: '[data-testid^="marketing-template-card-"]',
    menuBtn: (id: string) => `[data-testid="marketing-template-button-menu-${id}"]`,
    menuEdit: '[data-testid="marketing-menuitem-editTemplate"]',
    menuDuplicate: '[data-testid="marketing-menuitem-duplicateTemplate"]',
    menuDelete: '[data-testid="marketing-menuitem-deleteTemplate"]',
  },

  // ============================================
  // Email Template — Editor Dialog
  // ============================================
  templateModal: {
    dialog: '[data-testid="marketing-dialog-template"]',
    title: '[data-testid="marketing-dialog-template-title"]',
    editTab: '[data-testid="marketing-tab-edit"]',
    previewTab: '[data-testid="marketing-tab-preview"]',
    templateName: '[data-testid="marketing-input-templateName"]',
    category: '[data-testid="marketing-select-category"]',
    description: '[data-testid="marketing-input-templateDescription"]',
    subjectLine: '[data-testid="marketing-input-subjectLine"]',
    previewText: '[data-testid="marketing-input-templatePreviewText"]',
    htmlContent: '[data-testid="marketing-input-templateHtml"]',
    previewContainer: '[data-testid="marketing-preview-container"]',
    saveBtn: '[data-testid="marketing-button-saveTemplate"]',
    cancelBtn: '[data-testid="marketing-button-cancelTemplate"]',
  },

  // ============================================
  // Delivery Tab
  // ============================================
  delivery: {
    filterByStatus: (key: string) => `[data-testid="delivery-filter-${key}"]`,
    loadMore: '[data-testid="delivery-load-more"]',
  },

  // ============================================
  // Inbox
  // ============================================
  inbox: {
    heading: '[data-testid="marketing-inbox-heading"]',
    accountSelect: '[data-testid="marketing-inbox-select-account"]',
    folderSelect: '[data-testid="marketing-inbox-select-folder"]',
    unreadCheckbox: '[data-testid="marketing-inbox-checkbox-unread"]',
    searchInput: '[data-testid="marketing-inbox-input-search"]',
    syncBtn: '[data-testid="marketing-inbox-button-sync"]',
    composeBtn: '[data-testid="marketing-inbox-button-compose"]',
  },

  // ============================================
  // Compose
  // ============================================
  compose: {
    heading: '[data-testid="marketing-compose-heading"]',
    discardBtn: '[data-testid="marketing-compose-button-discard"]',
    sendBtn: '[data-testid="marketing-compose-button-send"]',
    accountSelect: '[data-testid="marketing-compose-select-account"]',
    toInput: '[data-testid="marketing-compose-input-to"]',
    ccBccBtn: '[data-testid="marketing-compose-button-ccBcc"]',
    ccInput: '[data-testid="marketing-compose-input-cc"]',
    bccInput: '[data-testid="marketing-compose-input-bcc"]',
    subjectInput: '[data-testid="marketing-compose-input-subject"]',
    bodyInput: '[data-testid="marketing-compose-input-body"]',
  },
} as const;

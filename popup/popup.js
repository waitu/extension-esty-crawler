const STORAGE_KEY = "etsyCrawlerConfig";
const DEFAULT_CONFIG = {
  searchTerm: "",
  targetCount: 40,
  includeAds: false,
  mode: "page",
};

const statusNode = document.getElementById("status");
const form = document.getElementById("config-form");
const openPanelBtn = document.getElementById("open-panel");
const startCrawlBtn = document.getElementById("start-crawl");
const openDashboardBtn = document.getElementById("open-dashboard");

init().catch((error) => updateStatus(error.message || String(error)));

async function init() {
  const config = await loadConfig();
  populateForm(config);
  form.addEventListener("submit", onSaveConfig);
  openPanelBtn.addEventListener("click", openPanelOnActiveTab);
  startCrawlBtn.addEventListener("click", quickStartCrawl);
  openDashboardBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
}

async function loadConfig() {
  const stored = await chrome.storage.local.get(STORAGE_KEY).catch(() => ({}));
  return stored[STORAGE_KEY] ? { ...DEFAULT_CONFIG, ...stored[STORAGE_KEY] } : { ...DEFAULT_CONFIG };
}

function populateForm(config) {
  form.searchTerm.value = config.searchTerm || "";
  form.targetCount.value = config.targetCount || DEFAULT_CONFIG.targetCount;
  form.includeAds.checked = Boolean(config.includeAds);
  const mode = config.mode || DEFAULT_CONFIG.mode;
  const radio = form.querySelector(`input[name="mode"][value="${mode}"]`) || form.querySelector('input[name="mode"]');
  if (radio) {
    radio.checked = true;
  }
}

async function onSaveConfig(event) {
  event.preventDefault();
  const config = readFormConfig();
  await chrome.storage.local.set({ [STORAGE_KEY]: config });
  updateStatus("Đã lưu cấu hình.");
}

function readFormConfig() {
  return {
    searchTerm: form.searchTerm.value.trim(),
    targetCount: Math.max(1, parseInt(form.targetCount.value, 10) || DEFAULT_CONFIG.targetCount),
    includeAds: form.includeAds.checked,
    mode: form.querySelector('input[name="mode"]:checked')?.value || DEFAULT_CONFIG.mode,
  };
}

async function openPanelOnActiveTab() {
  const config = readFormConfig();
  await chrome.storage.local.set({ [STORAGE_KEY]: config });
  await withActiveEtsyTab(async (tab) => {
    await sendToTab(tab.id, { type: "merge-config", payload: config });
    await sendToTab(tab.id, { type: "open-panel" });
    updateStatus("Đã mở giao diện trên trang Etsy.");
  });
}

async function quickStartCrawl() {
  const config = readFormConfig();
  await chrome.storage.local.set({ [STORAGE_KEY]: config });
  await withActiveEtsyTab(async (tab) => {
    await sendToTab(tab.id, { type: "merge-config", payload: config });
    await sendToTab(tab.id, { type: "start-crawl" });
    updateStatus("Đang bắt đầu crawl trên tab hiện tại...");
  });
}

async function withActiveEtsyTab(callback) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    updateStatus("Không tìm thấy tab đang mở.");
    return;
  }

  if (!/^https?:\/\/(www\.)?etsy\.com\//i.test(tab.url)) {
    updateStatus("Hãy mở trang tìm kiếm Etsy rồi thử lại.");
    return;
  }

  try {
    await callback(tab);
  } catch (error) {
    updateStatus(error.message || String(error));
  }
}

function updateStatus(message) {
  if (statusNode) {
    statusNode.textContent = message || "";
  }
}

async function sendToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

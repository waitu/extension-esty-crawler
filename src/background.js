const crawlSessions = new Map();

const UPDATE_URL = "http://45.77.247.228/updates.json";
const UPDATE_STORAGE_KEY = "etsyCrawlerUpdateInfo";
const UPDATE_ALARM_NAME = "etsyCrawlerUpdateAlarm";
const UPDATE_INTERVAL_MINUTES = 180; // 3 giờ

function compareSemver(a, b) {
  const normalize = (value) =>
    String(value || "0.0.0")
      .trim()
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);

  const partsA = normalize(a);
  const partsB = normalize(b);
  const length = Math.max(partsA.length, partsB.length);

  for (let index = 0; index < length; index += 1) {
    const valueA = partsA[index] ?? 0;
    const valueB = partsB[index] ?? 0;
    if (valueA > valueB) return 1;
    if (valueA < valueB) return -1;
  }
  return 0;
}

async function fetchLatestUpdateInfo() {
  try {
    const response = await fetch(UPDATE_URL, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Không thể lấy dữ liệu cập nhật (${response.status})`);
    }

    const payload = await response.json();
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest?.version || "0.0.0";
    const latest = payload?.latest || {};

    const hasUpdate = latest.version
      ? compareSemver(latest.version, currentVersion) === 1
      : false;

    const data = {
      checkedAt: new Date().toISOString(),
      currentVersion,
      latestVersion: latest.version || null,
      releaseNotes: latest.releaseNotes || "",
      downloadUrl: latest.url || "",
      sha256: latest.sha256 || "",
      hmac: latest.hmac || "",
      hasUpdate,
      sourceUrl: UPDATE_URL,
    };

    await chrome.storage.local.set({ [UPDATE_STORAGE_KEY]: data });
    return data;
  } catch (error) {
    const fallback = {
      checkedAt: new Date().toISOString(),
      error: error.message || String(error),
    };
    await chrome.storage.local.set({ [UPDATE_STORAGE_KEY]: fallback });
    return fallback;
  }
}

async function getStoredUpdateInfo() {
  const stored = await chrome.storage.local.get(UPDATE_STORAGE_KEY).catch(() => ({}));
  return stored?.[UPDATE_STORAGE_KEY] || null;
}

function scheduleUpdateAlarm() {
  chrome.alarms.create(UPDATE_ALARM_NAME, {
    delayInMinutes: 1,
    periodInMinutes: UPDATE_INTERVAL_MINUTES,
  });
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleUpdateAlarm();
  fetchLatestUpdateInfo().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  scheduleUpdateAlarm();
  fetchLatestUpdateInfo().catch(() => {});
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM_NAME) {
    fetchLatestUpdateInfo().catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "getUpdateInfo" || message?.type === "get-update-info") {
    (async () => {
      const info = await getStoredUpdateInfo();
      sendResponse(info);
    })();
    return true;
  }

  if (message === "forceCheckUpdate" || message?.type === "force-check-update") {
    (async () => {
      const info = await fetchLatestUpdateInfo();
      sendResponse(info);
    })();
    return true;
  }

  if (!message || !message.type) {
    return;
  }

  switch (message.type) {
    case "relay-to-tab": {
      const { tabId, payload } = message;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(tabId, payload);
      }
      break;
    }
    case "fetch-html": {
      handleFetchHtml(message, sendResponse);
      return true; // keep the channel open for async response
    }
    case "crawl-progress": {
      const { crawlId, status } = message;
      if (crawlId) {
        crawlSessions.set(crawlId, status);
      }
      break;
    }
    case "get-crawl-status": {
      const { crawlId } = message;
      sendResponse({ status: crawlSessions.get(crawlId) || null });
      break;
    }
    case "open-dashboard-tab": {
      const targetUrl = message.url || chrome.runtime.getURL("pages/dashboard.html");
      chrome.tabs.create({ url: targetUrl }).catch((error) => {
        console.warn("etsy crawler: không mở được dashboard", error);
      });
      break;
    }
    default:
      break;
  }
});

async function handleFetchHtml(message, sendResponse) {
  const { url, options } = message;
  if (!url) {
    sendResponse({ ok: false, error: "Missing URL" });
    return;
  }

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    const text = await response.text();
    sendResponse({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      text,
    });
  } catch (error) {
    sendResponse({ ok: false, error: error.message || String(error) });
  }
}

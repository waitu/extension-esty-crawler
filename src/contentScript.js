(() => {
  const PANEL_ID = "etsy-crawl-control-panel";
  const STORAGE_KEY = "etsyCrawlerConfig";
  const HISTORY_KEY = "etsyCrawlerHistory";
  const DEFAULT_CONFIG = {
    targetCount: 40,
    searchTerm: "",
    mode: "page",
    autoOpen: true,
    includeAds: false,
  };

  const DATA_HEADERS = [
    "id",
    "link",
    "product name",
    "description",
    "image",
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
    "image7",
    "image8",
    "image9",
    "price",
    "rating",
  ];

  const DATA_FIELD_KEYS = [
    "id",
    "link",
    "productName",
    "description",
    "image",
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
    "image7",
    "image8",
    "image9",
    "price",
    "rating",
  ];

  let panelRoot = null;
  let state = {
    isPanelOpen: false,
    isCrawling: false,
    crawlId: null,
    collected: [],
  };

  const QUICK_ADD_CLASS = "ec-quick-add";
  const QUICK_ADD_CONTAINER_CLASS = "ec-quick-add-container";
  const MAX_HISTORY = 2000;
  const MAX_IMAGES = 10;

  let quickAddObserver = null;
  let quickAddPending = false;
  let knownHistoryIds = new Set();
  let locationWatcherInitialized = false;
  let lastKnownUrl = window.location.href;

  const domReady = new Promise((resolve) => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", resolve, { once: true });
      window.addEventListener("load", resolve, { once: true });
    }
  });

  async function init() {
    await domReady;
    await loadHistoryIndex();
    await ensurePanel();

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    chrome.storage.onChanged.addListener(handleStorageUpdate);

    const config = getConfigSync();
    initQuickAddEnhancements();
    startLocationWatcher();
    if (config.autoOpen && isEtsyListingPage()) {
      openPanel();
    }
  }

  function getConfigSync() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_CONFIG };
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch (error) {
      console.warn("etsy crawler: failed to parse stored config", error);
      return { ...DEFAULT_CONFIG };
    }
  }

  function persistConfig(config) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (_) {
      // ignore quota errors in localStorage
    }
    chrome.storage.local.set({ [STORAGE_KEY]: config }).catch(() => {});
  }

  function getSearchTermFromLocation() {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("q") || url.searchParams.get("search_query") || "";
    } catch (_) {
      return "";
    }
  }

  function startLocationWatcher() {
    if (locationWatcherInitialized) return;
    locationWatcherInitialized = true;

    const notify = () => {
      const current = window.location.href;
      if (current === lastKnownUrl) return;
      lastKnownUrl = current;
      handleLocationChange();
    };

    const wrapHistory = (methodName) => {
      const original = history[methodName];
      if (typeof original !== "function") return;
      history[methodName] = function wrappedHistoryMethod(...args) {
        const result = original.apply(this, args);
        setTimeout(notify, 0);
        return result;
      };
    };

    wrapHistory("pushState");
    wrapHistory("replaceState");
    window.addEventListener("popstate", () => setTimeout(notify, 0));
    window.addEventListener("hashchange", () => setTimeout(notify, 0));
  }

  function handleLocationChange() {
    requestAnimationFrame(() => {
      injectQuickAddButtons();
      refreshQuickAddButtonsState();
      if (panelRoot && panelRoot.isConnected) {
        const config = getConfigSync();
        if (config.autoOpen && isEtsyListingPage()) {
          openPanel();
        }
      }
    });
  }

  async function ensurePanel() {
    if (document.getElementById(PANEL_ID)) {
      panelRoot = document.getElementById(PANEL_ID);
      return;
    }

    const container = document.createElement("div");
    container.id = PANEL_ID;
    container.className = "etsy-crawl-panel";

    container.innerHTML = `
      <div class="ec-header">
        <div class="ec-title">Etsy Crawler</div>
        <div class="ec-actions">
          <button class="ec-btn ec-btn-link" data-ec="minimize" title="Ẩn/Hiện">−</button>
          <button class="ec-btn ec-btn-link" data-ec="close" title="Đóng">✕</button>
        </div>
      </div>
      <div class="ec-body">
        <div class="ec-field">
          <label>Từ khóa tìm kiếm</label>
          <input type="text" data-ec="search-term" placeholder="Ví dụ: t shirt"/>
        </div>
        <div class="ec-field ec-field-inline">
          <label>Số sản phẩm cần lấy</label>
          <input type="number" data-ec="target-count" min="1" max="1000" step="1"/>
        </div>
        <div class="ec-checkbox">
          <label>
            <input type="checkbox" data-ec="include-ads"/>
            Bao gồm cả quảng cáo (Ads)
          </label>
        </div>
        <div class="ec-modes">
          <label class="ec-radio">
            <input type="radio" name="ec-mode" value="page"/> Lấy tất cả sản phẩm đang hiển thị (1 trang)
          </label>
          <label class="ec-radio">
            <input type="radio" name="ec-mode" value="pagination"/> Lấy và tự động qua trang kế tiếp
          </label>
        </div>
        <div class="ec-buttons ec-buttons-stack">
          <button class="ec-btn ec-btn-primary" data-ec="start-page">Crawl trang tìm kiếm</button>
          <button class="ec-btn" data-ec="export">Tải CSV</button>
          <button class="ec-btn ec-btn-ghost" data-ec="open-dashboard">Mở trang quản lý</button>
        </div>
        <div class="ec-status" data-ec="status">
          Sẵn sàng.
        </div>
        <div class="ec-progress" data-ec="progress-wrapper" hidden>
          <div class="ec-progress-bar" data-ec="progress-bar"></div>
          <div class="ec-progress-caption" data-ec="progress-caption"></div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    panelRoot = container;
    wirePanel();
    await loadConfigIntoPanel();
  }

  function wirePanel() {
    if (!panelRoot) return;
    const minimizeBtn = panelRoot.querySelector('[data-ec="minimize"]');
    const closeBtn = panelRoot.querySelector('[data-ec="close"]');
    const startPageBtn = panelRoot.querySelector('[data-ec="start-page"]');
    const exportBtn = panelRoot.querySelector('[data-ec="export"]');
    const dashboardBtn = panelRoot.querySelector('[data-ec="open-dashboard"]');
    const inputs = panelRoot.querySelectorAll('input[data-ec], textarea[data-ec]');

    minimizeBtn?.addEventListener("click", togglePanelBody);
    closeBtn?.addEventListener("click", closePanel);
    startPageBtn?.addEventListener("click", onStartPageCrawl);
    exportBtn?.addEventListener("click", downloadCurrentCsv);
    dashboardBtn?.addEventListener("click", openDashboardPage);

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        savePanelConfig();
      });
    });

    const radios = panelRoot.querySelectorAll('input[name="ec-mode"]');
    radios.forEach((radio) => {
      radio.addEventListener("change", savePanelConfig);
    });

    setupDrag(panelRoot.querySelector(".ec-header"));
  }

  function togglePanelBody() {
    const body = panelRoot.querySelector(".ec-body");
    body.classList.toggle("ec-body-hidden");
  }

  function closePanel() {
    panelRoot.remove();
    panelRoot = null;
    state.isPanelOpen = false;
  }

  function openPanel() {
    if (!panelRoot) return;
    const body = panelRoot.querySelector(".ec-body");
    body.classList.remove("ec-body-hidden");
    panelRoot.style.display = "";
    state.isPanelOpen = true;
  }

  async function loadConfigIntoPanel() {
    const stored = await chrome.storage.local.get(STORAGE_KEY).catch(() => ({}));
    const config = stored[STORAGE_KEY] ? { ...DEFAULT_CONFIG, ...stored[STORAGE_KEY] } : getConfigSync();
    applyConfigToPanel(config);
  }

  function savePanelConfig() {
    if (!panelRoot) return;

    const config = {
      ...DEFAULT_CONFIG,
      ...getConfigSync(),
      searchTerm: panelRoot.querySelector('[data-ec="search-term"]').value.trim(),
      targetCount: Math.max(1, parseInt(panelRoot.querySelector('[data-ec="target-count"]').value, 10) || DEFAULT_CONFIG.targetCount),
      includeAds: panelRoot.querySelector('[data-ec="include-ads"]').checked,
      mode: panelRoot.querySelector('input[name="ec-mode"]:checked')?.value || "page",
    };

    persistConfig(config);
    return config;
  }

  function applyConfigToPanel(partialConfig = {}) {
    if (!panelRoot) return;

    const merged = {
      ...DEFAULT_CONFIG,
      ...getConfigSync(),
      ...partialConfig,
    };

    if (!merged.searchTerm) {
      merged.searchTerm = getSearchTermFromLocation();
    }

    const inputs = {
      searchTerm: panelRoot.querySelector('[data-ec="search-term"]'),
      targetCount: panelRoot.querySelector('[data-ec="target-count"]'),
      includeAds: panelRoot.querySelector('[data-ec="include-ads"]'),
    };

    if (inputs.searchTerm) inputs.searchTerm.value = merged.searchTerm;
    if (inputs.targetCount) inputs.targetCount.value = merged.targetCount;
    if (inputs.includeAds) inputs.includeAds.checked = Boolean(merged.includeAds);

    const modeInput = panelRoot.querySelector(`input[name="ec-mode"][value="${merged.mode}"]`);
    if (modeInput) {
      modeInput.checked = true;
    }

    persistConfig(merged);
  }

  function updateStatus(text) {
    const statusNode = panelRoot?.querySelector('[data-ec="status"]');
    if (statusNode) {
      statusNode.textContent = text;
    }
  }

  function updateProgress({ current = 0, total = 0, message = "" }) {
    const wrapper = panelRoot?.querySelector('[data-ec="progress-wrapper"]');
    const bar = panelRoot?.querySelector('[data-ec="progress-bar"]');
    const caption = panelRoot?.querySelector('[data-ec="progress-caption"]');

    if (!wrapper || !bar || !caption) {
      return;
    }

    if (total <= 0) {
      wrapper.hidden = true;
      bar.style.width = "0%";
      caption.textContent = "";
      return;
    }

    const percent = Math.min(100, Math.round((current / total) * 100));
    wrapper.hidden = false;
    bar.style.width = `${percent}%`;
    caption.textContent = `${current}/${total} ${message}`.trim();
  }

  function handleRuntimeMessage(message, sender, sendResponse) {
    if (!message || !message.type) return;
    if (message.type === "open-panel") {
      ensurePanel().then(openPanel);
    } else if (message.type === "get-cache") {
      sendResponse({ data: state.collected });
    } else if (message.type === "start-crawl") {
      ensurePanel().then(() => {
        openPanel();
        onStartPageCrawl();
      });
    } else if (message.type === "merge-config") {
      ensurePanel().then(() => {
        applyConfigToPanel(message.payload || {});
        openPanel();
      });
    }
  }

  function openDashboardPage() {
    const url = chrome.runtime.getURL("pages/dashboard.html");
    chrome.runtime
      .sendMessage({ type: "open-dashboard-tab", url })
      .catch((error) => {
        console.warn("etsy crawler: mở qua background thất bại, fallback", error);
        try {
          window.open(url, "_blank", "noopener");
        } catch (fallbackError) {
          console.error("etsy crawler: không mở được trang quản lý", fallbackError);
        }
      });
  }

  async function onStartPageCrawl() {
    if (state.isCrawling) {
      updateStatus("Đang crawl, vui lòng chờ...");
      return;
    }

    const config = savePanelConfig();
    state.isCrawling = true;
    state.collected = [];
    state.crawlId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    updateStatus("Chuẩn bị crawl trang tìm kiếm...");
    updateProgress({ current: 0, total: config.targetCount, message: "đang chuẩn bị" });

    const normalizedKeyword = (config.searchTerm || "").trim().toLowerCase();

    try {
      const listings = await collectListings(config);
      if (!listings.length) {
        updateStatus("Không tìm thấy sản phẩm phù hợp.");
        updateProgress({ current: 0, total: 0 });
        return;
      }

      updateStatus(`Đã tìm thấy ${listings.length} link, đang lấy chi tiết...`);

      const details = await fetchListingDetails(
        listings,
        listings.length,
        (current, total) => {
          updateProgress({ current, total: total || listings.length, message: "đang lấy chi tiết" });
        }
      );

      const filtered = !normalizedKeyword
        ? details
        : details.filter((item) => {
            const description = (item.description || "").toLowerCase();
            return description.includes(normalizedKeyword);
          });

      if (!filtered.length) {
        updateStatus("Không tìm thấy sản phẩm nào phù hợp với mô tả chứa từ khóa.");
        updateProgress({ current: 0, total: 0 });
        state.collected = [];
        return;
      }

      const limited = filtered.slice(0, config.targetCount);
      state.collected = limited;

      updateProgress({
        current: limited.length,
        total: config.targetCount,
        message: "đã lấy chi tiết",
      });

      const { added } = await appendToHistory(limited);
      const baseMessage = added
        ? `Đã lấy ${limited.length} sản phẩm (thêm ${added} mới vào lịch sử).`
        : `Đã lấy ${limited.length} sản phẩm.`;
      const finalMessage = normalizedKeyword
        ? `${baseMessage} Đã lọc ${filtered.length}/${listings.length} sản phẩm chứa "${config.searchTerm}" trong mô tả.`
        : baseMessage;
      updateStatus(finalMessage);
    } catch (error) {
      console.error("etsy crawler: crawl thất bại", error);
      updateStatus(`Có lỗi xảy ra: ${error.message || error}`);
      updateProgress({ current: 0, total: 0 });
    } finally {
      state.isCrawling = false;
    }
  }

  async function collectListings(config) {
    const listings = [];
    const seenIds = new Set();

    const normalizedTerm = (config.searchTerm || "").trim().toLowerCase();
    const currentUrl = safeNewURL(window.location.href);
    const currentTerm = (getSearchTermFromLocation() || "").trim().toLowerCase();
    const context = resolveListingPageContext(config, currentUrl, normalizedTerm, currentTerm);

    if (!context) {
      updateStatus("Trang này chưa được hỗ trợ để crawl tự động.");
      return listings;
    }

    let page = context.canUseDom ? context.currentPage : 1;
    let domConsumed = false;

    const requiresDescriptionFilter = normalizedTerm.length > 0;
    const usesSinglePageMode = config.mode === "page";
    const desiredListingBuffer = usesSinglePageMode
      ? Number.POSITIVE_INFINITY
      : Math.max(config.targetCount, requiresDescriptionFilter ? config.targetCount * 3 : config.targetCount);

    while (listings.length < desiredListingBuffer) {
      let pageHtml = "";
      let pageUrl = context.buildPageUrl(page);

      const shouldUseDom = context.canUseDom && !domConsumed && page === context.currentPage;
      if (shouldUseDom) {
        await scrollPageToLoadAll();
        pageHtml = document.documentElement.outerHTML;
        pageUrl = currentUrl?.href || pageUrl;
        domConsumed = true;
      } else {
        const response = await fetchHtml(pageUrl);
        if (!response.ok) {
          updateStatus(`Không thể tải trang ${page}: ${response.statusText}`);
          break;
        }
        pageHtml = response.text;
        pageUrl = response.url || pageUrl;
      }

      const pageListings = parseSearchPage(pageHtml, pageUrl, {
        includeAds: config.includeAds,
      });

      const fresh = pageListings.filter((item) => {
        if (!item.id || seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });

      const previousCount = listings.length;
      listings.push(...fresh);
      updateStatus(`Trang ${page}: thêm ${fresh.length} sản phẩm (tổng ${listings.length}).`);

      const nextAvailable = hasNextPage(pageHtml);

      if (config.mode === "page") {
        break;
      }

      if (listings.length >= desiredListingBuffer) {
        break;
      }

      if (fresh.length === 0 && previousCount === listings.length) {
        if (!nextAvailable) {
          break;
        }
      }

      if (!nextAvailable) {
        break;
      }

      if (page > 100) {
        break;
      }

      page += 1;
    }

    return listings;
  }

  async function fetchListingDetails(listings, maxCount = listings.length, onProgress) {
    const concurrency = 4;
    let current = 0;
    const total = Math.min(maxCount, listings.length);
    const results = new Array(total);

    async function worker(startIndex) {
      for (let i = startIndex; i < total; i += concurrency) {
        const listing = listings[i];
        try {
          const detail = await crawlListingDetail(listing.url, listing.id);
          results[i] = detail;
        } catch (error) {
          console.error("crawl detail failed", listing.url, error);
          results[i] = null;
        }
        current += 1;
        onProgress?.(current, total);
      }
    }

    const workers = Array.from({ length: concurrency }, (_, index) => worker(index));
    await Promise.all(workers);
    return results.filter(Boolean);
  }

  async function crawlListingDetail(url, fallbackId) {
    const response = await fetchHtml(url);
    if (!response.ok) {
      throw new Error(`Fetch detail lỗi (${response.status})`);
    }
    return parseListingDetail(response.text, response.url || url, fallbackId);
  }

  function parseSearchPage(html, pageUrl, options = {}) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const anchors = Array.from(doc.querySelectorAll("a.listing-link[data-listing-id]"));
    const includeAds = Boolean(options.includeAds);

    return anchors
      .filter((anchor) => {
        if (includeAds) return true;
        const adBadge = anchor.closest("li")?.querySelector('[data-ad-perspective], .ad-indicator, .wt-screen-reader-only span[aria-hidden="true"]');
        const isAd = anchor.innerText.toLowerCase().includes("ad by") || Boolean(adBadge);
        return !isAd;
      })
      .map((anchor) => {
        const id = anchor.getAttribute("data-listing-id") || extractListingId(anchor.href);
        const image = anchor.querySelector("img");
        return {
          id,
          url: normalizeUrl(new URL(anchor.href, pageUrl).href),
          title: (image?.alt || anchor.textContent || "").trim(),
        };
      })
      .filter((item) => Boolean(item.id && item.url));
  }

  function hasNextPage(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    const isDisabled = (node) => {
      if (!node) return false;
      const attr = node.getAttribute("aria-disabled");
      return (
        attr === "true" ||
        node.hasAttribute("disabled") ||
        node.classList.contains("wt-is-disabled") ||
        node.classList.contains("disabled")
      );
    };

    const directSelectors = [
      'a[aria-label*="Next" i]',
      'a[data-pagenum][rel="next"]',
      'nav a[rel="next"]',
      'button[aria-label*="Next" i]'
    ];

    for (const selector of directSelectors) {
      const candidate = doc.querySelector(selector);
      if (candidate && !isDisabled(candidate)) {
        return true;
      }
    }

    const navs = doc.querySelectorAll('nav[data-clg-id="WtPagination"], nav[aria-label*="Pagination" i], nav[aria-label*="Page" i]');
    for (const nav of navs) {
      const buttons = Array.from(nav.querySelectorAll("a, button"));
      const next = buttons.find((node) => /\bnext\b/i.test(node.textContent || ""));
      if (next && !isDisabled(next)) {
        return true;
      }
    }

    return false;
  }

  function parseListingDetail(html, url, fallbackId) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const ldProduct = extractProductJson(doc);

    const id = extractListingId(url) || fallbackId || ldProduct?.sku || "";
    const productName = (ldProduct?.name || doc.querySelector('h1[data-buy-box-listing-title], h1[itemprop="name"]')?.textContent || "").trim();
    const description = sanitizeText(
      ldProduct?.description ||
        doc.querySelector('[data-id="description-text"], [data-product-description]')?.textContent ||
        ""
    );

    const ldImages = Array.isArray(ldProduct?.image)
      ? ldProduct.image
      : ldProduct?.image
        ? [ldProduct.image]
        : [];

    const imageCandidates = [...ldImages, ...extractDomImageCandidates(doc)];

    const normalizedImages = imageCandidates
      .map((candidate) => normalizeImageUrl(candidate))
      .filter((url) => typeof url === "string" && url.length > 0);

    const images = dedupeImageVariants(normalizedImages).slice(0, MAX_IMAGES);

    const price = extractPrice(ldProduct, doc);
    const rating = extractRating(ldProduct, doc);

    const detail = {
      id,
      link: normalizeUrl(url),
      productName,
      description,
      price,
      rating,
    };

    images.forEach((imgUrl, index) => {
      const key = index === 0 ? "image" : `image${index}`;
      detail[key] = imgUrl;
    });

    return detail;
  }

  function extractDomImageCandidates(doc) {
    const nodes = doc.querySelectorAll(
      "[data-carousel-pane] img, img[data-index], [data-listing-image]"
    );

    const candidates = [];

    nodes.forEach((img) => {
      const attrs = [
        img.getAttribute("data-src-zoom-image"),
        img.getAttribute("data-full-image-href"),
        img.getAttribute("data-zoom-image"),
        img.getAttribute("data-href"),
        img.getAttribute("data-large-image"),
        img.dataset?.fullsizeImageUrl,
        img.dataset?.zoomImage,
        img.dataset?.srcset,
        img.getAttribute("data-srcset"),
        img.getAttribute("srcset"),
        img.getAttribute("src"),
      ];

      attrs.forEach((value) => {
        if (!value) return;
        if (value.includes(",")) {
          value.split(",").forEach((part) => {
            const candidate = part.trim().split(/\s+/)[0];
            if (candidate) {
              candidates.push(candidate);
            }
          });
        } else {
          candidates.push(value);
        }
      });
    });

    return candidates;
  }

  function dedupeImageVariants(urls) {
    const groups = new Map();

    urls.forEach((url) => {
      const key = imageVariantKey(url);
      const score = imageVariantScore(url);
      const existing = groups.get(key);
      if (!existing || score > existing.score) {
        groups.set(key, { url, score });
      }
    });

    return Array.from(groups.values(), (entry) => entry.url);
  }

  function imageVariantKey(url) {
    try {
      const fileName = new URL(url).pathname.split("/").pop() || url;
      const parts = fileName.split(".");
      if (parts.length >= 3 && parts[0].startsWith("il_")) {
        return `${parts[1]}.${parts.slice(2).join(".")}`;
      }
      return fileName;
    } catch (_) {
      const fallback = url.split("/").pop() || url;
      return fallback;
    }
  }

  function imageVariantScore(url) {
    if (/il_fullxfull/i.test(url)) return 3;
    if (/full/i.test(url)) return 2;
    if (/il_\d+x\d+/i.test(url)) return 1;
    return 0;
  }

  function extractProductJson(doc) {
    const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent.trim());
        if (Array.isArray(json)) {
          const product = json.find((item) => item && (item["@type"] === "Product" || item["@type"]?.includes("Product")));
          if (product) return product;
        } else if (json && (json["@type"] === "Product" || json["@type"]?.includes("Product"))) {
          return json;
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  function extractPrice(productJson, doc) {
    const offer = Array.isArray(productJson?.offers) ? productJson.offers[0] : productJson?.offers;
    if (offer?.price) {
      return `${offer.price} ${offer.priceCurrency || ""}`.trim();
    }
    const priceNode = doc.querySelector('[data-buy-box-region="price"] [data-buy-box-price], [data-buy-box-price], .wt-text-title-03')?.textContent;
    return sanitizeText(priceNode);
  }

  function extractRating(productJson, doc) {
    if (productJson?.aggregateRating?.ratingValue) {
      return String(productJson.aggregateRating.ratingValue);
    }
    const ratingNode = doc.querySelector('[data-average-rating], .wt-rating-stars__rating, [data-review-star-rating]');
    if (ratingNode?.textContent) {
      return ratingNode.textContent.trim();
    }
    return "";
  }

  async function fetchHtml(url) {
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        text,
        url: response.url,
      };
    } catch (error) {
      console.warn("direct fetch failed, fallback to background", error);
      return chrome.runtime.sendMessage({ type: "fetch-html", url }).then((result) => {
        if (!result || !result.ok) {
          throw new Error(result?.error || "Không thể tải dữ liệu.");
        }
        return result;
      });
    }
  }

  function sanitizeText(value) {
    if (!value) return "";
    return value.replace(/\s+/g, " ").replace(/\u00A0/g, " ").trim();
  }

  function normalizeUrl(url) {
    try {
      const u = new URL(url);
      u.hash = "";
      return u.toString();
    } catch (_) {
      return url;
    }
  }

  function normalizeImageUrl(source) {
    const url = extractUrlString(source);
    if (!url) return "";
    if (url.startsWith("//")) {
      return `https:${url}`;
    }
    if (!/^https?:/i.test(url)) {
      try {
        return new URL(url, "https://www.etsy.com").href;
      } catch (_) {
        return url;
      }
    }
    return url;
  }

  function extractUrlString(value) {
    if (!value) return "";
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (trimmed.includes(",") && trimmed.includes("http")) {
        const parts = trimmed.split(",").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
        return parts.pop() || parts[0] || "";
      }
      return trimmed;
    }
    if (value instanceof URL) return value.toString();
    if (Array.isArray(value)) {
      for (const entry of value) {
        const extracted = extractUrlString(entry);
        if (extracted) return extracted;
      }
      return "";
    }
    if (typeof value === "object") {
      const candidates = [
        value.url,
        value.href,
        value.src,
        value.contentUrl,
        value.imageUrl,
        value.original,
        value.originalUrl,
        value.fullsize,
        value.fullsizeUrl,
        value.mainImageUrl,
        value.data,
        value["@id"],
      ];

      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }

      if (typeof value.toString === "function" && value.toString !== Object.prototype.toString) {
        const stringified = value.toString();
        if (/^https?:/i.test(stringified)) {
          return stringified;
        }
      }
    }
    return "";
  }

  function safeNewURL(value) {
    try {
      return new URL(value);
    } catch (_) {
      return null;
    }
  }

  function extractListingId(url) {
    if (!url) return "";
    const match = url.match(/listing\/(\d+)/);
    if (match) return match[1];
    const query = new URLSearchParams(url.split("?")[1] || "");
    return query.get("listing_id") || "";
  }

  function resolveBaseSearchUrl(config, currentUrl) {
    const base = currentUrl && isEtsySearchPath(currentUrl.pathname)
      ? new URL(currentUrl.toString())
      : new URL("https://www.etsy.com/search");

    base.searchParams.delete("page");
    const term = (config.searchTerm || "").trim();
    if (term) {
      if (base.searchParams.has("search_query")) {
        base.searchParams.set("search_query", term);
      }
      base.searchParams.set("q", term);
    }
    return base;
  }

  function buildSearchPageUrl(baseUrl, term, page = 1) {
    const url = new URL(baseUrl.toString());
    const trimmed = (term || "").trim();
    if (trimmed) {
      if (url.searchParams.has("search_query")) {
        url.searchParams.set("search_query", trimmed);
      }
      url.searchParams.set("q", trimmed);
    }
    if (page > 1) {
      url.searchParams.set("page", String(page));
    } else {
      url.searchParams.delete("page");
    }
    return url.toString();
  }

  function resolveBaseShopUrl(currentUrl) {
    if (currentUrl && isEtsyShopPath(currentUrl.pathname)) {
      const base = new URL(currentUrl.toString());
      base.searchParams.delete("page");
      return base;
    }
    return null;
  }

  function buildShopPageUrl(baseUrl, page = 1) {
    if (!baseUrl) return "";
    const url = new URL(baseUrl.toString());
    if (page > 1) {
      url.searchParams.set("page", String(page));
    } else {
      url.searchParams.delete("page");
    }
    return url.toString();
  }

  function resolveListingPageContext(config, currentUrl, normalizedTerm, currentTerm) {
    const isSearchPage = currentUrl && isEtsySearchPath(currentUrl.pathname);
    const isShopPage = currentUrl && isEtsyShopPath(currentUrl.pathname);

    if (isSearchPage) {
      const baseUrl = resolveBaseSearchUrl(config, currentUrl);
      const currentPage = getPageNumber(currentUrl);
      const canUseDom = config.mode === "page" ? true : normalizedTerm === currentTerm;
      return {
        type: "search",
        currentPage,
        canUseDom,
        buildPageUrl: (page) => buildSearchPageUrl(baseUrl, config.searchTerm, page),
      };
    }

    if (isShopPage) {
      const baseUrl = resolveBaseShopUrl(currentUrl) || (currentUrl ? new URL(currentUrl.toString()) : null);
      const currentPage = getPageNumber(currentUrl);
      return {
        type: "shop",
        currentPage,
        canUseDom: true,
        buildPageUrl: (page) => buildShopPageUrl(baseUrl, page),
      };
    }

    const baseUrl = resolveBaseSearchUrl(config, undefined);
    return {
      type: "search",
      currentPage: 1,
      canUseDom: false,
      buildPageUrl: (page) => buildSearchPageUrl(baseUrl, config.searchTerm, page),
    };
  }

  function getPageNumber(url) {
    if (!url) return 1;
    const page = parseInt(url.searchParams.get("page"), 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
  }

  async function scrollPageToLoadAll() {
    const maxTries = 12;
    let prevHeight = 0;
    for (let i = 0; i < maxTries; i += 1) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      await wait(1200);
      const newHeight = document.body.scrollHeight;
      if (newHeight <= prevHeight + 50) {
        break;
      }
      prevHeight = newHeight;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isEtsySearchPath(pathname = "") {
    return /\/search/.test(pathname);
  }

  function isEtsyShopPath(pathname = "") {
    return /^\/shop\/[^/]+/i.test(pathname);
  }

  function isEtsySearchPage() {
    return isEtsySearchPath(window.location.pathname);
  }

  function isEtsyShopPage() {
    return isEtsyShopPath(window.location.pathname);
  }

  function isEtsyListingPage() {
    return isEtsySearchPage() || isEtsyShopPage();
  }

  function getCurrentListingPageType() {
    if (isEtsySearchPage()) return "search";
    if (isEtsyShopPage()) return "shop";
    return "other";
  }

  async function appendToHistory(items) {
    if (!Array.isArray(items) || !items.length) {
      return { added: 0, total: knownHistoryIds.size };
    }

    try {
      const stored = await chrome.storage.local.get(HISTORY_KEY).catch(() => ({}));
      const history = Array.isArray(stored[HISTORY_KEY]) ? stored[HISTORY_KEY] : [];
      const timestamp = new Date().toISOString();
      const enriched = items.map((item) => ({
        ...item,
        crawledAt: item.crawledAt || timestamp,
      }));

      const { merged, added } = mergeHistory(history, enriched);
      const trimmed = merged.length > MAX_HISTORY ? merged.slice(merged.length - MAX_HISTORY) : merged;
      await chrome.storage.local.set({ [HISTORY_KEY]: trimmed });
      updateKnownHistoryIds(trimmed);
      return { added, total: trimmed.length };
    } catch (error) {
      console.warn("etsy crawler: không lưu được lịch sử", error);
      return { added: 0, total: knownHistoryIds.size };
    }
  }

  async function loadHistoryIndex() {
    try {
      const stored = await chrome.storage.local.get(HISTORY_KEY).catch(() => ({}));
      const history = Array.isArray(stored[HISTORY_KEY]) ? stored[HISTORY_KEY] : [];
      updateKnownHistoryIds(history);
    } catch (error) {
      console.warn("etsy crawler: không tải được lịch sử", error);
      knownHistoryIds = new Set();
    }
  }

  function updateKnownHistoryIds(items) {
    const next = new Set();
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const key = historyKey(item);
        if (key) {
          next.add(key);
        }
      });
    }
    knownHistoryIds = next;
    refreshQuickAddButtonsState();
  }

  function mergeHistory(existing, incoming) {
    const keyToIndex = new Map();
    const merged = Array.isArray(existing) ? [...existing] : [];

    merged.forEach((item, index) => {
      const key = historyKey(item);
      if (key) {
        keyToIndex.set(key, index);
      }
    });

    let added = 0;
    incoming.forEach((item) => {
      const key = historyKey(item);
      if (key && keyToIndex.has(key)) {
        merged[keyToIndex.get(key)] = item;
      } else {
        merged.push(item);
        if (key) {
          keyToIndex.set(key, merged.length - 1);
        }
        added += 1;
      }
    });

    return { merged, added };
  }

  function historyKey(item) {
    if (!item) return "";
    if (item.id) return `id:${item.id}`;
    if (item.link) return `link:${normalizeUrl(item.link)}`;
    return "";
  }

  function handleStorageUpdate(changes, area) {
    if (area !== "local" || !changes[HISTORY_KEY]) {
      return;
    }
    const next = Array.isArray(changes[HISTORY_KEY].newValue) ? changes[HISTORY_KEY].newValue : [];
    updateKnownHistoryIds(next);
  }

  function initQuickAddEnhancements() {
    injectQuickAddButtons();
    if (quickAddObserver) {
      quickAddObserver.disconnect();
    }
    quickAddObserver = new MutationObserver(() => {
      if (quickAddPending) return;
      quickAddPending = true;
      requestAnimationFrame(() => {
        quickAddPending = false;
        injectQuickAddButtons();
      });
    });
    quickAddObserver.observe(document.body, { childList: true, subtree: true });
  }

  function injectQuickAddButtons() {
    const anchors = document.querySelectorAll("a[data-listing-id]");
    anchors.forEach((anchor) => {
      let card = anchor.closest("[data-search-results] li, [data-search-results-container] li, [data-listing-card], li, article, .wt-list-unstyled > li, .listing-card, .responsive-listing-grid__item") || anchor.parentElement;
      if (!card) return;

      if (card === anchor) {
        card = anchor.parentElement;
      }
      if (!card) return;

      if (card.querySelector(`.${QUICK_ADD_CONTAINER_CLASS}`)) return;

      const listingId = anchor.getAttribute("data-listing-id") || extractListingId(anchor.href);
      const listingUrl = normalizeUrl(anchor.href);
      if (!listingUrl) return;

      const container = document.createElement("div");
      container.className = QUICK_ADD_CONTAINER_CLASS;

      const button = document.createElement("button");
      button.type = "button";
      button.className = QUICK_ADD_CLASS;
      button.dataset.listingId = listingId || "";
      button.dataset.listingUrl = listingUrl;
      button.addEventListener("click", onQuickAddButtonClick);

      const saved = isListingSaved(listingId, listingUrl);
      setQuickAddButtonState(button, saved ? "saved" : "default");

      container.appendChild(button);
      if (card.firstChild) {
        card.insertBefore(container, card.firstChild);
      } else {
        card.appendChild(container);
      }
    });
  }

  async function onQuickAddButtonClick(event) {
    const button = event.currentTarget;
    if (!button || button.dataset.state === "loading") {
      return;
    }

    const listingId = button.dataset.listingId || "";
    const listingUrl = button.dataset.listingUrl;
    if (!listingUrl) {
      return;
    }

    if (isListingSaved(listingId, listingUrl)) {
      setQuickAddButtonState(button, "saved");
      updateStatus("Sản phẩm đã có trong lịch sử.");
      return;
    }

    setQuickAddButtonState(button, "loading");
    try {
      const detail = await crawlListingDetail(listingUrl, listingId);
      const result = await appendToHistory([detail]);
      if (result.added === 0) {
        setQuickAddButtonState(button, "saved");
        updateStatus("Sản phẩm đã tồn tại trong lịch sử.");
      } else {
        const key = historyKey(detail);
        if (key) {
          knownHistoryIds.add(key);
        }
        setQuickAddButtonState(button, "saved");
        updateStatus(`Đã thêm ${detail.productName || detail.id || "sản phẩm"} vào lịch sử.`);
      }
    } catch (error) {
      console.error("etsy crawler: quick add failed", error);
      setQuickAddButtonState(button, "error");
      updateStatus(`Không thể thêm sản phẩm: ${error.message || error}`);
    }
  }

  function setQuickAddButtonState(button, state) {
    button.dataset.state = state;
    button.classList.remove(
      `${QUICK_ADD_CLASS}--loading`,
      `${QUICK_ADD_CLASS}--saved`,
      `${QUICK_ADD_CLASS}--error`
    );

    switch (state) {
      case "loading":
        button.disabled = true;
        button.classList.add(`${QUICK_ADD_CLASS}--loading`);
        button.textContent = "Đang lưu...";
        break;
      case "saved":
        button.disabled = true;
        button.classList.add(`${QUICK_ADD_CLASS}--saved`);
        button.textContent = "Đã lưu";
        break;
      case "error":
        button.disabled = false;
        button.classList.add(`${QUICK_ADD_CLASS}--error`);
        button.textContent = "Thử lại";
        setTimeout(() => {
          if (button.dataset.state === "error") {
            setQuickAddButtonState(button, isListingSaved(button.dataset.listingId, button.dataset.listingUrl) ? "saved" : "default");
          }
        }, 3000);
        break;
      default:
        button.disabled = false;
        button.textContent = "Lưu sản phẩm";
        break;
    }
  }

  function isListingSaved(id, url) {
    const key = historyKey({ id, link: url });
    return key ? knownHistoryIds.has(key) : false;
  }

  function refreshQuickAddButtonsState() {
    const buttons = document.querySelectorAll(`.${QUICK_ADD_CLASS}`);
    buttons.forEach((button) => {
      if (button.dataset.state === "loading") {
        return;
      }
      const saved = isListingSaved(button.dataset.listingId, button.dataset.listingUrl);
      setQuickAddButtonState(button, saved ? "saved" : "default");
    });
  }

  function downloadCurrentCsv(options = {}) {
    const { silent = false } = options;
    if (!state.collected.length) {
      if (!silent) {
        updateStatus("Chưa có dữ liệu để xuất CSV.");
      }
      return;
    }

    const rows = state.collected.map((item) => DATA_FIELD_KEYS.map((key) => item[key] || ""));
    const csvLines = [DATA_HEADERS.join(",")].concat(rows.map((row) => row.map(escapeCsvField).join(",")));
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `etsy-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (!silent) {
      updateStatus("Đã tải CSV.");
    }
  }

  function escapeCsvField(value) {
    const stringValue = String(value || "");
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  function setupDrag(handle) {
    if (!handle || !panelRoot) return;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.style.cursor = "move";

    handle.addEventListener("mousedown", (event) => {
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      const rect = panelRoot.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(event) {
      if (!isDragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      panelRoot.style.left = `${startLeft + dx}px`;
      panelRoot.style.top = `${startTop + dy}px`;
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  }

  init().catch((error) => console.error("Etsy crawler init failed", error));
})();

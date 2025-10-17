import {
  fetchExportProfiles,
  fetchExportProfileById,
  createExportProfile,
  updateExportProfile,
  deleteExportProfile,
  updateProfileColorOptions,
  optimizeProductTitleRemote,
  updateProfileImages
} from "./exportApi.js";

const HISTORY_KEY = "etsyCrawlerHistory";

const DATA_COLUMNS = [
  { header: "id", key: "id" },
  { header: "link", key: "link" },
  { header: "product name", key: "productName" },
  { header: "description", key: "description" },
  { header: "image", key: "image" },
  { header: "image1", key: "image1" },
  { header: "image2", key: "image2" },
  { header: "image3", key: "image3" },
  { header: "image4", key: "image4" },
  { header: "image5", key: "image5" },
  { header: "image6", key: "image6" },
  { header: "image7", key: "image7" },
  { header: "image8", key: "image8" },
  { header: "image9", key: "image9" },
  { header: "price", key: "price" },
  { header: "rating", key: "rating" },
  { header: "crawledAt", key: "crawledAt" },
];

const DATA_HEADERS = DATA_COLUMNS.map((column) => column.header);
const IMAGE_KEYS = DATA_COLUMNS.filter((column) => column.key === "image" || column.key.startsWith("image"))
  .map((column) => column.key);

const textEncoder = new TextEncoder();

const PRODUCT_TYPE_OPTIONS = ["T-Shirt", "Sweater", "Hoodie", "Comfort Colors", "Longshirt"];
const IMAGE_FIELD_LABELS = {
  tshirt: "T-Shirt mockup",
  sweatshirt: "Sweatshirt mockup",
  hoodie: "Hoodie mockup",
  longshirt: "Longshirt mockup",
  Comfort_color: "Comfort Colors mockup",
  shipping: "Shipping card",
  thankyou: "Thank you card",
  freeship: "Free shipping art",
  colorchart: "Color chart"
};

const DEFAULT_DESCRIPTION = `
Campaign Details:

- EXCLUSIVE LIMITED EDITION - UNIQUE DESIGNS

Join over 15,700 happy customers!

This design can be printed on T-Shirts, Long Sleeves, Sweatshirts and Hoodies! Please check the 'Style' drop-down menu for options.

UNISEX BASIC T-SHIRT: The Gildan 5000 gives a rich and structured look to the classic t-shirt, and works great for layered streetwear outfits. Thanks to its heavyweight fabric, it maintains sharp lines along the edges and lasts a long time. Add your design, and surprise your customers with a new, trendy addition to your t-shirt collection.
- Classic fit
- 100% Cotton (fibre content may vary for different colors)
- Light fabric (5.3 oz/yd² (180 g/m²))
- Tear away label
- Runs true to size

LONG SLEEVE T-SHIRT: This Bella + Canvas 3501 Unisex Long Sleeve Tee is an instant bestseller, fit for both an everyday and business look. Made from 100% cotton and featuring a classic crew neck, it fits like a well-loved favorite.
- Retail Fit
- 100% Soft cotton (fibre content may vary for different colors)
- Light fabric (4.2 oz/yd² (142 g/m²))
- Tear away label
- Runs true to size

UNISEX CREWNECK SWEATSHIRT: This well-loved Gildan 18000 Unisex Sweatshirt is the perfect addition to any wardrobe. It has a crew neck, and it's made from air-jet spun yarn and quarter-turned fabric, which eliminates a center crease, reduces pilling, and gives the sweatshirt a soft, comfortable feel.
- Loose fit
- 50% Cotton; 50% Polyester (fibre content may vary for different colors)
- Medium fabric (8.0 oz/yd² (271.25 g/m²))
- Sewn in label
- Runs true to size

UNISEX PULLOVER HOODIE: With a large front pouch pocket and drawstrings in a matching color, this Gildan 18500 Unisex Hoodie is a sure crowd-favorite. It's soft, stylish, and perfect for the cooler evenings.
- Classic fit
- 50% Cotton; 50% Polyester (fibre content may vary for different colors)
- Medium fabric (8.0 oz/yd² (271.25 g/m²))
- Sewn in label
- Runs true to size

FOR YOUR INFORMATION:
- We produce all shirts to order with ECO FRIENDLY & NON-TOXIC INKS, in your choice of style, size & color!

WASHING INSTRUCTIONS:
- Wash inside out with like colors, in cold water.
- Tumble dry low or hang to dry.
- No direct iron!

PROCESSING AND SHIPPING TIMES:
- Please allow 1-3 business days for us to hand print your order and perfect the process.
- Then, allow 3-5 business days for shipping.

All our products are 100% made in the USA. We offer high-quality fabrics combined with equally high-quality printing.

For any questions, please send us a message on TikTok. We respond back to all messages within 24 hours.
`;

const DEFAULT_IMAGE_MAP = {
  tshirt: "https://p19-oec-ttp.tiktokcdn-us.com/tos-useast5-i-omjb5zjo8w-tx/3cf45c021abc4bf5b0ac73bd90bfb12e~tplv-omjb5zjo8w-origin-jpeg.jpeg?dr=10493&from=1432613627&idc=useast5&ps=933b5bde&shcp=9cd7d13a&shp=5563f2fb&t=555f072dwidth=1080&height=1080",
  sweatshirt: "https://p19-oec-ttp.tiktokcdn-us.com/tos-useast5-i-omjb5zjo8w-tx/3cf45c021abc4bf5b0ac73bd90bfb12e~tplv-omjb5zjo8w-origin-jpeg.jpeg?dr=10493&from=1432613627&idc=useast5&ps=933b5bde&shcp=9cd7d13a&shp=5563f2fb&t=555f072dwidth=1080&height=1080",
  hoodie: "https://p19-oec-ttp.tiktokcdn-us.com/tos-useast5-i-omjb5zjo8w-tx/3cf45c021abc4bf5b0ac73bd90bfb12e~tplv-omjb5zjo8w-origin-jpeg.jpeg?dr=10493&from=1432613627&idc=useast5&ps=933b5bde&shcp=9cd7d13a&shp=5563f2fb&t=555f072dwidth=1080&height=1080",
  longshirt: "https://p19-oec-ttp.tiktokcdn-us.com/tos-useast5-i-omjb5zjo8w-tx/3cf45c021abc4bf5b0ac73bd90bfb12e~tplv-omjb5zjo8w-origin-jpeg.jpeg?dr=10493&from=1432613627&idc=useast5&ps=933b5bde&shcp=9cd7d13a&shp=5563f2fb&t=555f072dwidth=1080&height=1080",
  Comfort_color: "https://p19-oec-ttp.tiktokcdn-us.com/tos-useast5-i-omjb5zjo8w-tx/3cf45c021abc4bf5b0ac73bd90bfb12e~tplv-omjb5zjo8w-origin-jpeg.jpeg?dr=10493&from=1432613627&idc=useast5&ps=933b5bde&shcp=9cd7d13a&shp=5563f2fb&t=555f072dwidth=1080&height=1080",
  shipping: "https://image.fansaticshop.com/090623/imgtiktok/img_shipping.jpg",
  thankyou: "https://image.fansaticshop.com/090623/imgtiktok/img_thankyou.jpg",
  freeship: "https://unblast.com/wp-content/uploads/2024/03/Mens-T-shirt-Mockup-PSD.jpg",
  colorchart: "https://images-ext-1.discordapp.net/external/NwgLIFWDlk_57Yfjk7KDJfNZP4244CKsHs9q2aIotQo/https/image.fansaticshop.com/090623/imgtiktok/img_thankyou.jpg?format=webp"
};

const DEFAULT_SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const DEFAULT_SELECTED_SIZES = [...DEFAULT_SIZE_OPTIONS];
const DEFAULT_COLOR_OPTIONS = [
  "White",
  "Black",
  "Sport Grey",
  "Ash",
  "Navy",
  "Red",
  "Royal",
  "Purple",
  "Dark Heather",
  "Forest Green",
  "Maroon",
  "Natural",
  "Light Pink",
  "Carolina Blue"
];
const DEFAULT_SELECTED_COLORS = ["White", "Black"];

const CATEGORY_MAPPING = {
  "T-Shirt": "Men's Tops/T-shirts/Men's Short-sleeve T-shirts",
  "Sweater": "Men's Tops/T-shirts/Men's Short-sleeve T-shirts",
  "Hoodie": "Men's Tops/T-shirts/Men's Short-sleeve T-shirts",
  "Comfort Colors": "Men's Tops/T-shirts/Men's Short-sleeve T-shirts",
  Longshirt: "Men's Tops/T-shirts/Men's Short-sleeve T-shirts"
};

const CUSTOM_EXPORT_KEY = "etsyCustomExportSettings";

function buildDefaultPrices(types = PRODUCT_TYPE_OPTIONS, sizes = DEFAULT_SIZE_OPTIONS, basePrice = "19.99") {
  const map = {};
  types.forEach((type) => {
    sizes.forEach((size) => {
      map[`${type}/${size}`] = basePrice;
    });
  });
  return map;
}

const DEFAULT_CUSTOM_EXPORT_SETTINGS = {
  sellerName: "EtsyShop",
  productsPerFile: 50,
  typePerFile: false,
  optimizeTitle: true,
  profileName: "",
  sizes: [...DEFAULT_SELECTED_SIZES],
  selectedColors: [...DEFAULT_SELECTED_COLORS],
  productTypes: [...PRODUCT_TYPE_OPTIONS],
  imageCount: 5,
  prices: buildDefaultPrices(),
  images: { ...DEFAULT_IMAGE_MAP },
  customDescriptions: "",
  colorOptions: [...DEFAULT_COLOR_OPTIONS],
  sizeOptions: [...DEFAULT_SIZE_OPTIONS]
};

function normalizeOptionList(...sources) {
  const result = [];
  const seen = new Set();
  sources
    .flat()
    .map((value) => (value === undefined || value === null ? "" : String(value)))
    .forEach((raw) => {
      const trimmed = raw.replace(/\s+/g, " ").trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(trimmed);
      }
    });
  return result;
}

function mergeCustomSettings(saved = {}) {
  const priceKeys = Object.keys(saved.prices || {});
  const inferredSizesFromPrices = priceKeys
    .map((key) => key.split("/")[1])
    .filter(Boolean);
  const inferredTypesFromPrices = priceKeys
    .map((key) => key.split("/")[0])
    .filter(Boolean);

  const hasProductTypes = Array.isArray(saved.productTypes) && saved.productTypes.length > 0;
  const hasSizeOptions = Array.isArray(saved.sizeOptions) && saved.sizeOptions.length > 0;
  const hasSizes = Array.isArray(saved.sizes) && saved.sizes.length > 0;
  const hasColorOptions = Array.isArray(saved.colorOptions) && saved.colorOptions.length > 0;
  const hasSelectedColors = Array.isArray(saved.selectedColors) && saved.selectedColors.length > 0;

  const productTypes = hasProductTypes
    ? normalizeOptionList(saved.productTypes)
    : normalizeOptionList(inferredTypesFromPrices.length ? inferredTypesFromPrices : PRODUCT_TYPE_OPTIONS);

  const sizeOptions = hasSizeOptions
    ? normalizeOptionList(saved.sizeOptions)
    : normalizeOptionList(DEFAULT_SIZE_OPTIONS, saved.sizes, inferredSizesFromPrices);

  const sizes = hasSizes
    ? normalizeOptionList(saved.sizes)
    : normalizeOptionList(sizeOptions.length ? sizeOptions : DEFAULT_SELECTED_SIZES);

  const colorOptions = hasColorOptions
    ? normalizeOptionList(saved.colorOptions, saved.selectedColors)
    : normalizeOptionList(DEFAULT_COLOR_OPTIONS, saved.selectedColors);

  const selectedColors = hasSelectedColors
    ? normalizeOptionList(saved.selectedColors)
    : normalizeOptionList(DEFAULT_SELECTED_COLORS);

  const merged = {
    ...DEFAULT_CUSTOM_EXPORT_SETTINGS,
    ...saved,
    profileName: typeof saved.profileName === "string" ? saved.profileName : (typeof saved.name === "string" ? saved.name : ""),
    sizes: sizes.length ? sizes : [...sizeOptions],
    selectedColors: selectedColors.length ? selectedColors : [...colorOptions],
    productTypes: productTypes.length ? productTypes : [...PRODUCT_TYPE_OPTIONS],
    prices: { ...buildDefaultPrices(productTypes.length ? productTypes : PRODUCT_TYPE_OPTIONS, sizes.length ? sizes : sizeOptions), ...(saved.prices || {}) },
    images: { ...DEFAULT_IMAGE_MAP, ...(saved.images || {}) },
    customDescriptions: typeof saved.customDescriptions === "string" ? saved.customDescriptions : "",
    colorOptions: colorOptions.length ? colorOptions : [...DEFAULT_COLOR_OPTIONS],
    sizeOptions: sizeOptions.length ? sizeOptions : [...DEFAULT_SIZE_OPTIONS]
  };
  merged.productsPerFile = Number.isFinite(Number(saved.productsPerFile)) ? Number(saved.productsPerFile) : DEFAULT_CUSTOM_EXPORT_SETTINGS.productsPerFile;
  merged.imageCount = Number.isFinite(Number(saved.imageCount)) ? Number(saved.imageCount) : DEFAULT_CUSTOM_EXPORT_SETTINGS.imageCount;
  merged.typePerFile = Boolean(saved.typePerFile);
  merged.optimizeTitle = saved.optimizeTitle === undefined ? true : Boolean(saved.optimizeTitle);
  merged.selectedColors = merged.selectedColors.filter((color) =>
    merged.colorOptions.some((option) => option.toLowerCase() === color.toLowerCase())
  );
  if (!merged.selectedColors.length) {
    merged.selectedColors = merged.colorOptions.slice(0, Math.max(1, DEFAULT_SELECTED_COLORS.length)) || [...merged.colorOptions];
  }
  merged.sizes = merged.sizes.filter((size) =>
    merged.sizeOptions.some((option) => option.toLowerCase() === size.toLowerCase())
  );
  if (!merged.sizes.length) {
    merged.sizes = merged.sizeOptions.slice(0, DEFAULT_SELECTED_SIZES.length) || [...merged.sizeOptions];
  }
  return merged;
}

async function loadCustomExportSettings() {
  try {
    const stored = await chrome.storage.local.get(CUSTOM_EXPORT_KEY).catch(() => ({}));
    const raw = stored?.[CUSTOM_EXPORT_KEY];
    if (raw && typeof raw === "object") {
      return mergeCustomSettings(raw);
    }
  } catch (error) {
    console.warn("Không thể tải cấu hình export từ storage", error);
  }

  try {
    const fallback = window.localStorage.getItem(CUSTOM_EXPORT_KEY);
    if (fallback) {
      const parsed = JSON.parse(fallback);
      if (parsed && typeof parsed === "object") {
        return mergeCustomSettings(parsed);
      }
    }
  } catch (error) {
    console.warn("Không thể đọc cấu hình export từ localStorage", error);
  }

  return { ...DEFAULT_CUSTOM_EXPORT_SETTINGS };
}

async function saveCustomExportSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return;
  }
  const normalized = mergeCustomSettings(settings);
  try {
    await chrome.storage.local.set({ [CUSTOM_EXPORT_KEY]: normalized });
  } catch (error) {
    console.warn("Không thể lưu cấu hình export", error);
  }
  try {
    window.localStorage.setItem(CUSTOM_EXPORT_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn("Không thể lưu cấu hình export xuống localStorage", error);
  }
  return normalized;
}

let history = [];
let filtered = [];
let selectedKeys = new Set();

const tableBody = document.getElementById("table-body");
const totalCountEl = document.getElementById("total-count");
const searchInput = document.getElementById("search");
const dateFilter = document.getElementById("date-filter");
const statusNode = document.getElementById("status");

const downloadCsvBtn = document.getElementById("download-csv");
const downloadXlsxBtn = document.getElementById("download-xlsx");
const refreshBtn = document.getElementById("refresh");
const clearBtn = document.getElementById("clear");
const deleteSelectedBtn = document.getElementById("delete-selected");
const selectAllCheckbox = document.getElementById("select-all");
const customExportBtn = document.getElementById("custom-export");
const exportModal = document.getElementById("export-modal");
const exportForm = document.getElementById("export-settings-form");
const exportSellerInput = document.getElementById("export-seller");
const exportProductsPerFileInput = document.getElementById("export-products-per-file");
const exportTypePerFileCheckbox = document.getElementById("export-type-per-file");
const exportOptimizeTitleCheckbox = document.getElementById("export-optimize-title");
const exportProfileSelect = document.getElementById("export-profile-select");
const exportProfileNameInput = document.getElementById("export-profile-name");
const exportProfileRefreshBtn = document.getElementById("export-profile-refresh");
const exportProfileNewBtn = document.getElementById("export-profile-new");
const exportProfileSaveBtn = document.getElementById("export-profile-save");
const exportProfileDeleteBtn = document.getElementById("export-profile-delete");
const exportProfileUpdatedHint = document.getElementById("export-profile-updated");
const exportProductTypesContainer = document.getElementById("export-product-types");
const exportImageInputsContainer = document.getElementById("export-image-inputs");
const exportImageCountInput = document.getElementById("export-image-count");
const exportSizeOptionsContainer = document.getElementById("export-size-options");
const exportSizeNewInput = document.getElementById("export-size-new");
const exportSizeAddButton = document.getElementById("export-size-add");
const exportColorOptionsContainer = document.getElementById("export-color-options");
const exportColorNewInput = document.getElementById("export-color-new");
const exportColorAddButton = document.getElementById("export-color-add");
const exportPriceGrid = document.getElementById("export-price-grid");
const exportComfortSection = document.getElementById("export-comfort-section");
const exportComfortDescription = document.getElementById("export-comfort-description");
const exportModalDismissElements = document.querySelectorAll('[data-dismiss="export-modal"]');
const exportSubmitButton = exportForm ? exportForm.querySelector('button[type="submit"]') : null;

let currentCustomExportSettings = { ...DEFAULT_CUSTOM_EXPORT_SETTINGS };
let exportModalInitialized = false;
let exportProfiles = [];
let currentProfileId = "";
let isSavingProfile = false;
const debouncePersistColorOptions = debounce(async () => {
  if (!currentProfileId || !currentCustomExportSettings?.colorOptions) return;
  try {
    await updateProfileColorOptions(currentProfileId, currentCustomExportSettings.colorOptions);
    if (exportProfileUpdatedHint) {
      exportProfileUpdatedHint.textContent = "Đã cập nhật danh sách màu.";
    }
  } catch (error) {
    console.error("Không thể cập nhật màu sắc profile", error);
  }
}, 600);
const debounceUpdateProfileImages = debounce(async () => {
  if (!currentProfileId || !currentCustomExportSettings?.images) return;
  try {
    await updateProfileImages(currentProfileId, currentCustomExportSettings.images);
    if (exportProfileUpdatedHint) {
      exportProfileUpdatedHint.textContent = "Đã cập nhật hình ảnh mặc định.";
    }
  } catch (error) {
    console.error("Không thể cập nhật ảnh profile", error);
  }
}, 800);

init().catch((error) => setStatus(error.message || String(error)));

async function init() {
  await refreshHistory();
  await setupExportModal();
  wireEvents();
  chrome.storage.onChanged.addListener(handleStorageChanged);
}

function wireEvents() {
  if (searchInput) {
    searchInput.addEventListener("input", debounce(applyFilters, 150));
  }
  if (dateFilter) {
    dateFilter.addEventListener("change", applyFilters);
  }

  downloadCsvBtn.addEventListener("click", () => {
    if (!filtered.length) {
      setStatus("Không có dữ liệu để tải.", true);
      return;
    }
    downloadCsv(filtered);
    setStatus(`Đã tải CSV cho ${filtered.length} sản phẩm.`);
  });

  downloadXlsxBtn.addEventListener("click", () => {
    if (!filtered.length) {
      setStatus("Không có dữ liệu để tải.", true);
      return;
    }
    downloadXlsx(filtered);
    setStatus(`Đã tải XLSX cho ${filtered.length} sản phẩm.`);
  });

  refreshBtn.addEventListener("click", refreshHistory);
  clearBtn.addEventListener("click", clearHistory);
  deleteSelectedBtn.addEventListener("click", deleteSelectedItems);
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", onSelectAllChange);
  }
  if (customExportBtn) {
    customExportBtn.addEventListener("click", handleOpenExportModal);
  }
  if (exportForm) {
    exportForm.addEventListener("submit", handleCustomExportSubmit);
  }
  exportModalDismissElements.forEach((element) => {
    element.addEventListener("click", closeExportModal);
  });
  exportColorAddButton?.addEventListener("click", handleAddColorOption);
  exportSizeAddButton?.addEventListener("click", handleAddSizeOption);
  exportProfileSelect?.addEventListener("change", onProfileChange);
  exportProfileRefreshBtn?.addEventListener("click", () => loadProfiles(true));
  exportProfileNewBtn?.addEventListener("click", resetProfileSelection);
  exportProfileSaveBtn?.addEventListener("click", handleSaveProfile);
  exportProfileDeleteBtn?.addEventListener("click", handleDeleteProfile);
  exportColorOptionsContainer?.addEventListener("change", handleColorSelectionChange);
  exportColorOptionsContainer?.addEventListener("click", handleColorOptionClick);
  exportSizeOptionsContainer?.addEventListener("change", handleSizeSelectionChange);
  exportSizeOptionsContainer?.addEventListener("click", handleSizeOptionClick);
  exportOptimizeTitleCheckbox?.addEventListener("change", () => {
    currentCustomExportSettings.optimizeTitle = Boolean(exportOptimizeTitleCheckbox.checked);
  });
  exportTypePerFileCheckbox?.addEventListener("change", () => {
    currentCustomExportSettings.typePerFile = Boolean(exportTypePerFileCheckbox.checked);
  });
}

async function refreshHistory() {
  const stored = await chrome.storage.local.get(HISTORY_KEY).catch(() => ({}));
  history = Array.isArray(stored[HISTORY_KEY]) ? stored[HISTORY_KEY] : [];
  history.sort((a, b) => new Date(b.crawledAt || 0) - new Date(a.crawledAt || 0));
  reconcileSelection();
  applyFilters();
  setStatus(`Đã tải ${history.length} sản phẩm từ bộ nhớ.`);
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const dateMode = dateFilter.value;
  const now = Date.now();

  filtered = history.filter((item) => {
    const matchesTerm = !term || matchesSearch(item, term);
    const matchesDate = filterByDate(item.crawledAt, dateMode, now);
    return matchesTerm && matchesDate;
  });

  refreshTable();
}

function refreshTable() {
  renderTable(filtered);
  updateSummary(filtered.length);
  updateSelectionUI();
}

function renderTable(rows) {
  tableBody.innerHTML = "";

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.className = "dash__empty";
    emptyRow.innerHTML = '<td colspan="8">Chưa có dữ liệu phù hợp.</td>';
    tableBody.appendChild(emptyRow);
    return;
  }

  const fragment = document.createDocumentFragment();

  rows.forEach((item) => {
    const tr = document.createElement("tr");
    const key = historyKeyFromItem(item);
    const checkedAttr = key && selectedKeys.has(key) ? "checked" : "";
    const disabledAttr = key ? "" : "disabled";
    const keyAttr = key ? escapeHtml(key) : "";

    if (key && selectedKeys.has(key)) {
      tr.classList.add("selected");
    }

    tr.innerHTML = `
      <td class="dash__cell-check">
        <input type="checkbox" class="dash__select" data-key="${keyAttr}" ${checkedAttr} ${disabledAttr} />
      </td>
      <td>${escapeHtml(item.id || "-")}</td>
      <td>
        <div class="dash__title">${escapeHtml(item.productName || "(Không tên)")}</div>
        <div class="dash__desc">${escapeHtml(truncateText(item.description || "", 140))}</div>
      </td>
      <td>${escapeHtml(item.price || "-")}</td>
      <td>${escapeHtml(item.rating || "-")}</td>
      <td>${renderImagesCell(item)}</td>
      <td>${renderLinkCell(item.link)}</td>
      <td>${renderMetaCell(item)}</td>
    `;

    const checkbox = tr.querySelector(".dash__select");
    if (checkbox && key) {
      checkbox.addEventListener("change", onRowCheckboxChange);
    }

    fragment.appendChild(tr);
  });

  tableBody.appendChild(fragment);
}

function matchesSearch(item, term) {
  const haystack = [
    item.id,
    item.productName,
    item.price,
    item.rating,
    item.description,
    item.link,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

function filterByDate(crawledAt, mode, now) {
  if (!crawledAt || mode === "all") return true;
  const timestamp = new Date(crawledAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  const diff = now - timestamp;
  const oneDay = 24 * 60 * 60 * 1000;

  switch (mode) {
    case "today":
      return isSameDay(timestamp, now);
    case "7d":
      return diff <= oneDay * 7;
    case "30d":
      return diff <= oneDay * 30;
    default:
      return true;
  }
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function renderImagesCell(item) {
  const urls = IMAGE_KEYS
    .map((key) => cleanImageUrl(item[key]))
    .filter(Boolean);

  const unique = dedupeVariantUrls(urls);

  if (!unique.length) {
    return "-";
  }

  return `
    <div class="dash__images">
      ${unique
        .map((url, index) => {
          const escapedUrl = escapeHtml(url);
          return `<a href="${escapedUrl}" target="_blank" rel="noopener" title="Ảnh ${index + 1}"><img src="${escapedUrl}" alt="Ảnh sản phẩm ${index + 1}" /></a>`;
        })
        .join("")}
    </div>
  `;
}

function renderLinkCell(url) {
  if (!url) return "-";
  const escaped = escapeHtml(url);
  return `<a href="${escaped}" target="_blank" rel="noopener">Mở</a>`;
}

function renderMetaCell(item) {
  const time = item.crawledAt ? new Date(item.crawledAt).toLocaleString("vi-VN") : "-";
  const id = item.id ? `#${escapeHtml(item.id)}` : "";
  return `<div>${escapeHtml(time)}</div><div class="dash__meta-id">${id}</div>`;
}

function updateSummary(count) {
  totalCountEl.textContent = `${count} sản phẩm`;
}

function onRowCheckboxChange(event) {
  const checkbox = event.currentTarget;
  const key = checkbox.dataset.key;
  if (!key) return;

  if (checkbox.checked) {
    selectedKeys.add(key);
  } else {
    selectedKeys.delete(key);
  }

  updateSelectionUI();
}

function onSelectAllChange(event) {
  const shouldSelect = event.currentTarget.checked;
  filtered.forEach((item) => {
    const key = historyKeyFromItem(item);
    if (!key) return;
    if (shouldSelect) {
      selectedKeys.add(key);
    } else {
      selectedKeys.delete(key);
    }
  });

  refreshTable();
}

function updateSelectionUI() {
  const selectableKeys = filtered.map(historyKeyFromItem).filter(Boolean);
  const selectedInView = selectableKeys.filter((key) => selectedKeys.has(key)).length;

  if (selectAllCheckbox) {
    selectAllCheckbox.checked = selectableKeys.length > 0 && selectedInView === selectableKeys.length;
    selectAllCheckbox.indeterminate = selectedInView > 0 && selectedInView < selectableKeys.length;
  }

  if (deleteSelectedBtn) {
    deleteSelectedBtn.disabled = selectedKeys.size === 0;
  }

  document.querySelectorAll(".dash__select").forEach((checkbox) => {
    if (!checkbox.dataset.key) return;
    const isChecked = selectedKeys.has(checkbox.dataset.key);
    checkbox.checked = isChecked;
    const row = checkbox.closest("tr");
    if (row) {
      row.classList.toggle("selected", isChecked);
    }
  });
}

function downloadCsv(rows) {
  const csvRows = rows.map((item) => DATA_COLUMNS.map((column) => item[column.key] ?? ""));
  const csvLines = [DATA_HEADERS.join(",")].concat(csvRows.map((row) => row.map(escapeCsvField).join(",")));
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `etsy-history-${Date.now()}.csv`);
}

function downloadXlsx(rows) {
  const blob = createXlsx(DATA_COLUMNS, rows);
  triggerDownload(blob, `etsy-history-${Date.now()}.xlsx`);
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function deleteSelectedItems() {
  if (!selectedKeys.size) {
    setStatus("Chưa có sản phẩm nào được chọn.", true);
    return;
  }

  const confirmed = confirm(`Bạn có chắc muốn xóa ${selectedKeys.size} sản phẩm đã chọn?`);
  if (!confirmed) {
    return;
  }

  const keysToRemove = new Set(selectedKeys);
  const remaining = history.filter((item) => {
    const key = historyKeyFromItem(item);
    return !key || !keysToRemove.has(key);
  });

  const removed = history.length - remaining.length;
  await chrome.storage.local.set({ [HISTORY_KEY]: remaining });
  history = remaining;
  selectedKeys.clear();
  reconcileSelection();
  applyFilters();
  setStatus(`Đã xóa ${removed} sản phẩm khỏi lịch sử.`);
}

async function clearHistory() {
  if (!history.length) {
    setStatus("Không có dữ liệu để xóa.", true);
    return;
  }
  const confirmed = confirm("Bạn có chắc muốn xóa toàn bộ lịch sử đã lưu?");
  if (!confirmed) {
    return;
  }
  await chrome.storage.local.set({ [HISTORY_KEY]: [] });
  history = [];
  selectedKeys.clear();
  applyFilters();
  setStatus("Đã xóa toàn bộ lịch sử.");
}

function handleStorageChanged(changes, area) {
  if (area !== "local" || !changes[HISTORY_KEY]) {
    return;
  }
  history = Array.isArray(changes[HISTORY_KEY].newValue) ? changes[HISTORY_KEY].newValue : [];
  history.sort((a, b) => new Date(b.crawledAt || 0) - new Date(a.crawledAt || 0));
  reconcileSelection();
  applyFilters();
  setStatus("Lịch sử đã được cập nhật.");
}

function reconcileSelection() {
  const existing = new Set(history.map(historyKeyFromItem).filter(Boolean));
  selectedKeys = new Set([...selectedKeys].filter((key) => existing.has(key)));
}

function historyKeyFromItem(item) {
  if (!item) return "";
  if (item.id) return `id:${item.id}`;
  if (item.link) return `link:${normalizeUrl(item.link)}`;
  return "";
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch (_) {
    return url || "";
  }
}

function createXlsx(columns, rows) {
  const now = new Date().toISOString();
  const sheetXml = buildSheetXml(columns, rows);

  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>\n  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>\n</Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>\n  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>\n</Relationships>`
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <dc:title>Etsy Crawl Data</dc:title>\n  <dc:subject>Etsy Crawl</dc:subject>\n  <dc:creator>Etsy Crawl Manager</dc:creator>\n  <cp:revision>1</cp:revision>\n  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>\n  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>\n</cp:coreProperties>`
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n  <Application>Etsy Crawl Manager</Application>\n</Properties>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n  <sheets>\n    <sheet name="EtsyData" sheetId="1" r:id="rId1"/>\n  </sheets>\n</workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n</Relationships>`
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: sheetXml
    },
  ];

  const zipData = buildZip(files.map(({ name, content }) => ({ name, content: textEncoder.encode(content) })));
  return new Blob([zipData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function buildSheetXml(columns, rows) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<sheetData>',
  ];

  let rowIndex = 1;
  const allRows = [
    columns.map((column) => column.header),
    ...rows.map((item) => columns.map((column) => valueToString(item[column.key]))),
  ];

  allRows.forEach((rowValues) => {
    xml.push(`<row r="${rowIndex}">`);
    rowValues.forEach((value, columnIndex) => {
      const cellRef = `${columnLetter(columnIndex)}${rowIndex}`;
      const escaped = escapeXml(value);
      const needsPreserve = /(^\s|\s$)/.test(value);
      const preserveAttr = needsPreserve ? ' xml:space="preserve"' : "";
      xml.push(`<c r="${cellRef}" t="inlineStr"><is><t${preserveAttr}>${escaped}</t></is></c>`);
    });
    xml.push("</row>");
    rowIndex += 1;
  });

  xml.push("</sheetData>");
  xml.push("</worksheet>");
  return xml.join("");
}

function buildZip(entries) {
  let offset = 0;
  const centralDirectory = [];
  const chunks = [];

  entries.forEach(({ name, content }) => {
    const fileNameBytes = textEncoder.encode(name);
    const data = content;
    const crc = crc32(data);
    const compressedSize = data.length;
    const uncompressedSize = data.length;

    const localHeader = new Uint8Array(30 + fileNameBytes.length);
    let pointer = 0;
    writeUint32LE(localHeader, 0x04034b50, pointer); pointer += 4;
    writeUint16LE(localHeader, 20, pointer); pointer += 2; // version needed
    writeUint16LE(localHeader, 0, pointer); pointer += 2; // general purpose
    writeUint16LE(localHeader, 0, pointer); pointer += 2; // compression method (store)
    writeUint16LE(localHeader, 0, pointer); pointer += 2; // mod time
    writeUint16LE(localHeader, 0, pointer); pointer += 2; // mod date
    writeUint32LE(localHeader, crc, pointer); pointer += 4;
    writeUint32LE(localHeader, compressedSize, pointer); pointer += 4;
    writeUint32LE(localHeader, uncompressedSize, pointer); pointer += 4;
    writeUint16LE(localHeader, fileNameBytes.length, pointer); pointer += 2;
    writeUint16LE(localHeader, 0, pointer); pointer += 2; // extra field length
    localHeader.set(fileNameBytes, pointer);

    chunks.push(localHeader, data);

    const localHeaderOffset = offset;
    offset += localHeader.length + data.length;

    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    pointer = 0;
    writeUint32LE(centralHeader, 0x02014b50, pointer); pointer += 4;
    writeUint16LE(centralHeader, 20, pointer); pointer += 2; // version made by
    writeUint16LE(centralHeader, 20, pointer); pointer += 2; // version needed
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // general purpose
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // compression method
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // mod time
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // mod date
    writeUint32LE(centralHeader, crc, pointer); pointer += 4;
    writeUint32LE(centralHeader, compressedSize, pointer); pointer += 4;
    writeUint32LE(centralHeader, uncompressedSize, pointer); pointer += 4;
    writeUint16LE(centralHeader, fileNameBytes.length, pointer); pointer += 2;
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // extra length
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // comment length
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // disk number start
    writeUint16LE(centralHeader, 0, pointer); pointer += 2; // internal attrs
    writeUint32LE(centralHeader, 0, pointer); pointer += 4; // external attrs
    writeUint32LE(centralHeader, localHeaderOffset, pointer); pointer += 4;
    centralHeader.set(fileNameBytes, pointer);

    centralDirectory.push(centralHeader);
  });

  const centralDirectoryOffset = offset;
  centralDirectory.forEach((entry) => {
    chunks.push(entry);
    offset += entry.length;
  });

  const centralDirectorySize = offset - centralDirectoryOffset;
  const endRecord = new Uint8Array(22);
  let pointer = 0;
  writeUint32LE(endRecord, 0x06054b50, pointer); pointer += 4;
  writeUint16LE(endRecord, 0, pointer); pointer += 2; // disk number
  writeUint16LE(endRecord, 0, pointer); pointer += 2; // disk with central dir
  writeUint16LE(endRecord, entries.length, pointer); pointer += 2;
  writeUint16LE(endRecord, entries.length, pointer); pointer += 2;
  writeUint32LE(endRecord, centralDirectorySize, pointer); pointer += 4;
  writeUint32LE(endRecord, centralDirectoryOffset, pointer); pointer += 4;
  writeUint16LE(endRecord, 0, pointer); // comment length

  chunks.push(endRecord);

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalSize);
  let offsetPointer = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offsetPointer);
    offsetPointer += chunk.length;
  });

  return output;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let code = i;
    for (let j = 0; j < 8; j += 1) {
      if (code & 1) {
        code = 0xedb88320 ^ (code >>> 1);
      } else {
        code >>>= 1;
      }
    }
    table[i] = code >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i];
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16LE(view, value, offset) {
  view[offset] = value & 0xff;
  view[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32LE(view, value, offset) {
  view[offset] = value & 0xff;
  view[offset + 1] = (value >>> 8) & 0xff;
  view[offset + 2] = (value >>> 16) & 0xff;
  view[offset + 3] = (value >>> 24) & 0xff;
}

function columnLetter(index) {
  let dividend = index + 1;
  let column = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    column = String.fromCharCode(65 + modulo) + column;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return column;
}

function valueToString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map(valueToString).join(", ");
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCsvField(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

const TIKTOK_HEADER_LEVEL_1 = [
  "Mandatory", "Optional", "Mandatory", "Mandatory", "Mandatory", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Conditionally mandatory", "Conditionally mandatory", "Optional", "Optional", null, null, null, null, null, null, null, "Conditionally mandatory", "Optional", "Mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Optional", "Mandatory", "Optional", "Conditionally mandatory", "Optional", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Conditionally mandatory", "Optional"
];

const TIKTOK_HEADER_LEVEL_2 = [
  "Select the category that matches the product from the drop-down list. \n\nListing prohibited or restricted products, or assigning products to the wrong category may result in TikTok Shop taking enforcement action on both your listings and your seller account.",
  "Select the brand that matches the product from the drop-down list.\nIf no brand is selected, it will be left empty and considered to have no brand.",
  "• Product name must be less than 255 characters.\n• Enter the title of your product.\n• If there are multiple SKUs, keep the titles consistent.",
  "Provide a detailed description of the product, such as product specifications, materials, box content and so on.\nA structured and informative product description can help customers make purchase decisions.\nIt's recommended to provide 3-5 selling points and each one can be described within 250 characters and several images, like feel, usage and benefits, etc.\nMake it easier to read by good use of segmentation, bolding, numbering, etc.",
  "Add the URL for your product's main image in this column. We recommend uploading the images to Media Center, copying the URL, and pasting it here.\n\nTo ensure your listing's success, upload high quality images.\n• Main product image aspect ratio: Between 3:4 and 4:3.\n• Picture pixel range: Between 100×100 px and 1200×1200 px, the higher the clearer.\nIt's recommended to provide 6 images to communicate the selling points and features of your products, inform and interest customers, and reinforce your brand.\nIt's recommended to use a white background image as the first image instead of using an image with other elements.\nGood images make it easy for customers to evaluate the product. Images should be clear, informative, and attractive.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Add the URLs of 4 additional images that showcase your product. We recommend uploading the images to Media Center, copying the URLs, and pasting them here.",
  "Select the identifier code type",
  "Please enter the identifier code.\nFor more infomation:https://shop-academy-us.tiktok.com/university/essay?knowledge_id=10012430&role=1&from=feature_guide&identity=1",
  "You can select from the recommended variation or add a new one. Only text input is supported (max. characters 50). If your products come with different variations, provide the first one here.",
  "Add at least 1 product variation to this column (for example, a color). Each variation can't exceed 35 characters.\n\nVariations must have the same product name and package dimensions. To see examples, download a template and select the \"Example\" sheet.",
  "Add the image URL for the variation in this column. Make sure the image represents the product variation.\n\nWe recommend uploading the images to Media Center, copying the URL, and pasting it here.",
  "Add the image URL for the variation here. Click \"+\" to add more image columns. We recommend uploading images to Media Center, copying the URL, and pasting them here.",
  null, null, null, null, null, null, null,
  "You can select from the recommended variation or add a new one. Only text input is supported (max. characters 50). If your products come with different variations, provide another one here.",
  "Complete this column only if your product has additional variations on top of the previous \"Variation\" column.\n\nAdd additional variations, such as sizes available in each color. Limit entry to 50 characters.\n\nFor example, a product in red and black, with each variation available in two sizes (small and medium), will require entries in four rows.\n\nVariations must have the same product name and package dimensions. To see examples, view the sheet titled \"Example.\"",
  "The weight of the package, not the product itself.\nEnter the weight of the product and its packaging, not just the product's weight.\n\nThe weight and dimensions of the first SKU are used to calculate the shipping fee and method for all variations, even when variations show different values.",
  "The shipping fee and method for all variations are based on the first SKU's dimensions. Make sure that the dimensions for all SKUs are accurate.",
  null, null,
  "The delivery options for this product are the same as the delivery options for the shop. ",
  "Enter the price of the product or variant. DO NOT include any currency symbols.",
  "Enter the list price of the product or its variant. Do not include currency symbols.",
  "Enter the quantity for each product in its warehouse cell. Click \"+\" to see all MWH. All SKUs must be assigned to at least one warehouse, with the first warehouse (highlighted in red) being mandatory.\n\nGray cells indicate quantity limitations. These products default to a quantity of 1 and are automatically assigned to the first warehouse.\n\nAfter publication, default quantities can be edited in Seller Center (PC version). Editing this template doesn't change default quantities. For more information, visit Academy.\nFor product categories with a limitation on quantity, the cells are grayed out. The quantity will be set as 1 by default when publishing. If you have multiple warehouses, the first warehouse will be used here automatically. Any edits to the quantity information on this template will not take effects. You can only edit the quantity in Seller Center on PC.\nFor more information, please visit TikTok Shop Academy.",
  "Identifier of the product or variant. This is used to quickly find the item in other systems.",
  "Copy the URL or enter the size chart template ID here.\nThis field is not supported for some product categories. If you enter information for a product in an affected category, the information entered for this field won't be published. Other information will be published as normal. ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use drop-down menu to select value or input custom value",
  "[Input type]:Use drop-down menu to select value or input custom value",
  "[Input type]:Use drop-down menu to select value or input custom value",
  "[Input type]:Use drop-down menu to select value or input custom value",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Use the drop-down menu to select value ",
  "[Input type]:Enter custom values",
  "[Input type]:Enter custom values",
  "[Input type]:Enter custom values",
  "[Input type]:Enter custom values",
  "[Upload a single image URL or use HTML to upload multiple images] Upload the SDS for products with batteries. Find them on the manufacturer's website. View example.",
  "[Upload a single image URL or use HTML to upload multiple images] Upload th e SDS for any other hazardous materials or dangerous goods in your product. Example.",
  "Dropdown to select product status. TikTok supports publishing of active and draft products. Drafts can be edited in bulk online."
];

const TIKTOK_HEADER_LEVEL_3 = [
  "Women's dresses/Formal dresses/Business dresses",
  "Vivienne Westwood (0123327)",
  "Women's Evening Dress, Luxury, One-shoulder",
  "• Solid colors: 100% Cotton / Heather colors: 60% Cotton, 40% Polyester",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "GTIN (1)",
  "000000000000",
  null,
  null,
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  "https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/a2222d9c65ef47c182034bc6a45e68be~tplv-o3syd03w52-origin-jpeg.jpeg",
  null, null, null, null, null, null, null, null,
  "Small / Medium / Large",
  "2", "10", "15", "20",
  "The delivery options for this product are the same as the delivery options for the shop. ",
  "1200",
  null,
  "1000",
  "6920152401020",
  "https://seller-id.tiktok.com/product/size chart",
  "", "", "", "", "", "", "", null, "", null, null, "", "", "", "", "", "", "", "", "", "", "", "", "", "",
  "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/7af18e942cb247e29c738e7398a68f48~tplv-aphluv4xwc-origin-image.image?dr=10495&t=555f072d&ps=933b5bde&shp=cdf09b4c&shcp=9b759fb9&idc=useast5&from=3455097676",
  "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/c3644764e09e405a8d065677c02d73e3~tplv-aphluv4xwc-origin-image.image?dr=10495&t=555f072d&ps=933b5bde&shp=cdf09b4c&shcp=9b759fb9&idc=useast5&from=3455097676",
  "Active(1)"
];

const TIKTOK_CUSTOM_ROW_1 = [
  "category", "brand", "product_name", "product_description", "main_image", "image_2", "image_3", "image_4", "image_5", "image_6", "image_7", "image_8", "image_9", "gtin_type", "gtin_code", "property_name_1", "property_value_1", "property_1_image", "property_1_image_2", "", "", "", "", "", "", "", "property_name_2", "property_value_2", "parcel_weight", "parcel_length", "parcel_width", "parcel_height", "delivery", "price", "list_price", "quantity", "seller_sku", "size_chart", "product_property/100157", "product_property/100198", "product_property/100393", "product_property/100394", "product_property/100395", "product_property/100397", "product_property/100398", "product_property/100396", "product_property/100399", "product_property/101127", "product_property/100347", "product_property/100401", "product_property/101619", "product_property/101395", "product_property/101398", "product_property/101400", "product_property/101397", "product_property/101610", "product_property/100216", "product_property/101611", "product_property/101614", "product_property/101623", "product_property/101624", "product_property/101625", "qualification/1729439947134305535", "qualification/8647636475739801353", "aimed_product_status"
];

const TIKTOK_CUSTOM_ROW_2 = [
  "V5.0.0", "create_product", "imperial", "category_v2", "", "021744277512730fdbdfdbdfdbdfdbd00000000000003f2b9ea66", "normal_file", "sale_platforms"
];

async function setupExportModal() {
  if (!exportModal || !exportProductTypesContainer || !exportImageInputsContainer) {
    return;
  }
  if (!exportModalInitialized) {
    populateProductTypeOptions();
    populateImageInputs();
    document.addEventListener("keydown", handleModalKeydown);
    exportModalInitialized = true;
  }
  await loadProfiles();
  try {
    currentCustomExportSettings = await loadCustomExportSettings();
    currentProfileId = "";
  } catch (error) {
    console.error("Failed to hydrate export settings", error);
    currentCustomExportSettings = { ...DEFAULT_CUSTOM_EXPORT_SETTINGS };
    currentProfileId = "";
  }
  applySettingsToForm(currentCustomExportSettings);
}

async function handleOpenExportModal(event) {
  event?.preventDefault?.();
  await setupExportModal();
  openExportModal();
}

function openExportModal() {
  if (!exportModal) return;
  exportModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  const focusTarget = exportSellerInput || exportModal.querySelector("input, textarea, button");
  if (focusTarget) {
    focusTarget.focus({ preventScroll: true });
  }
}

function closeExportModal(event) {
  event?.preventDefault?.();
  if (!exportModal) return;
  exportModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function handleModalKeydown(event) {
  if (event.key === "Escape" && exportModal && exportModal.getAttribute("aria-hidden") === "false") {
    closeExportModal();
  }
}

async function loadProfiles(force = false) {
  if (!exportProfileSelect) return;
  if (exportProfiles.length && !force) {
    renderProfileOptions();
    return;
  }
  try {
    const data = await fetchExportProfiles();
    exportProfiles = Array.isArray(data) ? data : [];
    renderProfileOptions();
  } catch (error) {
    console.error("Không thể tải danh sách profile", error);
    setStatus("Không tải được danh sách profile.", true);
  }
}

function renderProfileOptions() {
  if (!exportProfileSelect) return;
  const selectedValue = currentProfileId || exportProfileSelect.value;
  exportProfileSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Chọn profile --";
  exportProfileSelect.appendChild(placeholder);
  exportProfiles.forEach((profile) => {
    if (!profile) return;
    const option = document.createElement("option");
    option.value = profile._id || profile.id || profile.name || "";
    option.textContent = profile.name || profile._id || "Profile";
    exportProfileSelect.appendChild(option);
  });
  if (selectedValue) {
    exportProfileSelect.value = selectedValue;
  }
}

function resetProfileSelection() {
  currentProfileId = "";
  if (exportProfileSelect) {
    exportProfileSelect.value = "";
  }
  if (exportProfileNameInput) {
    exportProfileNameInput.value = "";
  }
  if (exportProfileUpdatedHint) {
    exportProfileUpdatedHint.textContent = "";
  }
  currentCustomExportSettings = { ...DEFAULT_CUSTOM_EXPORT_SETTINGS };
  applySettingsToForm(currentCustomExportSettings);
}

async function onProfileChange() {
  if (!exportProfileSelect) return;
  const profileId = exportProfileSelect.value;
  if (!profileId) {
    resetProfileSelection();
    return;
  }
  try {
    setStatus("Đang tải profile...", true);
    const profile = await fetchExportProfileById(profileId);
    const settings = mergeCustomSettings(profile?.settings || {});
    currentProfileId = profile?._id || profileId;
    currentCustomExportSettings = { ...settings };
    applySettingsToForm(settings);
    if (exportProfileNameInput) {
      exportProfileNameInput.value = profile?.name || settings.profileName || "";
    }
    setStatus("Đã tải profile.");
  } catch (error) {
    console.error("Không thể tải profile", error);
    setStatus("Không thể tải profile đã chọn.", true);
  }
}

function populateProductTypeOptions() {
  exportProductTypesContainer.innerHTML = "";
  PRODUCT_TYPE_OPTIONS.forEach((type) => {
    const id = `export-type-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const label = document.createElement("label");
    label.className = "modal__check";
    label.innerHTML = `
      <input type="checkbox" id="${id}" value="${escapeHtml(type)}" />
      <span>${escapeHtml(type)}</span>
    `;
    const checkbox = label.querySelector("input");
    checkbox.addEventListener("change", () => {
      currentCustomExportSettings.productTypes = getSelectedProductTypesFromForm();
      updateComfortSectionVisibility();
      updatePriceGridFromState();
    });
    exportProductTypesContainer.appendChild(label);
  });
}

function populateImageInputs() {
  exportImageInputsContainer.innerHTML = "";
  Object.entries(IMAGE_FIELD_LABELS).forEach(([key, label]) => {
    const field = document.createElement("label");
    field.className = "modal__field";
    field.innerHTML = `
      <span>${escapeHtml(label)}</span>
      <div class="modal__image-input">
        <input type="url" data-image-key="${escapeHtml(key)}" placeholder="https://..." />
        <img class="modal__thumb" src="" alt="${escapeHtml(label)}" data-preview-for="${escapeHtml(key)}" />
      </div>
    `;
    const input = field.querySelector("input");
    const preview = field.querySelector("img");
    if (input) {
      input.addEventListener("input", () => {
        updateImagePreview(preview, input.value);
        if (currentCustomExportSettings?.images) {
          currentCustomExportSettings.images[key] = input.value.trim();
        }
      });
      input.addEventListener("change", () => {
        if (currentProfileId) {
          debounceUpdateProfileImages();
        }
      });
    }
    exportImageInputsContainer.appendChild(field);
  });
}

function applySettingsToForm(settings) {
  if (!settings) return;
  const merged = mergeCustomSettings(settings);
  const comfortDescription = merged.customDescriptions && merged.customDescriptions.trim() ? merged.customDescriptions : DEFAULT_DESCRIPTION;
  if (exportSellerInput) exportSellerInput.value = merged.sellerName || "";
  if (exportProductsPerFileInput) exportProductsPerFileInput.value = merged.productsPerFile;
  if (exportTypePerFileCheckbox) {
    exportTypePerFileCheckbox.checked = Boolean(merged.typePerFile && merged.productTypes.includes("Comfort Colors"));
  }
  if (exportOptimizeTitleCheckbox) {
    exportOptimizeTitleCheckbox.checked = Boolean(merged.optimizeTitle);
  }
  if (exportProfileNameInput) exportProfileNameInput.value = merged.profileName || (currentProfileId ? (exportProfiles.find((profile) => (profile?._id || profile.id) === currentProfileId)?.name || "") : "");
  if (exportProductTypesContainer) {
    const selectedTypes = new Set(merged.productTypes);
    exportProductTypesContainer.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = selectedTypes.has(checkbox.value);
    });
  }
  if (exportImageInputsContainer) {
    exportImageInputsContainer.querySelectorAll('input[data-image-key]').forEach((input) => {
      const key = input.dataset.imageKey;
      if (!key) return;
      const value = merged.images[key] || DEFAULT_IMAGE_MAP[key] || "";
      input.value = value;
      const preview = exportImageInputsContainer.querySelector(`img[data-preview-for="${CSS.escape(key)}"]`);
      updateImagePreview(preview, value);
    });
  }
  if (exportImageCountInput) exportImageCountInput.value = merged.imageCount;
  renderSizeOptions(merged.sizeOptions, merged.sizes);
  renderColorOptions(merged.colorOptions, merged.selectedColors);
  updatePriceGridFromState(merged);
  if (exportComfortDescription) exportComfortDescription.value = comfortDescription;
  updateComfortSectionVisibility();
  currentCustomExportSettings = { ...merged, customDescriptions: comfortDescription };
}

function updateComfortSectionVisibility() {
  if (!exportComfortSection) return;
  const selectedTypes = getSelectedProductTypesFromForm();
  const hasComfort = selectedTypes.includes("Comfort Colors");
  exportComfortSection.style.display = hasComfort ? "" : "none";
  if (exportTypePerFileCheckbox) {
    exportTypePerFileCheckbox.disabled = !hasComfort;
    if (!hasComfort) {
      exportTypePerFileCheckbox.checked = false;
    }
    currentCustomExportSettings.typePerFile = Boolean(exportTypePerFileCheckbox.checked);
  }
}

function renderSizeOptions(options = [], selected = []) {
  if (!exportSizeOptionsContainer) return;
  const normalizedSelected = new Set(selected.map((size) => size.trim().toLowerCase()));
  exportSizeOptionsContainer.innerHTML = "";

  if (!options.length) {
    const hint = document.createElement("div");
    hint.className = "modal__hint";
    hint.textContent = "Chưa có size nào. Hãy thêm size mới.";
    exportSizeOptionsContainer.appendChild(hint);
    return;
  }

  options.forEach((size) => {
    const normalized = size.replace(/\s+/g, " ").trim();
    if (!normalized) return;
    const normalizedKey = normalized.toLowerCase();
    const wrapper = document.createElement("label");
    wrapper.className = `chip${normalizedSelected.has(normalizedKey) ? " chip--active" : ""}`;
    wrapper.dataset.size = normalized;
    wrapper.innerHTML = `
      <input type="checkbox" value="${escapeHtml(normalized)}" ${normalizedSelected.has(normalizedKey) ? "checked" : ""} />
      <span>${escapeHtml(normalized)}</span>
    `;
    exportSizeOptionsContainer.appendChild(wrapper);
  });
}

function renderColorOptions(options = [], selected = []) {
  if (!exportColorOptionsContainer) return;
  const normalizedSelected = new Set(selected.map((color) => color.trim().toLowerCase()));
  exportColorOptionsContainer.innerHTML = "";

  if (!options.length) {
    const hint = document.createElement("div");
    hint.className = "modal__hint";
    hint.textContent = "Chưa có màu nào. Hãy thêm màu mới.";
    exportColorOptionsContainer.appendChild(hint);
    return;
  }

  options.forEach((color) => {
    const normalized = color.trim();
    if (!normalized) return;
    const normalizedKey = normalized.toLowerCase();
    const wrapper = document.createElement("label");
    wrapper.className = `chip${normalizedSelected.has(normalizedKey) ? " chip--active" : ""}`;
    wrapper.dataset.color = normalized;
    wrapper.innerHTML = `
      <input type="checkbox" value="${escapeHtml(normalized)}" ${normalizedSelected.has(normalizedKey) ? "checked" : ""} />
      <span>${escapeHtml(normalized)}</span>
      <button type="button" class="chip__remove" data-remove="${escapeHtml(normalized)}" aria-label="Xóa màu">×</button>
    `;
    exportColorOptionsContainer.appendChild(wrapper);
  });
}

function updatePriceGridFromState(overrides) {
  if (!exportPriceGrid) return;
  const settings = overrides || currentCustomExportSettings;
  const productTypes = Array.isArray(settings?.productTypes) && settings.productTypes.length ? [...settings.productTypes] : [...PRODUCT_TYPE_OPTIONS];
  const sizes = Array.isArray(settings?.sizes) && settings.sizes.length ? [...settings.sizes] : [...DEFAULT_SIZE_OPTIONS];
  syncPriceMap(productTypes, sizes);

  exportPriceGrid.innerHTML = "";

  if (!productTypes.length || !sizes.length) {
    const hint = document.createElement("div");
    hint.className = "modal__hint";
    hint.textContent = "Hãy chọn ít nhất một loại sản phẩm và size để cấu hình giá.";
    exportPriceGrid.appendChild(hint);
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "Loại / Size";
  headerRow.appendChild(corner);
  sizes.forEach((size) => {
    const th = document.createElement("th");
    th.textContent = size;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  productTypes.forEach((type) => {
    const row = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.textContent = type;
    row.appendChild(labelCell);

    sizes.forEach((size) => {
      const key = `${type}/${size}`;
      const value = settings.prices?.[key] ?? "";
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.placeholder = "0.00";
      input.value = value;
      input.dataset.priceKey = key;
      input.addEventListener("blur", onPriceInputBlur);
      input.addEventListener("input", onPriceInputChange);
      cell.appendChild(input);
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  exportPriceGrid.appendChild(table);
}

function syncPriceMap(productTypes, sizes) {
  if (!currentCustomExportSettings.prices) {
    currentCustomExportSettings.prices = buildDefaultPrices(productTypes, sizes);
    return;
  }
  const nextPrices = {};
  productTypes.forEach((type) => {
    sizes.forEach((size) => {
      const key = `${type}/${size}`;
      nextPrices[key] = currentCustomExportSettings.prices[key] ?? "";
    });
  });
  currentCustomExportSettings.prices = nextPrices;
}

function onPriceInputChange(event) {
  const input = event.currentTarget;
  const key = input?.dataset?.priceKey;
  if (!key) return;
  currentCustomExportSettings.prices[key] = input.value.trim();
}

function onPriceInputBlur(event) {
  const input = event.currentTarget;
  const key = input?.dataset?.priceKey;
  if (!key) return;
  const normalized = sanitizePrice(input.value, currentCustomExportSettings.prices[key] || "0.00");
  currentCustomExportSettings.prices[key] = normalized;
  input.value = normalized;
}

function handleAddColorOption() {
  if (!exportColorNewInput) return;
  const raw = exportColorNewInput.value.replace(/\s+/g, " ").trim();
  if (!raw) {
    setStatus("Hãy nhập tên màu.", true);
    return;
  }
  const exists = currentCustomExportSettings.colorOptions.some((color) => color.toLowerCase() === raw.toLowerCase());
  if (exists) {
    setStatus("Màu đã tồn tại.", true);
    return;
  }
  currentCustomExportSettings.colorOptions.push(raw);
  if (!currentCustomExportSettings.selectedColors.some((color) => color.toLowerCase() === raw.toLowerCase())) {
    currentCustomExportSettings.selectedColors.push(raw);
  }
  exportColorNewInput.value = "";
  renderColorOptions(currentCustomExportSettings.colorOptions, currentCustomExportSettings.selectedColors);
  if (currentProfileId) {
    debouncePersistColorOptions();
  }
}

function handleAddSizeOption() {
  if (!exportSizeNewInput) return;
  const raw = exportSizeNewInput.value.replace(/\s+/g, " ").trim();
  if (!raw) {
    setStatus("Hãy nhập tên size.", true);
    return;
  }
  const exists = currentCustomExportSettings.sizeOptions.some((size) => size.toLowerCase() === raw.toLowerCase());
  if (exists) {
    setStatus("Size đã tồn tại.", true);
    return;
  }
  currentCustomExportSettings.sizeOptions.push(raw);
  if (!currentCustomExportSettings.sizes.some((size) => size.toLowerCase() === raw.toLowerCase())) {
    currentCustomExportSettings.sizes.push(raw);
  }
  exportSizeNewInput.value = "";
  renderSizeOptions(currentCustomExportSettings.sizeOptions, currentCustomExportSettings.sizes);
  updatePriceGridFromState();
}

function handleColorSelectionChange(event) {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox) return;
  const value = checkbox.value.trim();
  const index = currentCustomExportSettings.selectedColors.findIndex((color) => color.toLowerCase() === value.toLowerCase());
  if (checkbox.checked && index === -1) {
    currentCustomExportSettings.selectedColors.push(value);
  } else if (!checkbox.checked && index !== -1) {
    currentCustomExportSettings.selectedColors.splice(index, 1);
  }
  const wrapper = checkbox.closest(".chip");
  if (wrapper) {
    wrapper.classList.toggle("chip--active", checkbox.checked);
  }
}

function handleColorOptionClick(event) {
  const removeBtn = event.target.closest(".chip__remove");
  if (!removeBtn) return;
  event.preventDefault();
  event.stopPropagation();
  const color = removeBtn.dataset.remove;
  if (!color) return;
  currentCustomExportSettings.colorOptions = currentCustomExportSettings.colorOptions.filter((option) => option.toLowerCase() !== color.toLowerCase());
  currentCustomExportSettings.selectedColors = currentCustomExportSettings.selectedColors.filter((option) => option.toLowerCase() !== color.toLowerCase());
  renderColorOptions(currentCustomExportSettings.colorOptions, currentCustomExportSettings.selectedColors);
  if (currentProfileId) {
    debouncePersistColorOptions();
  }
}

function handleSizeSelectionChange(event) {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox) return;
  const rawValue = checkbox.value;
  const size = rawValue ? rawValue.replace(/\s+/g, " ").trim() : "";
  if (!size) return;

  const normalized = size.toLowerCase();
  const options = Array.isArray(currentCustomExportSettings.sizeOptions)
    ? currentCustomExportSettings.sizeOptions
  : [...DEFAULT_SIZE_OPTIONS];

  const selectedSet = new Set(
    (currentCustomExportSettings.sizes || []).map((entry) => entry.toLowerCase())
  );

  if (checkbox.checked) {
    selectedSet.add(normalized);
  } else {
    selectedSet.delete(normalized);
  }

  currentCustomExportSettings.sizes = options.filter((option) => selectedSet.has(option.toLowerCase()));

  const wrapper = checkbox.closest(".chip");
  if (wrapper) {
    wrapper.classList.toggle("chip--active", checkbox.checked);
  }

  updatePriceGridFromState();
}

function handleSizeOptionClick(event) {
  const checkbox = event.target.closest(".chip")?.querySelector('input[type="checkbox"]');
  if (!checkbox) return;
  if (event.target === checkbox) {
    return;
  }
  event.preventDefault();
  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event("change", { bubbles: true }));
}

function updateImagePreview(preview, value) {
  if (!preview) return;
  const url = value && value.trim() ? value.trim() : "";
  preview.src = url || "";
  preview.alt = url ? "Xem trước" : "Không có ảnh";
}

async function handleSaveProfile(event) {
  event?.preventDefault?.();
  if (isSavingProfile) return;
  const { settings, profileName, error } = collectSettingsFromForm({ includeProfileName: true });
  if (error) {
    setStatus(error, true);
    return;
  }
  if (!profileName) {
    setStatus("Hãy nhập tên profile.", true);
    return;
  }
  isSavingProfile = true;
  try {
    setStatus(currentProfileId ? "Đang cập nhật profile..." : "Đang tạo profile...");
    if (currentProfileId) {
      await updateExportProfile(currentProfileId, profileName, settings);
    } else {
      const created = await createExportProfile(profileName, settings);
      currentProfileId = created?._id || created?.id || "";
    }
    currentCustomExportSettings = mergeCustomSettings(settings);
    currentCustomExportSettings.profileName = profileName;
    if (exportProfileNameInput) {
      exportProfileNameInput.value = profileName;
    }
    await loadProfiles(true);
    if (currentProfileId && exportProfileSelect) {
      exportProfileSelect.value = currentProfileId;
    }
    await saveCustomExportSettings(currentCustomExportSettings);
    if (exportProfileUpdatedHint) {
      exportProfileUpdatedHint.textContent = "Đã lưu profile.";
    }
    setStatus("Đã lưu profile.");
  } catch (error) {
    console.error("Không thể lưu profile", error);
    setStatus("Không thể lưu profile.", true);
  } finally {
    isSavingProfile = false;
  }
}

async function handleDeleteProfile(event) {
  event?.preventDefault?.();
  if (!currentProfileId) {
    setStatus("Hãy chọn profile cần xóa.", true);
    return;
  }
  const confirmed = confirm("Bạn có chắc muốn xóa profile này?");
  if (!confirmed) return;
  try {
    await deleteExportProfile(currentProfileId);
    exportProfiles = exportProfiles.filter((profile) => (profile?._id || profile?.id) !== currentProfileId);
    currentProfileId = "";
    if (exportProfileUpdatedHint) {
      exportProfileUpdatedHint.textContent = "Đã xóa profile.";
    }
    setStatus("Đã xóa profile.");
    resetProfileSelection();
    await loadProfiles(true);
  } catch (error) {
    console.error("Không thể xóa profile", error);
    setStatus("Không thể xóa profile.", true);
  }
}

function getSelectedProductTypesFromForm() {
  if (!exportProductTypesContainer) return [];
  const selected = [];
  exportProductTypesContainer.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    if (checkbox.checked && PRODUCT_TYPE_OPTIONS.includes(checkbox.value)) {
      selected.push(checkbox.value);
    }
  });
  return selected;
}

function sanitizePrice(value, fallback = "0.00") {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value)
    .replace(/[^0-9.,-]/g, "")
    .replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);
  if (Number.isFinite(parsed)) {
    return parsed.toFixed(2);
  }
  return fallback;
}

function collectSettingsFromForm(options = {}) {
  const { includeProfileName = false } = options;
  if (!exportForm) {
    return { error: "Form không khả dụng.", settings: null, profileName: includeProfileName ? "" : undefined };
  }

  const sellerName = exportSellerInput?.value.trim();
  if (!sellerName) {
    return { error: "Tên seller không được để trống.", settings: null, profileName: includeProfileName ? (exportProfileNameInput?.value.trim() || "") : undefined };
  }

  const productTypes = getSelectedProductTypesFromForm();
  if (!productTypes.length) {
    return { error: "Hãy chọn ít nhất một loại sản phẩm.", settings: null, profileName: includeProfileName ? (exportProfileNameInput?.value.trim() || "") : undefined };
  }

  let productsPerFile = Number.parseInt(exportProductsPerFileInput?.value, 10);
  if (!Number.isFinite(productsPerFile) || productsPerFile <= 0) {
    productsPerFile = DEFAULT_CUSTOM_EXPORT_SETTINGS.productsPerFile;
  }

  let imageCount = Number.parseInt(exportImageCountInput?.value, 10);
  if (!Number.isFinite(imageCount) || imageCount < 1) {
    imageCount = DEFAULT_CUSTOM_EXPORT_SETTINGS.imageCount;
  }
  imageCount = Math.min(9, Math.max(1, imageCount));

  const sizeOptionsRaw = Array.isArray(currentCustomExportSettings.sizeOptions) && currentCustomExportSettings.sizeOptions.length
    ? [...currentCustomExportSettings.sizeOptions]
    : [...DEFAULT_SIZE_OPTIONS];
  const sizeOptions = Array.from(new Set(sizeOptionsRaw.map((size) => size.replace(/\s+/g, " ").trim()).filter(Boolean)));
  const selectedSizesSource = Array.isArray(currentCustomExportSettings.sizes) && currentCustomExportSettings.sizes.length
    ? currentCustomExportSettings.sizes
    : sizeOptions.length
      ? sizeOptions
      : [...DEFAULT_SELECTED_SIZES];
  const selectedSizes = selectedSizesSource
    .map((size) => size.trim())
    .filter((size) => size && sizeOptions.some((option) => option.toLowerCase() === size.toLowerCase()));
  const uniqueSizes = Array.from(new Set(selectedSizes.map((size) => size.replace(/\s+/g, " "))));
  if (!uniqueSizes.length) {
    return { error: "Hãy chọn ít nhất một size.", settings: null, profileName: includeProfileName ? (exportProfileNameInput?.value.trim() || "") : undefined };
  }

  const colorOptionsRaw = Array.isArray(currentCustomExportSettings.colorOptions) && currentCustomExportSettings.colorOptions.length
    ? [...currentCustomExportSettings.colorOptions]
    : [...DEFAULT_COLOR_OPTIONS];
  const colorOptions = Array.from(new Set(colorOptionsRaw.map((color) => color.replace(/\s+/g, " ").trim()).filter(Boolean)));
  const selectedColorsSource = Array.isArray(currentCustomExportSettings.selectedColors) && currentCustomExportSettings.selectedColors.length
    ? currentCustomExportSettings.selectedColors
    : colorOptions.length
      ? colorOptions.slice(0, Math.max(2, DEFAULT_SELECTED_COLORS.length))
      : [...DEFAULT_SELECTED_COLORS];
  const selectedColors = selectedColorsSource
    .map((color) => color.trim())
    .filter((color) => color && colorOptions.some((option) => option.toLowerCase() === color.toLowerCase()));
  const uniqueColors = Array.from(new Set(selectedColors.map((color) => color.replace(/\s+/g, " "))));
  if (!uniqueColors.length) {
    return { error: "Hãy chọn ít nhất một màu.", settings: null, profileName: includeProfileName ? (exportProfileNameInput?.value.trim() || "") : undefined };
  }

  const prices = {};
  productTypes.forEach((type) => {
    uniqueSizes.forEach((size) => {
      const key = `${type}/${size}`;
      const raw = currentCustomExportSettings.prices?.[key] ?? "0.00";
      prices[key] = sanitizePrice(raw, "0.00");
    });
  });

  const images = {};
  if (exportImageInputsContainer) {
    exportImageInputsContainer.querySelectorAll('input[data-image-key]').forEach((input) => {
      const key = input.dataset.imageKey;
      if (!key) return;
      images[key] = input.value.trim();
    });
  } else if (currentCustomExportSettings.images) {
    Object.entries(currentCustomExportSettings.images).forEach(([key, value]) => {
      images[key] = String(value || "").trim();
    });
  }

  const hasComfort = productTypes.includes("Comfort Colors");
  const comfortDescription = hasComfort
    ? (exportComfortDescription?.value.trim() || currentCustomExportSettings.customDescriptions || DEFAULT_DESCRIPTION)
    : "";

  const settings = {
    sellerName,
    productsPerFile,
    typePerFile: Boolean(exportTypePerFileCheckbox?.checked && hasComfort),
    optimizeTitle: Boolean(exportOptimizeTitleCheckbox?.checked),
    sizes: uniqueSizes,
    selectedColors: uniqueColors,
    productTypes,
    imageCount,
    prices,
    images: {
      ...DEFAULT_IMAGE_MAP,
      ...(currentCustomExportSettings.images || {}),
      ...images
    },
    customDescriptions: comfortDescription,
    colorOptions,
    sizeOptions,
  };

  const result = { settings, error: null };
  if (includeProfileName) {
    result.profileName = exportProfileNameInput?.value.trim() || "";
  }
  return result;
}

function getSelectedItems() {
  if (!selectedKeys.size) return [];
  const selection = new Set(selectedKeys);
  return history.filter((item) => {
    const key = historyKeyFromItem(item);
    return key && selection.has(key);
  });
}

async function handleCustomExportSubmit(event) {
  event.preventDefault();
  const rows = selectedKeys.size ? getSelectedItems() : [...filtered];
  if (!rows.length) {
    setStatus("Không có sản phẩm nào để xuất.", true);
    return;
  }

  const { settings, error } = collectSettingsFromForm();
  if (error) {
    setStatus(error, true);
    return;
  }

  currentCustomExportSettings = mergeCustomSettings(settings);
  const originalLabel = exportSubmitButton ? exportSubmitButton.textContent : "";
  if (exportSubmitButton) {
    exportSubmitButton.disabled = true;
    exportSubmitButton.textContent = "Đang xuất...";
  }

  try {
    await saveCustomExportSettings(currentCustomExportSettings);
  } catch (storageError) {
    console.error("Không thể lưu cấu hình export", storageError);
  }

  try {
    await runCustomExport(rows, currentCustomExportSettings);
    closeExportModal();
    setStatus(`Đã tạo file export cho ${rows.length} sản phẩm.`);
  } catch (exportError) {
    console.error("Xuất file TikTok thất bại", exportError);
    setStatus(exportError?.message || "Xuất file thất bại.", true);
  } finally {
    if (exportSubmitButton) {
      exportSubmitButton.disabled = false;
      exportSubmitButton.textContent = originalLabel;
    }
  }
}

async function runCustomExport(items, settings) {
  if (!items.length) {
    throw new Error("Không có dữ liệu để export.");
  }
  const sellerSlug = sanitizeFileName(settings.sellerName || "seller");
  const exportJobs = [];

  if (settings.typePerFile && settings.productTypes.includes("Comfort Colors")) {
    const comfortRows = [];
    const otherRows = [];
    items.forEach((item) => {
      settings.productTypes.forEach((type) => {
        const productRows = generateRowsForItem(item, settings, type);
        if (type === "Comfort Colors") {
          comfortRows.push(...productRows);
        } else {
          otherRows.push(...productRows);
        }
      });
    });

    if (comfortRows.length) {
      exportJobs.push({ name: `${sellerSlug}_Comfort_color_products.xlsx`, rows: comfortRows });
    }
    if (otherRows.length) {
      exportJobs.push({ name: `${sellerSlug}_other_products.xlsx`, rows: otherRows });
    }
  } else {
    const chunkSize = Math.max(1, settings.productsPerFile);
    for (let index = 0; index < items.length; index += chunkSize) {
      const chunk = items.slice(index, index + chunkSize);
      const chunkRows = chunk.flatMap((item) => generateRowsForItem(item, settings));
      if (chunkRows.length) {
        exportJobs.push({ name: `${sellerSlug}_products_${exportJobs.length + 1}.xlsx`, rows: chunkRows });
      }
    }
  }

  if (!exportJobs.length) {
    throw new Error("Không tạo được dữ liệu export.");
  }

  const zipEntries = exportJobs.map((job) => ({
    name: job.name,
    content: createTikTokWorkbook(job.rows)
  }));

  const zipData = buildZip(zipEntries);
  const zipBlob = new Blob([zipData], { type: "application/zip" });
  triggerDownload(zipBlob, `${sellerSlug}_products_all.zip`);
}

function generateRowsForItem(item, settings, forcedType) {
  const rows = [];
  const baseTitle = item.productName || item.title || item.id || "Untitled product";
  const title = settings.optimizeTitle ? optimizeProductTitle(baseTitle) : baseTitle;
  const descriptionComfort = settings.customDescriptions && settings.customDescriptions.trim() ? settings.customDescriptions.trim() : DEFAULT_DESCRIPTION;
  const productImages = collectProductImages(item, settings.imageCount);
  const productTypes = forcedType ? [forcedType] : settings.productTypes;

  productTypes.forEach((type) => {
    const typeKey = productTypeToImageKey(type);
    const fallbackSequence = [typeKey, "shipping", "thankyou", "freeship", "colorchart"];
    const defaults = [];
    fallbackSequence.forEach((key) => {
      const candidate = settings.images[key] || DEFAULT_IMAGE_MAP[key];
      if (candidate && !defaults.includes(candidate)) {
        defaults.push(candidate);
      }
    });
    const allImages = [...productImages, ...defaults].filter(Boolean).slice(0, 9);
    const description = type === "Comfort Colors" ? descriptionComfort : DEFAULT_DESCRIPTION;
    const category = CATEGORY_MAPPING[type] || CATEGORY_MAPPING["T-Shirt"];
    const sizeChartKey = type.toLowerCase() === "t-shirt" ? "tshirt" : type.toLowerCase() === "sweater" ? "sweatshirt" : "hoodie";
    const sizeChart = settings.images[sizeChartKey] || DEFAULT_IMAGE_MAP[sizeChartKey] || "";

    settings.selectedColors.forEach((color) => {
      settings.sizes.forEach((size) => {
        const priceKey = `${type}/${size}`;
        const priceValue = settings.prices[priceKey] || extractNumericPrice(item.price);
        rows.push({
          "Category": category,
          "Brand": "No brand",
          "Product Name": title,
          "Product Description": description,
          "Main Product Image": allImages[0] || "",
          "Product Image 2": allImages[1] || "",
          "Product Image 3": allImages[2] || "",
          "Product Image 4": allImages[3] || "",
          "Product Image 5": allImages[4] || "",
          "Product Image 6": allImages[5] || "",
          "Product Image 7": allImages[6] || "",
          "Product Image 8": allImages[7] || "",
          "Product Image 9": allImages[8] || "",
          "Identifier Code Type": "",
          "Identifier Code": "",
          "Variation Name 1": "Color",
          "Primary variation type": color,
          "Primary variation image 1": "",
          "Blank 1": "",
          "Blank 2": "",
          "Blank 3": "",
          "Blank 4": "",
          "Blank 5": "",
          "Blank 6": "",
          "Blank 7": "",
          "Blank 8": "",
          "Variation Name 2": "Size",
          "Secondary variation value": type === "Comfort Colors" ? `${type}/T-shirt ${size}` : `${type}/${size}`,
          "Package Weight(lb)": "1",
          "Package Length(inch)": "2",
          "Package Width(inch)": "5",
          "Package Height(inch)": "10",
          "Delivery options": "",
          "Retail Price (Local Currency)": priceValue,
          "List price (Local Currency)": priceValue,
          "Quantity in U.S Pickup Warehouse": "99",
          "Seller SKU": "",
          "Size Chart": sizeChart,
          "Materials": "COTTON",
          "Pattern": "Graphic",
          "Neckline": "Round Neck",
          "Clothing Length": "Medium",
          "Sleeve Length": "Short Sleeve",
          "Season": "All Seasons",
          "Style": "Basic,Holiday",
          "Sleeve Type": "Normal Type",
          "Fit": "Loose-fitting",
          "Size Type": "Normal Type",
          "Quantity Per Pack": "",
          "Washing Instructions": "Machine Washable",
          "Dangerous Goods or Hazardous Materials": "No",
          "CA Prop 65: Repro. Chems": "No",
          "Reprotoxic Chemicals": "",
          "CA Prop 65: Carcinogens": "No",
          "carcinogen": "",
          "Contains Batteries or Cells?": "No",
          "Battery type": "",
          "How Batteries Are Packed": "",
          "Battery or Cell Weight in grams": "",
          "Number of Batteries or cells": "",
          "Battery or Cell Capacity in Wh": "",
          "Battery or Cell Capacity in grams": "",
          "Safety Data Sheet (SDS) for products with batteries": "",
          "Safety Data Sheet (SDS) for other dangerous goods or hazardous materials": "",
          "Product Status": "Active",
        });
      });
    });
  });

  return rows;
}

function collectProductImages(item, limit = 9) {
  const urls = IMAGE_KEYS.map((key) => cleanImageUrl(item[key])).filter(Boolean);
  const unique = dedupeVariantUrls(urls);
  return unique.slice(0, Math.max(0, Math.min(limit, 9)));
}

function productTypeToImageKey(type) {
  const normalized = type.toLowerCase();
  if (normalized === "t-shirt" || normalized === "tshirt") return "tshirt";
  if (normalized === "sweater") return "sweatshirt";
  if (normalized === "hoodie") return "hoodie";
  if (normalized === "longshirt") return "longshirt";
  if (normalized.includes("comfort")) return "Comfort_color";
  return "tshirt";
}

function optimizeProductTitle(title) {
  const words = String(title || "")
    .split(/\s+/)
    .filter(Boolean);
  const seen = new Set();
  const result = [];
  words.forEach((word) => {
    const lower = word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(word);
    }
  });
  return result.join(" ") || title;
}

function sanitizeFileName(value) {
  return String(value || "export")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "export";
}

function extractNumericPrice(rawValue) {
  if (!rawValue) return "0.00";
  const match = String(rawValue).match(/[0-9]+(?:[.,][0-9]+)?/);
  if (!match) return "0.00";
  const normalized = match[0].replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return "0.00";
  return parsed.toFixed(2);
}

function createTikTokWorkbook(rows) {
  if (!rows.length) {
    return createXlsxFromAoA([]);
  }
  const columns = Object.keys(rows[0]);
  const colCount = columns.length;
  const header1 = fillRow(TIKTOK_HEADER_LEVEL_1, colCount);
  const header2 = fillRow(TIKTOK_HEADER_LEVEL_2, colCount);
  const header3 = fillRow(TIKTOK_HEADER_LEVEL_3, colCount);
  const dataRows = rows.map((row) => columns.map((key) => row[key] ?? ""));
  const aoa = [
    fillRow(TIKTOK_CUSTOM_ROW_1, colCount),
    fillRow(TIKTOK_CUSTOM_ROW_2, colCount),
    columns,
    header1,
    header2,
    header3,
    ...dataRows
  ];
  return createXlsxFromAoA(aoa);
}

function fillRow(row, len) {
  const next = Array.isArray(row) ? row.slice(0, len) : [];
  if (next.length < len) {
    next.push(...Array(len - next.length).fill(""));
  }
  return next;
}

function createXlsxFromAoA(aoa) {
  const now = new Date().toISOString();
  const sheetXml = buildSheetXmlFromAoA(aoa);
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>\n  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>\n</Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>\n  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>\n</Relationships>`
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <dc:title>Etsy TikTok Export</dc:title>\n  <dc:subject>Etsy Crawl TikTok Export</dc:subject>\n  <dc:creator>Etsy Crawl Manager</dc:creator>\n  <cp:revision>1</cp:revision>\n  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>\n  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>\n</cp:coreProperties>`
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n  <Application>Etsy Crawl Manager</Application>\n</Properties>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n  <sheets>\n    <sheet name="Products" sheetId="1" r:id="rId1"/>\n  </sheets>\n</workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n</Relationships>`
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: sheetXml
    }
  ];

  return buildZip(files.map(({ name, content }) => ({ name, content: textEncoder.encode(content) })));
}

function buildSheetXmlFromAoA(aoa) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<sheetData>'
  ];
  let rowIndex = 1;
  (aoa.length ? aoa : [[]]).forEach((row) => {
    xml.push(`<row r="${rowIndex}">`);
    row.forEach((value, columnIndex) => {
      const textValue = valueToString(value);
      const cellRef = `${columnLetter(columnIndex)}${rowIndex}`;
      const escaped = escapeXml(textValue);
      const needsPreserve = /(^\s|\s$)/.test(textValue);
      const preserveAttr = needsPreserve ? ' xml:space="preserve"' : "";
      xml.push(`<c r="${cellRef}" t="inlineStr"><is><t${preserveAttr}>${escaped}</t></is></c>`);
    });
    xml.push("</row>");
    rowIndex += 1;
  });
  xml.push("</sheetData>");
  xml.push("</worksheet>");
  return xml.join("");
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function debounce(fn, delay = 150) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(null, args), delay);
  };
}

function cleanImageUrl(value) {
  if (!value) return "";

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
        return cleanImageUrl(candidate);
      }
    }
    return "";
  }

  const stringValue = String(value).trim();
  if (!stringValue || /\u0000/.test(stringValue)) return "";
  if (stringValue.includes("[object Object]")) return "";

  if (stringValue.startsWith("//")) {
    return `https:${stringValue}`;
  }

  if (/^https?:/i.test(stringValue)) {
    return stringValue;
  }

  try {
    return new URL(stringValue, "https://www.etsy.com").href;
  } catch (_) {
    return "";
  }
}

function dedupeVariantUrls(urls) {
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

function setStatus(message, subtle = false) {
  if (!statusNode) return;
  statusNode.textContent = message || "";
  statusNode.style.opacity = message ? "1" : "0";
  statusNode.style.color = subtle ? "#7a7a81" : "#ff6200";
  if (message) {
    clearTimeout(setStatus._timer);
    setStatus._timer = setTimeout(() => {
      statusNode.textContent = "";
      statusNode.style.opacity = "0";
    }, 5000);
  }
}

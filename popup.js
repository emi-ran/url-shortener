const API_URL = "https://is.gd/create.php";
const API_STATS_URL = "https://is.gd/forward.php";

// DOM Elements
const loadingDiv = document.getElementById("loading");
const resultDiv = document.getElementById("result");
const errorDiv = document.getElementById("error");
const shortUrlDiv = document.getElementById("shortUrl");
const qrCodeImg = document.getElementById("qrCode");
const shortKeySpan = document.getElementById("shortKey");
const clickCountSpan = document.getElementById("clickCount");
const expirySpan = document.getElementById("expiry");
const errorMsg = document.getElementById("errorMsg");
const customCodeInput = document.getElementById("customCode");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");
const downloadQrBtn = document.getElementById("downloadQrBtn");
const addFavoriteBtn = document.getElementById("addFavoriteBtn");
const retryBtn = document.getElementById("retryBtn");

// Tab elements
const tabBtns = document.querySelectorAll(".tab-btn");
const historyList = document.getElementById("historyList");
const favoritesList = document.getElementById("favoritesList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");

let currentShortUrl = "";
let currentLongUrl = "";
let currentUrlData = null;

// Initialize - Get current tab URL and shorten it
async function init() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentLongUrl = tab.url;

    // Check if we already shortened this URL
    const history = await getHistory();
    const existing = history.find((item) => item.longUrl === currentLongUrl);

    if (existing) {
      // Show existing shortened URL
      currentShortUrl = existing.shortUrl;
      currentUrlData = existing;
      showResult(existing);
      updateClickCount(existing.shortCode);
    } else {
      // Shorten new URL
      await shortenUrl(currentLongUrl);
    }
  } catch (error) {
    showError("Could not get page URL: " + error.message);
  }
}

// Shorten URL function
async function shortenUrl(url, customCode = null) {
  showLoading();

  try {
    // Ensure URL starts with http/https
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Build API URL with custom code if provided
    let apiUrl = `${API_URL}?format=json&url=${encodeURIComponent(url)}`;
    if (customCode?.trim()) {
      apiUrl += `&shorturl=${encodeURIComponent(customCode.trim())}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = JSON.parse(responseText);

    if (data.shorturl) {
      currentShortUrl = data.shorturl;
      const shortCode = data.shorturl.split("/").pop();

      const urlData = {
        shortUrl: data.shorturl,
        longUrl: url,
        shortCode: shortCode,
        createdAt: Date.now(),
        clicks: 0,
      };

      currentUrlData = urlData;

      // Save to history
      await saveToHistory(urlData);

      showResult(urlData);

      // Update click count
      updateClickCount(shortCode);

      // Clear custom code input on success
      if (customCodeInput) {
        customCodeInput.value = "";
      }
    } else if (data.errormessage) {
      // Show user-friendly error message
      let errorMessage = data.errormessage;
      if (errorMessage.includes("already exists")) {
        errorMessage =
          "This custom code is already taken. Please try another one.";
      }
      throw new Error(errorMessage);
    } else {
      throw new Error("Could not get shortened URL");
    }
  } catch (error) {
    console.error("Error details:", error);
    showError("URL shortening error: " + error.message);
  }
}

// Update click count from is.gd stats
async function updateClickCount(shortCode) {
  clickCountSpan.textContent = "Loading...";

  // is.gd doesn't provide public stats API, so we'll show "N/A"
  // You can use is.gd's logstats parameter when creating short URL
  // For now, we'll just show that it's permanent
  setTimeout(() => {
    clickCountSpan.textContent = "N/A (Stats unavailable)";
  }, 500);
}

// Show loading state
function showLoading() {
  loadingDiv.classList.remove("hidden");
  resultDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");
}

// Show result
function showResult(data) {
  loadingDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");
  resultDiv.classList.remove("hidden");

  shortUrlDiv.textContent = data.shortUrl;
  shortKeySpan.textContent = data.shortCode;

  // Generate QR Code - using QR Server API (free)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    data.shortUrl
  )}`;
  qrCodeImg.src = qrApiUrl;

  expirySpan.textContent = "Permanent";

  // Update click count if available
  if (data.clicks !== undefined) {
    clickCountSpan.textContent = data.clicks;
  }
}

// Show error
function showError(message) {
  loadingDiv.classList.add("hidden");
  resultDiv.classList.add("hidden");
  errorDiv.classList.remove("hidden");
  errorMsg.textContent = message;
}

// Storage functions
async function getHistory() {
  const result = await chrome.storage.local.get(["history"]);
  return result.history || [];
}

async function saveToHistory(urlData) {
  let history = await getHistory();

  // Check if already exists
  const existingIndex = history.findIndex(
    (item) => item.shortUrl === urlData.shortUrl
  );
  if (existingIndex >= 0) {
    // Update existing
    history[existingIndex] = { ...history[existingIndex], ...urlData };
  } else {
    // Add new (limit to 50 items)
    history.unshift(urlData);
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
  }

  await chrome.storage.local.set({ history });
  await loadHistory();
}

async function getFavorites() {
  const result = await chrome.storage.local.get(["favorites"]);
  return result.favorites || [];
}

async function addToFavorites(urlData) {
  let favorites = await getFavorites();

  // Check if already exists
  const exists = favorites.some((item) => item.shortUrl === urlData.shortUrl);
  if (!exists) {
    favorites.unshift(urlData);
    await chrome.storage.local.set({ favorites });
    await loadFavorites();

    // Visual feedback
    const originalText = addFavoriteBtn.textContent;
    addFavoriteBtn.textContent = "✅ Added!";
    setTimeout(() => {
      addFavoriteBtn.textContent = originalText;
    }, 2000);
  } else {
    alert("Already in favorites!");
  }
}

async function removeFromFavorites(shortUrl) {
  let favorites = await getFavorites();
  favorites = favorites.filter((item) => item.shortUrl !== shortUrl);
  await chrome.storage.local.set({ favorites });
  await loadFavorites();
}

async function clearHistory() {
  if (confirm("Clear all history?")) {
    await chrome.storage.local.set({ history: [] });
    await loadHistory();
  }
}

async function clearFavorites() {
  if (confirm("Clear all favorites?")) {
    await chrome.storage.local.set({ favorites: [] });
    await loadFavorites();
  }
}

// Load history into UI
async function loadHistory() {
  const history = await getHistory();

  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-message">No history yet</p>';
    return;
  }

  historyList.innerHTML = history
    .map((item) => createUrlItem(item, false))
    .join("");
}

// Load favorites into UI
async function loadFavorites() {
  const favorites = await getFavorites();

  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-message">No favorites yet</p>';
    return;
  }

  favoritesList.innerHTML = favorites
    .map((item) => createUrlItem(item, true))
    .join("");
}

// Create URL item HTML
function createUrlItem(item, isFavorite) {
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    item.shortUrl
  )}`;

  const itemId = `item-${item.shortCode}`;

  return `
    <div class="url-item" data-short-url="${
      item.shortUrl
    }" data-item-id="${itemId}">
      <div class="url-item-header">
        <span class="url-item-short" data-url="${item.shortUrl}">${
    item.shortUrl
  }</span>
        <div class="url-item-actions">
          <button class="copy-url-btn" data-url="${
            item.shortUrl
          }">📋 Copy</button>
          ${
            isFavorite
              ? `<button class="remove-favorite-btn" data-url="${item.shortUrl}">🗑️ Remove</button>`
              : `<button class="add-favorite-btn" data-url="${item.shortUrl}">⭐ Favorite</button>`
          }
        </div>
      </div>
      <div class="url-item-long">${item.longUrl}</div>
      <div class="url-item-meta">
        <span>📅 ${date}</span>
        <span>🔑 ${item.shortCode}</span>
        <span>👆 Click to show QR</span>
      </div>
      <div class="url-item-details">
        <div class="url-item-details-label">QR Code</div>
        <img src="${qrUrl}" alt="QR Code" />
      </div>
    </div>
  `;
}

// Setup event delegation for URL items
function setupUrlItemListeners() {
  // Delegate events for history list
  historyList.addEventListener("click", handleUrlItemClick);
  favoritesList.addEventListener("click", handleUrlItemClick);
}

function handleUrlItemClick(e) {
  const target = e.target;

  // Handle URL item expansion
  const urlItem = target.closest(".url-item");
  if (
    urlItem &&
    !target.closest(".url-item-actions") &&
    !target.closest(".url-item-short")
  ) {
    // Close all other expanded items
    document.querySelectorAll(".url-item.expanded").forEach((item) => {
      if (item !== urlItem) {
        item.classList.remove("expanded");
      }
    });
    // Toggle current item
    urlItem.classList.toggle("expanded");
  }

  // Handle short URL click - open in new tab
  if (target.classList.contains("url-item-short")) {
    const url = target.dataset.url;
    chrome.tabs.create({ url });
    e.stopPropagation();
  }

  // Handle copy button
  if (target.classList.contains("copy-url-btn")) {
    const url = target.dataset.url;
    navigator.clipboard.writeText(url).then(() => {
      const originalText = target.textContent;
      target.textContent = "✅ Copied!";
      setTimeout(() => {
        target.textContent = originalText;
      }, 2000);
    });
    e.stopPropagation();
  }

  // Handle add to favorites
  if (target.classList.contains("add-favorite-btn")) {
    const url = target.dataset.url;
    getHistory().then((history) => {
      const item = history.find((h) => h.shortUrl === url);
      if (item) {
        addToFavorites(item);
      }
    });
    e.stopPropagation();
  }

  // Handle remove from favorites
  if (target.classList.contains("remove-favorite-btn")) {
    const url = target.dataset.url;
    removeFromFavorites(url);
    e.stopPropagation();
  }
}

// Copy to clipboard
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(currentShortUrl);

    // Visual feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "✅ Copied!";
    copyBtn.classList.add("copied");

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch (error) {
    alert("Copy failed: " + error.message);
  }
}

// Open shortened URL
function openShortUrl() {
  chrome.tabs.create({ url: currentShortUrl });
}

// Download QR code
async function downloadQrCode() {
  try {
    // Download QR code
    const response = await fetch(qrCodeImg.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${currentShortUrl.split("/").pop()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Visual feedback
    const originalText = downloadQrBtn.textContent;
    downloadQrBtn.textContent = "✅ Downloaded!";

    setTimeout(() => {
      downloadQrBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    alert("QR code download failed: " + error.message);
  }
}

// Add to favorites
async function addCurrentToFavorites() {
  if (currentUrlData) {
    await addToFavorites(currentUrlData);
  }
}

// Create custom short URL
async function createCustomShortUrl() {
  const customCode = customCodeInput.value.trim();
  if (customCode) {
    await shortenUrl(currentLongUrl, customCode);
  }
}

// Tab switching
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;

    // Update active tab button
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update active tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${tabName}-tab`).classList.add("active");

    // Load data for history/favorites
    if (tabName === "history") {
      loadHistory();
    } else if (tabName === "favorites") {
      loadFavorites();
    }
  });
});

// Event Listeners
copyBtn.addEventListener("click", copyToClipboard);
openBtn.addEventListener("click", openShortUrl);
downloadQrBtn.addEventListener("click", downloadQrCode);
addFavoriteBtn.addEventListener("click", addCurrentToFavorites);
retryBtn.addEventListener("click", init);
clearHistoryBtn.addEventListener("click", clearHistory);
clearFavoritesBtn.addEventListener("click", clearFavorites);

// Click on short URL to copy
shortUrlDiv.addEventListener("click", copyToClipboard);

// Custom code input - Enter key to create
customCodeInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    createCustomShortUrl();
  }
});

// Start the extension
init();
loadHistory();
loadFavorites();
setupUrlItemListeners();

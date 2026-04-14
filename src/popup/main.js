import {
  addFavoriteBtn,
  clearFavoritesBtn,
  clearHistoryBtn,
  clickCountSpan,
  copyBtn,
  customCodeInput,
  downloadQrBtn,
  errorDiv,
  errorMsg,
  expirySpan,
  favoritesList,
  historyList,
  loadingDiv,
  openBtn,
  qrCodeImg,
  resultDiv,
  retryBtn,
  shortKeySpan,
  shortUrlDiv,
  tabBtns,
} from "./dom.js";
import { createShortUrl, getQrCodeUrl } from "./api.js";
import {
  addToFavoritesStorage,
  clearFavoritesStorage,
  clearHistoryStorage,
  getFavorites,
  getHistory,
  removeFromFavoritesStorage,
  saveToHistory,
} from "./storage.js";

let currentShortUrl = "";
let currentLongUrl = "";
let currentUrlData = null;

async function init() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentLongUrl = tab.url;

    const history = await getHistory();
    const existing = history.find((item) => item.longUrl === currentLongUrl);

    if (existing) {
      currentShortUrl = existing.shortUrl;
      currentUrlData = existing;
      showResult(existing);
      updateClickCount(existing.shortCode);
      return;
    }

    await shortenCurrentUrl();
  } catch (error) {
    showError(`Could not get page URL: ${error.message}`);
  }
}

async function shortenCurrentUrl(customCode = null) {
  showLoading();

  try {
    const urlData = await createShortUrl(currentLongUrl, customCode);
    currentShortUrl = urlData.shortUrl;
    currentUrlData = urlData;

    await saveToHistory(urlData);
    await loadHistory();

    showResult(urlData);
    updateClickCount(urlData.shortCode);

    customCodeInput.value = "";
  } catch (error) {
    console.error("Error details:", error);
    showError(`URL shortening error: ${error.message}`);
  }
}

function updateClickCount() {
  clickCountSpan.textContent = "Loading...";

  setTimeout(() => {
    clickCountSpan.textContent = "N/A (Stats unavailable)";
  }, 500);
}

function showLoading() {
  loadingDiv.classList.remove("hidden");
  resultDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");
}

function showResult(data) {
  loadingDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");
  resultDiv.classList.remove("hidden");

  shortUrlDiv.textContent = data.shortUrl;
  shortKeySpan.textContent = data.shortCode;
  qrCodeImg.src = getQrCodeUrl(data.shortUrl, 200);
  expirySpan.textContent = "Permanent";

  if (data.clicks !== undefined) {
    clickCountSpan.textContent = data.clicks;
  }
}

function showError(message) {
  loadingDiv.classList.add("hidden");
  resultDiv.classList.add("hidden");
  errorDiv.classList.remove("hidden");
  errorMsg.textContent = message;
}

async function loadHistory() {
  const history = await getHistory();

  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-message">No history yet</p>';
    return;
  }

  historyList.innerHTML = history.map((item) => createUrlItem(item, false)).join("");
}

async function loadFavorites() {
  const favorites = await getFavorites();

  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-message">No favorites yet</p>';
    return;
  }

  favoritesList.innerHTML = favorites.map((item) => createUrlItem(item, true)).join("");
}

function createUrlItem(item, isFavorite) {
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `
    <div class="url-item" data-short-url="${item.shortUrl}" data-item-id="item-${item.shortCode}">
      <div class="url-item-header">
        <span class="url-item-short" data-url="${item.shortUrl}">${item.shortUrl}</span>
        <div class="url-item-actions">
          <button class="copy-url-btn" data-url="${item.shortUrl}">📋 Copy</button>
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
        <img src="${getQrCodeUrl(item.shortUrl, 150)}" alt="QR Code" />
      </div>
    </div>
  `;
}

function setupUrlItemListeners() {
  historyList.addEventListener("click", handleUrlItemClick);
  favoritesList.addEventListener("click", handleUrlItemClick);
}

function handleUrlItemClick(event) {
  const target = event.target;
  const urlItem = target.closest(".url-item");

  if (urlItem && !target.closest(".url-item-actions") && !target.closest(".url-item-short")) {
    document.querySelectorAll(".url-item.expanded").forEach((item) => {
      if (item !== urlItem) {
        item.classList.remove("expanded");
      }
    });

    urlItem.classList.toggle("expanded");
  }

  if (target.classList.contains("url-item-short")) {
    chrome.tabs.create({ url: target.dataset.url });
    event.stopPropagation();
    return;
  }

  if (target.classList.contains("copy-url-btn")) {
    navigator.clipboard.writeText(target.dataset.url).then(() => {
      const originalText = target.textContent;
      target.textContent = "✅ Copied!";
      setTimeout(() => {
        target.textContent = originalText;
      }, 2000);
    });
    event.stopPropagation();
    return;
  }

  if (target.classList.contains("add-favorite-btn")) {
    getHistory().then(async (history) => {
      const item = history.find((entry) => entry.shortUrl === target.dataset.url);
      if (item) {
        await addToFavorites(item);
      }
    });
    event.stopPropagation();
    return;
  }

  if (target.classList.contains("remove-favorite-btn")) {
    removeFromFavorites(target.dataset.url);
    event.stopPropagation();
  }
}

async function addToFavorites(urlData) {
  const added = await addToFavoritesStorage(urlData);
  await loadFavorites();

  if (!added) {
    alert("Already in favorites!");
    return;
  }

  const originalText = addFavoriteBtn.textContent;
  addFavoriteBtn.textContent = "✅ Added!";
  setTimeout(() => {
    addFavoriteBtn.textContent = originalText;
  }, 2000);
}

async function removeFromFavorites(shortUrl) {
  await removeFromFavoritesStorage(shortUrl);
  await loadFavorites();
}

async function clearHistory() {
  if (confirm("Clear all history?")) {
    await clearHistoryStorage();
    await loadHistory();
  }
}

async function clearFavorites() {
  if (confirm("Clear all favorites?")) {
    await clearFavoritesStorage();
    await loadFavorites();
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(currentShortUrl);

    const originalText = copyBtn.textContent;
    copyBtn.textContent = "✅ Copied!";
    copyBtn.classList.add("copied");

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch (error) {
    alert(`Copy failed: ${error.message}`);
  }
}

function openShortUrl() {
  chrome.tabs.create({ url: currentShortUrl });
}

async function downloadQrCode() {
  try {
    const response = await fetch(qrCodeImg.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${currentShortUrl.split("/").pop()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const originalText = downloadQrBtn.textContent;
    downloadQrBtn.textContent = "✅ Downloaded!";

    setTimeout(() => {
      downloadQrBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    alert(`QR code download failed: ${error.message}`);
  }
}

async function addCurrentToFavorites() {
  if (currentUrlData) {
    await addToFavorites(currentUrlData);
  }
}

async function createCustomShortUrl() {
  const customCode = customCodeInput.value.trim();
  if (customCode) {
    await shortenCurrentUrl(customCode);
  }
}

function setupTabs() {
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      tabBtns.forEach((tabBtn) => tabBtn.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });
      document.getElementById(`${tabName}-tab`).classList.add("active");

      if (tabName === "history") {
        loadHistory();
      } else if (tabName === "favorites") {
        loadFavorites();
      }
    });
  });
}

function setupEventListeners() {
  copyBtn.addEventListener("click", copyToClipboard);
  openBtn.addEventListener("click", openShortUrl);
  downloadQrBtn.addEventListener("click", downloadQrCode);
  addFavoriteBtn.addEventListener("click", addCurrentToFavorites);
  retryBtn.addEventListener("click", init);
  clearHistoryBtn.addEventListener("click", clearHistory);
  clearFavoritesBtn.addEventListener("click", clearFavorites);
  shortUrlDiv.addEventListener("click", copyToClipboard);

  customCodeInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      createCustomShortUrl();
    }
  });
}

setupTabs();
setupEventListeners();
setupUrlItemListeners();
init();
loadHistory();
loadFavorites();

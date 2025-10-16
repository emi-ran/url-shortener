const API_URL = "https://is.gd/create.php";

// DOM Elements
const loadingDiv = document.getElementById("loading");
const resultDiv = document.getElementById("result");
const errorDiv = document.getElementById("error");
const shortUrlDiv = document.getElementById("shortUrl");
const qrCodeImg = document.getElementById("qrCode");
const shortKeySpan = document.getElementById("shortKey");
const expirySpan = document.getElementById("expiry");
const errorMsg = document.getElementById("errorMsg");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");
const downloadQrBtn = document.getElementById("downloadQrBtn");
const newBtn = document.getElementById("newBtn");
const retryBtn = document.getElementById("retryBtn");

let currentShortUrl = "";
let currentLongUrl = "";

// Initialize - Get current tab URL and shorten it
async function init() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentLongUrl = tab.url;
    await shortenUrl(currentLongUrl);
  } catch (error) {
    showError("Could not get page URL: " + error.message);
  }
}

// Shorten URL function
async function shortenUrl(url) {
  showLoading();

  try {
    // Ensure URL starts with http/https
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    console.log("URL to shorten:", url);

    // is.gd API - works with GET request
    const apiUrl = `${API_URL}?format=json&url=${encodeURIComponent(url)}`;
    console.log("Request URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
    });

    console.log("Response status:", response.status);

    const responseText = await response.text();
    console.log("Response text:", responseText);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = JSON.parse(responseText);
    console.log("Parsed data:", data);

    if (data.shorturl) {
      currentShortUrl = data.shorturl;
      // Create data compatible with is.gd format
      const resultData = {
        sUrl: data.shorturl,
        key: data.shorturl.split("/").pop(),
        lUrl: url,
        expDt: null, // is.gd creates permanent links
        click: 0,
      };
      showResult(resultData);
    } else if (data.errormessage) {
      throw new Error(data.errormessage);
    } else {
      throw new Error("Could not get shortened URL");
    }
  } catch (error) {
    console.error("Error details:", error);
    showError("URL shortening error: " + error.message);
  }
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

  shortUrlDiv.textContent = data.sUrl;
  shortKeySpan.textContent = data.key;

  // Generate QR Code - using QR Server API (free)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    data.sUrl
  )}`;
  qrCodeImg.src = qrApiUrl;

  // Format expiry date
  if (data.expDt) {
    const expDate = new Date(data.expDt);
    const formattedDate = expDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expirySpan.textContent = formattedDate;
  } else {
    expirySpan.textContent = "Permanent";
  }
}

// Show error
function showError(message) {
  loadingDiv.classList.add("hidden");
  resultDiv.classList.add("hidden");
  errorDiv.classList.remove("hidden");
  errorMsg.textContent = message;
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

// Shorten new URL (current tab)
function shortenNewUrl() {
  init();
}

// Event Listeners
copyBtn.addEventListener("click", copyToClipboard);
openBtn.addEventListener("click", openShortUrl);
downloadQrBtn.addEventListener("click", downloadQrCode);
newBtn.addEventListener("click", shortenNewUrl);
retryBtn.addEventListener("click", init);

// Click on short URL to copy
shortUrlDiv.addEventListener("click", copyToClipboard);

// Start the extension
init();

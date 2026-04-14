const API_URL = "https://is.gd/create.php";

export async function createShortUrl(url, customCode = null) {
  let normalizedUrl = url;

  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let apiUrl = `${API_URL}?format=json&url=${encodeURIComponent(normalizedUrl)}`;
  if (customCode?.trim()) {
    apiUrl += `&shorturl=${encodeURIComponent(customCode.trim())}`;
  }

  const response = await fetch(apiUrl, { method: "GET" });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const data = JSON.parse(responseText);

  if (data.shorturl) {
    return {
      shortUrl: data.shorturl,
      longUrl: normalizedUrl,
      shortCode: data.shorturl.split("/").pop(),
      createdAt: Date.now(),
      clicks: 0,
    };
  }

  if (data.errormessage) {
    if (data.errormessage.includes("already exists")) {
      throw new Error("This custom code is already taken. Please try another one.");
    }

    throw new Error(data.errormessage);
  }

  throw new Error("Could not get shortened URL");
}

export function getQrCodeUrl(url, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

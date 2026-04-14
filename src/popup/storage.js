export async function getHistory() {
  const result = await chrome.storage.local.get(["history"]);
  return result.history || [];
}

export async function saveToHistory(urlData) {
  let history = await getHistory();

  const existingIndex = history.findIndex((item) => item.shortUrl === urlData.shortUrl);
  if (existingIndex >= 0) {
    history[existingIndex] = { ...history[existingIndex], ...urlData };
  } else {
    history.unshift(urlData);
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
  }

  await chrome.storage.local.set({ history });
}

export async function clearHistoryStorage() {
  await chrome.storage.local.set({ history: [] });
}

export async function getFavorites() {
  const result = await chrome.storage.local.get(["favorites"]);
  return result.favorites || [];
}

export async function addToFavoritesStorage(urlData) {
  const favorites = await getFavorites();
  const exists = favorites.some((item) => item.shortUrl === urlData.shortUrl);

  if (exists) {
    return false;
  }

  favorites.unshift(urlData);
  await chrome.storage.local.set({ favorites });
  return true;
}

export async function removeFromFavoritesStorage(shortUrl) {
  const favorites = await getFavorites();
  const nextFavorites = favorites.filter((item) => item.shortUrl !== shortUrl);
  await chrome.storage.local.set({ favorites: nextFavorites });
}

export async function clearFavoritesStorage() {
  await chrome.storage.local.set({ favorites: [] });
}

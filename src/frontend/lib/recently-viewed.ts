const STORAGE_KEY = 'stand_recently_viewed';
const MAX_ITEMS = 10;

export function getRecentlyViewed(): number[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function addRecentlyViewed(id: number) {
  const items = getRecentlyViewed().filter((i) => i !== id);
  items.unshift(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

const KEY = "travel-app.selected-trip";

export function getSelectedTrip(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setSelectedTrip(slug: string) {
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    /* private mode 等情況忽略 */
  }
}

export function clearSelectedTrip() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

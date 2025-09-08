import { RECENT_SEARCHES_KEY, RENTALS_KEY } from "./constants.js";

/**
 * Formats a Date object into a string.
 * @param {Date} date The date object to format.
 * @param {string} format The desired format string (e.g., "YYYY-MM-DD").
 * @returns {string} The formatted date string.
 */
export function formatDate(date, format) {
  if (!(date instanceof Date) || isNaN(date)) {
    console.warn("Invalid date provided to formatDate:", date);
    return ""; // Return empty string or handle error appropriately
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  // Default to YYYY-MM-DD if no specific format is recognized
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object into a human-readable string including time.
 * @param {Date} date The date object to format.
 * @returns {string} The formatted date and time string.
 */
export function formatDisplayDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    console.warn("Invalid date provided to formatDisplayDate:", date);
    return "Invalid Date";
  }
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
  return date.toLocaleString('en-US', options);
}

export function parseRarity(cardName) {
  return /\(starr\)/i.test(cardName) ? "Starlight" : "Mythic";
}

export function baseName(cardName) {
  return cardName.replace(/\s*\s*\(\s*starr\s*\)\s*/i, "").trim();
}

export function priceFor(cardName) {
  const rarity = parseRarity(cardName);
  return rarity === "Starlight" ? 15000 : 10000; 
}

export function getRecentSearches() {
  try {
    const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
    return recent ? JSON.parse(recent) : [];
  } catch (error) {
    console.error("Failed to parse recent searches from localStorage:", error);
    return [];
  }
}

export function addRecentSearch(query) {
  if (!query) return;
  const recent = getRecentSearches().filter(item => item.toLowerCase() !== query.toLowerCase());
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5))); 
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export function getRentalsFromLocalStorage() {
  try {
    const rentals = localStorage.getItem(RENTALS_KEY);
    return rentals ? JSON.parse(rentals) : [];
  } catch (error) {
    console.error("Failed to parse rentals from localStorage:", error);
    return [];
  }
}

export function addRentalToLocalStorage(items, discordUser) {
  const currentRentals = getRentalsFromLocalStorage();
  const newRental = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(), // Use native Date and toISOString
    discordUser,
    items,
  };
  currentRentals.unshift(newRental); 
  localStorage.setItem(RENTALS_KEY, JSON.stringify(currentRentals));
}

export function removeRentalFromLocalStorage(rentalId) {
  let rentals = getRentalsFromLocalStorage();
  rentals = rentals.filter(r => r.id !== rentalId);
  localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
}

export function throttle(func, limit) {
  let inThrottle;
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

export function formatLongDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

import dayjs from "dayjs";
import { RECENT_SEARCHES_KEY, RENTALS_KEY } from "./constants.js";

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
    timestamp: dayjs().toISOString(),
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

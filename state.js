import { ELEMENTS } from "./data.js";
import { addRentalToLocalStorage, removeRentalFromLocalStorage, getRentalsFromLocalStorage, formatDate } from "./utils.js";

const appState = {
  elements: ELEMENTS.reduce((acc, el) => ({ ...acc, [el]: 0 }), {}),
  query: "",
  rarity: "",
};

let cartItems = [];
let currentDetailsCard = null;

let calendarState = {
  currentDate: new Date(), // Use native Date object
  activeInput: null,    // The input element that triggered the calendar
  onSelectCallback: null, // Callback to update the input's value
  selectedDate: null,   // The date selected by the user in the calendar
};

export const getAppState = () => ({ ...appState });
export const getCartItems = () => [...cartItems];
export const getCurrentDetailsCard = () => currentDetailsCard;
export const getCalendarState = () => ({ ...calendarState });
export const getRentals = getRentalsFromLocalStorage;

export function setQuery(query) {
  appState.query = query;
}

export function setRarity(rarity) {
  appState.rarity = rarity;
}

export function toggleElementFilter(element) {
  appState.elements[element] = (appState.elements[element] + 1) % 3;
}

export function resetFilters() {
  appState.elements = ELEMENTS.reduce((acc, el) => ({ ...acc, [el]: 0 }), {});
  appState.query = "";
  appState.rarity = "";
}

export function addToCart(card) {
  // Always add as a new item, allowing multiple of the same card
  cartItems.push({
    ...card,
    uuid: crypto.randomUUID(),
    startDate: formatDate(new Date(), "YYYY-MM-DD"), // Format new Date()
    duration: 1,
    total: card.perDay,
  });
}

export function removeFromCart(uuid) {
  cartItems = cartItems.filter(item => item.uuid !== uuid);
}

export function updateCartItemDetails(uuid, key, value) {
  const itemIndex = cartItems.findIndex(item => item.uuid === uuid);
  if (itemIndex > -1) {
    const item = cartItems[itemIndex];
    item[key] = value;
    if (key === "duration" || key === "startDate") {
      if (key === "duration") {
        item.duration = Math.max(1, Math.min(30, parseInt(value, 10) || 1));
      }
      // Recalculate total if duration or start date changes
      item.total = item.duration * item.perDay;
    }
    cartItems[itemIndex] = item;
  }
}

export function clearCart() {
  cartItems = [];
}

export function setCalendarActiveInput(inputElement) {
  calendarState.activeInput = inputElement;
}

export function setCalendarOnSelectCallback(callback) {
  calendarState.onSelectCallback = callback;
}

export function setCurrentCalendarMonth(date) {
  // Ensure we set to the first day of the month to keep consistent reference
  const newDate = new Date(date);
  newDate.setDate(1); 
  calendarState.currentDate = newDate;
}

export function setSelectedDateInCalendar(date) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0); // Normalize to start of day for accurate comparison
  calendarState.selectedDate = newDate;
}

export function resetCalendarState() {
  calendarState = {
    currentDate: new Date(),
    activeInput: null,
    onSelectCallback: null,
    selectedDate: null,
  };
  calendarState.currentDate.setDate(1); // Set to first day of current month
}

export function setCurrentDetailsCard(card) {
  currentDetailsCard = card;
}

export function recordRental(rentalDetails, discordUser) {
  addRentalToLocalStorage(rentalDetails, discordUser);
}

export function removeRentalById(rentalId) {
  removeRentalFromLocalStorage(rentalId);
}

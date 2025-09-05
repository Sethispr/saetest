import dayjs from "dayjs";
import { getDomElements } from "./domElements.js";
import { data, ELEMENTS } from "./data.js";
import { 
  getAppState, 
  getCartItems, 
  getCalendarState, 
  getRentals, 
  setQuery, 
  addToCart, 
  updateCartItemDetails, 
  removeFromCart, 
  removeRentalById 
} from "./state.js";
import { 
  parseRarity, 
  baseName, 
  priceFor, 
  getRecentSearches, 
  addRecentSearch, 
  clearRecentSearches 
} from "./utils.js";
import { toast } from "./toasts.js";
import { openDetailsModal, openCalendarModal, openImageZoom } from "./modals.js";

const D = getDomElements();

export function renderElementFilterButtons() {
  D.elementFilters.innerHTML = "";
  const { elements: appElementsState } = getAppState();

  ELEMENTS.forEach(el => {
    const btn = document.createElement("button");
    btn.className = "element-tag";
    btn.dataset.element = el;
    btn.dataset.state = appElementsState[el];
    btn.innerHTML = `<span class="element-tag-dot"></span><span>${el}</span>`;
    btn.addEventListener("click", () => {
      // Logic for updating state is in app.js listener
    });
    D.elementFilters.appendChild(btn);
  });
}

function cardComponent(card) {
  const { element, name, image } = card;
  const rarity = parseRarity(name);
  const n = baseName(name);
  const perDay = priceFor(name);

  const el = document.createElement("div");
  el.className = "card rounded-xl border border-neutral-800 bg-neutral-950 shadow-soft flex p-3 gap-4 items-start cursor-pointer"; 
  el.innerHTML = `
    <div class="flex-shrink-0 w-32 h-24 rounded-md bg-transparent p-1 flex items-center justify-center">
      ${image 
        ? `<img src="${image}" alt="${n}" class="w-full h-full object-contain" loading="lazy">` 
        : `<div class="w-full h-full grid place-items-center text-neutral-600 text-2xl font-bold">${n.charAt(0).toUpperCase()}</div>`}
    </div>
    <div class="flex-grow flex flex-col justify-between self-stretch">
      <div>
        <p class="text-neutral-100 font-medium leading-tight">${n}</p>
        <div class="flex items-center gap-2 mt-1.5 text-xs">
          <span class="element-badge element-badge-${element.toLowerCase()} rounded-md border px-1.5 py-0.5 font-medium">${element}</span>
          <span class="text-neutral-500">${rarity}</span>
        </div>
      </div>
      <div class="flex items-center justify-between mt-2">
        <div class="text-neutral-300 text-sm">${perDay.toLocaleString()} coins / day</div>
        <div class="flex items-center gap-2">
          <button class="details inline-flex items-center justify-center rounded-md border border-neutral-800 h-8 w-8 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors" aria-label="Show details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
          </button>
          <button class="add-to-cart inline-flex items-center justify-center rounded-md bg-neutral-100 text-neutral-900 h-8 w-8 text-sm font-medium hover:bg-white transition" aria-label="Add to cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </button>
        </div>
      </div>
    </div>
  `;
  el.addEventListener("click", (event) => {
    if (event.target.closest(".add-to-cart") || event.target.closest(".details")) {
      return;
    }
    openDetailsModal({ element, name: n, rarity, perDay, image, details: card.details });
  });
  el.querySelector(".add-to-cart").addEventListener("click", (event) => {
    event.stopPropagation(); 
    addToCart({ element, name: n, rarity, perDay, image, cardId: name });
    toast(`Added "${n}" to cart.`);
    updateCartDisplayCount();
  });
  el.querySelector(".details").addEventListener("click", (event) => {
    event.stopPropagation(); 
    openDetailsModal({ element, name: n, rarity, perDay, image, details: card.details });
  });
  return el;
}

function filterData() {
  const { elements: appElementsState, query, rarity } = getAppState();

  let allCards = [];
  ELEMENTS.forEach(el => {
    data[el].forEach(cardObj => allCards.push({ element: el, ...cardObj }));
  });

  const includedElements = Object.keys(appElementsState).filter(el => appElementsState[el] === 1);
  const excludedElements = Object.keys(appElementsState).filter(el => appElementsState[el] === 2);

  let items = allCards;
  if (includedElements.length > 0) {
    items = items.filter(card => includedElements.includes(card.element));
  }
  if (excludedElements.length > 0) {
    items = items.filter(card => !excludedElements.includes(card.element));
  }

  if (query) {
    const q = query.toLowerCase();
    items = items.filter(i => baseName(i.name).toLowerCase().includes(q));
  }

  if (rarity) {
    items = items.filter(i => parseRarity(i.name) === rarity);
  }
  return items;
}

export function renderCatalogGrid() {
  D.grid.innerHTML = ""; 
  D.emptyState.classList.add("hidden"); 

  const items = filterData();
  if (items.length === 0) {
    D.emptyState.classList.remove("hidden");
    return;
  }
  D.emptyState.classList.add("hidden");
  items.forEach(card => D.grid.appendChild(cardComponent(card)));
  updateCartDisplayCount();
}

export function updateCartDisplayCount() {
  D.cartCountSpan.textContent = `Cart (${getCartItems().length})`;
}

export function renderCartItems() {
  D.cartItemsList.innerHTML = "";
  let grandTotal = 0;
  const currentCartItems = getCartItems();

  if (currentCartItems.length === 0) {
    D.cartItemsList.innerHTML = `<div class="text-neutral-500 text-center py-4">Your cart is empty.</div>`;
    D.cartGrandTotal.textContent = "0 coins";
    D.confirmCheckoutBtn.disabled = true;
    return;
  }
  D.confirmCheckoutBtn.disabled = false;

  currentCartItems.forEach(item => {
    grandTotal += item.total;
    const cartItemEl = document.createElement("div");
    cartItemEl.className = "flex flex-col gap-3 p-3 border border-neutral-800 rounded-md bg-neutral-900";
    cartItemEl.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="text-neutral-100 font-medium">${item.name}</p>
          <p class="text-neutral-500 text-xs">${item.element} • ${item.rarity} • ${item.perDay.toLocaleString()}/d</p>
        </div>
        <span class="text-sm text-neutral-300">${item.total.toLocaleString()} coins</span>
        <button data-uuid="${item.uuid}" class="remove-from-cart text-neutral-400 hover:text-red-400 transition-colors" aria-label="Remove card">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <label>
          <span class="block mb-1 text-neutral-400">Start date</span>
          <input type="text" value="${item.startDate}" data-uuid="${item.uuid}" data-key="startDate" class="cart-item-input w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 h-9 focus:ring-2 focus:ring-neutral-700/60 date-input" readonly />
        </label>
        <label>
          <span class="block mb-1 text-neutral-400">Duration (days)</span>
          <input type="number" min="1" max="30" value="${item.duration}" data-uuid="${item.uuid}" data-key="duration" class="cart-item-input w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 h-9 focus:ring-2 focus:ring-neutral-700/60" />
        </label>
      </div>
    `;
    D.cartItemsList.appendChild(cartItemEl);

    const startDateInput = cartItemEl.querySelector(`input[data-key="startDate"]`);
    startDateInput.addEventListener("click", (e) => {
      openCalendarModal(e.currentTarget, item.startDate, (selectedDate) => {
        updateCartItemDetails(item.uuid, "startDate", selectedDate);
        renderCartItems(); // Re-render cart to update total/item display
      });
    });
  });

  D.cartGrandTotal.textContent = `${grandTotal.toLocaleString()} coins`;

  D.cartItemsList.querySelectorAll(".remove-from-cart").forEach(btn => {
    btn.addEventListener("click", (e) => {
      removeFromCart(e.currentTarget.dataset.uuid);
      renderCartItems(); 
      updateCartDisplayCount();
      toast("Card removed from cart.");
    });
  });

  D.cartItemsList.querySelectorAll(".cart-item-input").forEach(input => {
    if (input.dataset.key === "duration") {
      input.addEventListener("input", (e) => {
        let value = parseInt(e.currentTarget.value, 10);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 30) value = 30; 
        e.currentTarget.value = value; 
        updateCartItemDetails(e.currentTarget.dataset.uuid, "duration", value);
        renderCartItems(); 
      });
    }
  });
}

export function updateDetailsModalContent(card) {
  const { element, name, rarity, perDay, image, details } = card;

  D.detailsTitle.textContent = name;
  D.detailsBody.innerHTML = `
    <div class="space-y-4">
      <div class="flex-shrink-0 w-full h-48 rounded-md bg-transparent p-1 flex items-center justify-center overflow-hidden">
        ${image
          ? `<img src="${image}" alt="${name}" id="details-card-image" class="w-full h-full object-contain cursor-zoom-in" loading="lazy">`
          : `<div class="w-full h-full grid place-items-center text-neutral-600 text-6xl font-bold">${name.charAt(0).toUpperCase()}</div>`}
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span class="element-badge element-badge-${element.toLowerCase()} rounded-md border px-2 py-1 font-medium">${element}</span>
        <span class="text-neutral-400">${rarity}</span>
      </div>
      <p class="text-neutral-300 text-lg font-medium">${perDay.toLocaleString()} coins / day</p>
      <div class="text-neutral-400 text-sm">
        <h4 class="font-medium text-neutral-200 mb-2">Description</h4>
        <p>${details || 'No detailed description available for this card.'}</p>
      </div>
      <div class="border-t border-neutral-800 pt-4 flex justify-end">
        <button id="add-to-cart-from-details" class="inline-flex items-center gap-2 rounded-md bg-neutral-100 text-neutral-900 px-4 py-2.5 text-sm font-medium hover:bg-white transition">
          Add to Cart
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </button>
      </div>
    </div>
  `;
  D.detailsDialog.querySelector("#add-to-cart-from-details").addEventListener("click", () => {
    addToCart({ element, name: card.name, rarity, perDay, image, cardId: card.name, details: card.details });
    toast(`Added "${card.name}" to cart.`);
    updateCartDisplayCount();
  });

  const cardImage = D.detailsBody.querySelector('#details-card-image');
  if (cardImage) {
    cardImage.addEventListener('click', () => {
      openImageZoom(cardImage.src);
    });
  }
}

export function renderCalendarView(onDayClickCallback) {
  const { currentDate, selectedDate } = getCalendarState();

  D.calendarDaysGrid.innerHTML = "";
  D.calendarMonthYearSpan.textContent = currentDate.format("MMMM YYYY");

  const startOfMonth = currentDate.startOf("month");
  const endOfMonth = currentDate.endOf("month");
  const today = dayjs().startOf("day");

  let dayToDisplay = startOfMonth.startOf("week");

  for (let i = 0; i < 42; i++) { 
    const dayEl = document.createElement("button");
    dayEl.className = "calendar-day";
    dayEl.textContent = dayToDisplay.date();
    dayEl.dataset.date = dayToDisplay.format("YYYY-MM-DD");

    const currentDayForListener = dayToDisplay.clone();

    if (currentDayForListener.isBefore(today, 'day')) {
      dayEl.classList.add("calendar-disabled");
      dayEl.disabled = true;
    } else if (currentDayForListener.isSame(today, 'day')) {
      dayEl.classList.add("calendar-today");
    }

    if (!currentDayForListener.isSame(currentDate, 'month')) {
      dayEl.classList.add("calendar-other-month");
      dayEl.disabled = true; 
    }

    if (selectedDate && currentDayForListener.isSame(selectedDate, 'day')) {
      dayEl.classList.add("calendar-selected");
    }

    if (!dayEl.disabled) {
      dayEl.addEventListener("click", () => {
        onDayClickCallback(dayjs(dayEl.dataset.date));
      });
    }

    D.calendarDaysGrid.appendChild(dayEl);
    dayToDisplay = dayToDisplay.add(1, 'day');
  }
}

export function renderRentalsView() {
  const rentals = getRentals();
  D.rentalsList.innerHTML = "";

  if (rentals.length === 0) {
    D.rentalsList.innerHTML = `<div class="text-neutral-500 text-center py-4">No past rentals found.</div>`;
    return;
  }

  rentals.forEach(rental => {
    const rentalTotal = rental.items.reduce((sum, item) => sum + item.total, 0);

    const rentalEl = document.createElement("div");
    rentalEl.className = "p-4 border border-neutral-800 rounded-md bg-neutral-900 space-y-3";
    rentalEl.dataset.rentalId = rental.id; // Add data-rental-id to the main div
    rentalEl.innerHTML = `
      <div class="flex items-center justify-between text-xs text-neutral-500">
        <span>Requested on ${dayjs(rental.timestamp).format("MMM D, YYYY h:mm A")}</span>
        <button data-rental-id="${rental.id}" class="cancel-rental-btn text-neutral-400 hover:text-red-400 transition-colors" aria-label="Cancel rental">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <p class="font-medium text-neutral-100">Requested by: ${rental.discordUser}</p>
      <div class="space-y-2">
        ${rental.items.map(item => `
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-12 h-12 rounded-md bg-transparent p-0.5 flex items-center justify-center overflow-hidden">
              ${item.image
                ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain" loading="lazy">`
                : `<div class="w-full h-full grid place-items-center text-neutral-600 text-lg font-bold">${item.name.charAt(0).toUpperCase()}</div>`}
            </div>
            <div class="flex-grow">
              <p class="text-neutral-200 font-medium">${item.name}</p>
              <p class="text-neutral-400 text-xs">${item.startDate} for ${item.duration} days</p>
            </div>
            <span class="text-neutral-300 text-sm">${item.total.toLocaleString()} coins</span>
          </div>
        `).join('')}
      </div>
      <div class="border-t border-neutral-800 pt-3 flex justify-between items-center text-sm font-medium">
        <span>Total:</span>
        <span>${rentalTotal.toLocaleString()} coins</span>
      </div>
    `;
    D.rentalsList.appendChild(rentalEl);
  });

  D.rentalsList.querySelectorAll(".cancel-rental-btn").forEach(button => {
    button.addEventListener("click", (e) => {
      const rentalId = e.currentTarget.dataset.rentalId;
      const rentalDomElement = e.currentTarget.closest(".p-4.border");
      if (rentalDomElement) {
        animateAndRemoveRental(rentalId, rentalDomElement);
      }
    });
  });
}

function animateAndRemoveRental(rentalId, rentalDomElement) {
  rentalDomElement.style.height = `${rentalDomElement.scrollHeight}px`;
  rentalDomElement.classList.add("rental-item-removing");
  toast("Rental request cancelled.", "info");

  rentalDomElement.addEventListener("animationend", () => {
    rentalDomElement.remove();
    removeRentalById(rentalId);
    if (getRentals().length === 0) {
      D.rentalsList.innerHTML = `<div class="text-neutral-500 text-center py-4">No past rentals found.</div>`;
    }
  }, { once: true });
}

// Helper function to highlight the query part in suggestions
function highlightMatch(text, query) {
  if (!query) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text; // No match

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return `${before}<span class="font-medium text-white">${match}</span>${after}`;
}

export function renderSearchSuggestions() {
  D.suggestionsContainer.innerHTML = "";
  D.suggestionsContainer.classList.add("search-fade-out");
  D.suggestionsContainer.classList.remove("search-fade-in");

  const { query } = getAppState();
  let suggestions = []; // This will be an array of strings (card base names or recent searches)

  const allDetailedCardsMap = new Map();
  ELEMENTS.forEach(el => {
    data[el].forEach(cardObj => {
      const baseNameVal = baseName(cardObj.name);
      if (!allDetailedCardsMap.has(baseNameVal)) { // Store unique base names
        allDetailedCardsMap.set(baseNameVal, {
          element: el,
          name: cardObj.name, // Full name with (starr) if present
          rarity: parseRarity(cardObj.name)
        });
      }
    });
  });

  const uniqueBaseCardNames = [...allDetailedCardsMap.keys()];

  if (query) {
    // 1. Card suggestions based on name match
    const matchingCardNames = uniqueBaseCardNames.filter(name =>
      name.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => {
        const aStartsWith = a.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.toLowerCase().startsWith(query.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
    }).slice(0, 5); // Limit card name suggestions

    // 2. Recent searches that also match the query
    const recentSearches = getRecentSearches().filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    );

    // Combine and deduplicate strings. Prioritize card matches.
    const uniqueSuggestionsSet = new Set();
    
    // Add card names first
    matchingCardNames.forEach(name => uniqueSuggestionsSet.add(name));
    // Then add recent searches, avoiding duplicates of card names
    recentSearches.forEach(text => {
      if (!uniqueSuggestionsSet.has(text)) { // Only add if not already a card suggestion
        uniqueSuggestionsSet.add(text);
      }
    });

    suggestions = Array.from(uniqueSuggestionsSet).slice(0, 8); // Overall limit for combined suggestions
  } else {
    // If no query, just show recent searches
    suggestions = getRecentSearches();
  }

  if (suggestions.length === 0 && !query) {
    return;
  }

  D.suggestionsContainer.classList.remove("search-fade-out");
  D.suggestionsContainer.classList.add("search-fade-in");

  // Display "Recent searches" header if there are recent searches
  const hasGlobalRecentSearches = getRecentSearches().length > 0;
  if (hasGlobalRecentSearches && (!query || suggestions.some(s => getRecentSearches().includes(s)))) {
    const title = document.createElement("div");
    title.className = "flex items-center justify-between px-3 py-2 text-xs text-neutral-500 border-b border-neutral-800";
    title.innerHTML = `<span>Recent searches</span> <button class="text-neutral-600 hover:text-neutral-400 transition-colors" id="clear-recent-searches">Clear</button>`;
    D.suggestionsContainer.appendChild(title);

    title.querySelector("#clear-recent-searches").addEventListener("click", (e) => {
      e.stopPropagation(); 
      clearRecentSearches();
      renderSearchSuggestions();
    });
  }

  suggestions.forEach(itemText => { // itemText is now a string
    const itemEl = document.createElement("div");
    itemEl.className = "suggest-item";
    itemEl.dataset.value = itemText;
    let displayHtml = '';
    let iconSvg = '';
    const isCardSuggestion = allDetailedCardsMap.has(itemText);
    
    if (isCardSuggestion) {
      const cardDetails = allDetailedCardsMap.get(itemText);
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 text-neutral-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`;
      displayHtml = `
        <span class="flex-grow">${highlightMatch(itemText, query)}</span>
        <span class="element-badge element-badge-${cardDetails.element.toLowerCase()} rounded-full px-2 py-0.5 text-xs font-medium">${cardDetails.element}</span>
        <span class="suggest-tag">${cardDetails.rarity}</span>
      `;
    } else { // It's a pure recent search or "search for query" option
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 text-neutral-400">
                    <path d="M13 10H3M21 10H17"></path><path d="M13 16H3M21 16H17"></path><path d="M14 7l-3-3-3 3"></path><path d="M11 20l3-3-3-3"></path>
                  </svg>`;
      displayHtml = `<span>${highlightMatch(itemText, query)}</span>`;
    }
    
    itemEl.innerHTML = `
      ${iconSvg}
      ${displayHtml}
      <span class="suggest-kbd">↵</span>
    `;
    itemEl.addEventListener("click", (e) => {
      e.stopPropagation(); 
      D.searchInput.value = itemText;
      addRecentSearch(itemText); 
      setQuery(itemText);
      renderCatalogGrid();
      D.suggestionsContainer.classList.add("search-fade-out"); 
      D.suggestionsContainer.classList.remove("search-fade-in");
      // Reset active index after selection
      // This is handled in the main app.js input blur/keydown logic for consistent behavior
    });
    D.suggestionsContainer.appendChild(itemEl);
  });

  // If there's a query and it doesn't exactly match any current suggestion, add a "Search for 'query'" option.
  const queryLower = query.toLowerCase();
  const existsAsSuggestion = suggestions.some(s => s.toLowerCase() === queryLower);
  if (query && !existsAsSuggestion) {
    const searchOptionEl = document.createElement("div");
    searchOptionEl.className = "suggest-item border-t border-neutral-800";
    searchOptionEl.dataset.value = query; 
    searchOptionEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 text-neutral-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
      <span>Search for "<span class="font-medium text-white">${query}</span>"</span>
      <span class="suggest-kbd">↵</span>
    `;
    searchOptionEl.addEventListener("click", (e) => {
      e.stopPropagation(); 
      addRecentSearch(query);
      setQuery(query);
      renderCatalogGrid();
      D.suggestionsContainer.classList.add("search-fade-out"); 
      D.suggestionsContainer.classList.remove("search-fade-in");
    });
    D.suggestionsContainer.appendChild(searchOptionEl);
  }
}

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
  removeRentalById,
  toggleElementFilter
} from "./state.js";
import { 
  parseRarity, 
  baseName, 
  priceFor, 
  getRecentSearches, 
  addRecentSearch, 
  clearRecentSearches,
  formatDate, 
  formatDisplayDate,
  formatLongDate
} from "./utils.js";
import { toast } from "./toasts.js";
import { openDetailsModal, openCalendarModal, openImageZoom, closeDetailsModal } from "./modals.js";

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
      toggleElementFilter(btn.dataset.element);
      btn.dataset.state = getAppState().elements[btn.dataset.element]; // Update dataset state immediately for visual
      renderCatalogGrid();
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
            <i class="fa-solid fa-circle-info text-base"></i>
          </button>
          <button class="add-to-cart inline-flex items-center justify-center rounded-md bg-neutral-100 text-neutral-900 h-8 w-8 text-sm font-medium hover:bg-white transition" aria-label="Add to cart">
            <i class="fa-solid fa-cart-shopping text-base"></i>
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
    D.cartItemsList.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center h-full text-neutral-500">
        <i class="fa-solid fa-cart-shopping fa-3x text-neutral-700 mb-3"></i>
        <h3 class="font-medium text-lg text-neutral-200">Your cart is empty</h3>
        <p class="text-sm text-neutral-500 mt-1">Add cards from the catalog to get started.</p>
      </div>`;
    D.cartGrandTotal.textContent = "0 coins";
    D.confirmCheckoutBtn.disabled = true;
    return;
  }
  D.confirmCheckoutBtn.disabled = false;

  const itemsContainer = document.createElement('div');
  itemsContainer.className = "divide-y divide-neutral-800";
  
  // add tip at top
  const tip = document.createElement('div');
  tip.className = "text-xs text-neutral-400 mb-3 flex items-center";
  tip.innerHTML = `<span class="inline-flex items-center gap-1">
  <i class="fa-solid fa-lightbulb text-sm"></i>
  Tip:</span>&nbsp;Click the Start date to select from the calendar. Duration is in days.`; 
  D.cartItemsList.appendChild(tip);

  currentCartItems.forEach(item => {
    grandTotal += item.total;
    const endDateObj = new Date(item.startDate);
    endDateObj.setDate(endDateObj.getDate() + (parseInt(item.duration, 10) || 1)); // add full duration
    const endDateStr = formatLongDate(endDateObj);
    const cartItemEl = document.createElement("div");
    cartItemEl.className = "flex items-start gap-4 py-4";
    cartItemEl.innerHTML = `
      <div class="flex-shrink-0 w-16 h-24 rounded-md bg-neutral-900 overflow-hidden flex items-center justify-center">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain" loading="lazy">`
          : `<div class="w-full h-full grid place-items-center text-neutral-600 font-bold">${item.name.charAt(0).toUpperCase()}</div>`}
      </div>

      <div class="flex-grow flex flex-col justify-between self-stretch">
        <div>
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium text-neutral-100">${item.name}</p>
              <p class="text-sm text-neutral-400">${item.rarity}</p>
            </div>
             <button data-uuid="${item.uuid}" class="remove-from-cart text-neutral-500 hover:text-red-400 transition-colors p-1 -mr-1" aria-label="Remove ${item.name} from cart">
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        <div class="flex items-end justify-between">
          <div class="flex flex-col gap-1">
            <div class="grid grid-cols-2 gap-3 items-end">
              <label class="text-sm">
                <span class="cart-field-label">Start date</span>
                <input type="text" value="${formatLongDate(new Date(item.startDate))}" data-uuid="${item.uuid}" data-key="startDate" class="cart-input-sm date-input-sm w-36 text-center" readonly aria-label="Start date for ${item.name}"/>
              </label>
              <label class="text-sm">
                <span class="cart-field-label">Duration</span>
                <div class="flex items-center">
                  <input type="number" inputmode="numeric" pattern="\\d*" min="1" max="30" value="${item.duration}" data-uuid="${item.uuid}" data-key="duration" class="cart-input-sm w-16 text-center" aria-label="Duration in days for ${item.name}"/>
                  <span class="cart-duration-label" data-uuid="${item.uuid}">${item.duration === 1 ? 'day' : item.duration + ' days'}</span>
                </div>
              </label>
            </div>
            <span class="cart-field-help">End date: ${endDateStr}</span>
          </div>
          <span class="font-medium text-neutral-200 text-base">${item.total.toLocaleString()} coins</span>
        </div>
      </div>
    `;
    itemsContainer.appendChild(cartItemEl);

    const startDateInput = cartItemEl.querySelector(`input[data-key="startDate"]`);
    startDateInput.addEventListener("click", (e) => {
      openCalendarModal(e.currentTarget, item.startDate, (selectedDate) => {
        updateCartItemDetails(item.uuid, "startDate", formatDate(selectedDate, "YYYY-MM-DD"));
        renderCartItems();
      });
    });
  });  

  D.cartItemsList.appendChild(itemsContainer);

  D.cartGrandTotal.textContent = `${grandTotal.toLocaleString()} coins`;

  D.cartItemsList.querySelectorAll(".remove-from-cart").forEach(btn => {
    btn.addEventListener("click", (e) => {
      removeFromCart(e.currentTarget.dataset.uuid);
      renderCartItems();
      updateCartDisplayCount();
      toast("Card removed from cart.");
    });
  });

  D.cartItemsList.querySelectorAll(".cart-input-sm").forEach(input => {
    if (input.dataset.key === "duration") {
      // Allow empty input while typing (so backspace works on mobile). Only validate on blur.
      input.addEventListener("input", (e) => {
        const raw = e.currentTarget.value;
        // If user cleared field, allow empty string (don't update state yet)
        if (raw === "" || raw === null) {
          e.currentTarget.dataset._pending = "true";
          return;
        }
        // otherwise keep the typed value
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) {
          // display but do not force limits until blur
          e.currentTarget.dataset._pending = "false";
        }
      });
      input.addEventListener("blur", (e) => {
        let value = parseInt(e.currentTarget.value, 10);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 30) value = 30;
        e.currentTarget.value = value;
        e.currentTarget.dataset._pending = "false";
        updateCartItemDetails(e.currentTarget.dataset.uuid, "duration", value);
        renderCartItems();
      });
      // allow ArrowUp/ArrowDown to increment/decrement for keyboard users
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
          ev.preventDefault();
          const step = ev.key === "ArrowUp" ? 1 : -1;
          let cur = parseInt(ev.currentTarget.value, 10);
          if (isNaN(cur)) cur = 0;
          cur = Math.min(30, Math.max(1, cur + step));
          ev.currentTarget.value = cur;
          ev.currentTarget.dispatchEvent(new Event('blur')); // trigger validation/update
        }
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
          <i class="fa-solid fa-cart-shopping text-base"></i>
        </button>
      </div>
    </div>
  `;
  D.detailsDialog.querySelector("#add-to-cart-from-details").addEventListener("click", () => {
    addToCart({ element, name: card.name, rarity, perDay, image, cardId: card.name, details: card.details });
    closeDetailsModal(); // auto-close info modal so toast is visible
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
  D.calendarMonthYearSpan.textContent = `${currentDate.toLocaleString('en-US', { month: 'long' })} ${currentDate.getFullYear()}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const dayToDisplay = new Date(firstDayOfMonth);
  dayToDisplay.setDate(firstDayOfMonth.getDate() - startingDayOfWeek);

  for (let i = 0; i < 42; i++) {
    const dayEl = document.createElement("button");
    dayEl.className = "calendar-day";
    dayEl.textContent = dayToDisplay.getDate();
    dayEl.dataset.date = formatDate(dayToDisplay, 'YYYY-MM-DD');

    const currentDayForListener = new Date(dayToDisplay);

    const isToday = currentDayForListener.toDateString() === today.toDateString();
    const isSelected = selectedDate && currentDayForListener.toDateString() === selectedDate.toDateString();
    const isOtherMonth = currentDayForListener.getMonth() !== currentDate.getMonth();
    
    const isDisabled = currentDayForListener < today || isOtherMonth;

    if (isDisabled) {
      dayEl.classList.add("calendar-disabled");
      dayEl.disabled = true;
    } else if (isToday) {
      dayEl.classList.add("calendar-today");
    }

    if (isOtherMonth) {
      dayEl.classList.add("calendar-other-month");
    }

    if (isSelected) {
      dayEl.classList.add("calendar-selected");
    }

    if (!dayEl.disabled) {
      dayEl.addEventListener("click", () => {
        onDayClickCallback(currentDayForListener);
      });
    }

    D.calendarDaysGrid.appendChild(dayEl);
    dayToDisplay.setDate(dayToDisplay.getDate() + 1);
  }
}

export function renderRentalsView() {
  const rentals = getRentals();
  D.rentalsList.innerHTML = "";

  if (rentals.length === 0) {
    D.rentalsList.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center py-12 text-neutral-500">
        <i class="fa-solid fa-clipboard-list fa-3x text-neutral-700 mb-3"></i>
        <h3 class="font-medium text-lg text-neutral-200">No Rentals Found</h3>
        <p class="text-sm text-neutral-500 mt-1">You haven't requested any card rentals yet.</p>
    </div>`;
    return;
  }

  rentals.forEach(rental => {
    // Ensure rental.items is an array, default to empty array if not
    const rentalItems = Array.isArray(rental.items) ? rental.items : [];
    const rentalTotal = rentalItems.reduce((sum, item) => sum + item.total, 0);

    const rentalEl = document.createElement("div");
    rentalEl.className = "border border-neutral-800 rounded-lg overflow-hidden rental-accordion-item";
    rentalEl.dataset.rentalId = rental.id;
    
    const formattedTimestamp = formatDisplayDate(new Date(rental.timestamp));

    rentalEl.innerHTML = `
      <button class="rental-accordion-trigger flex items-center justify-between w-full p-4 text-left bg-neutral-900 hover:bg-neutral-800/60 transition-colors" aria-expanded="false">
        <div class="flex items-center gap-4">
          <div class="flex flex-col text-left">
            <span class="font-medium text-neutral-100">${rental.discordUser}</span>
            <span class="text-xs text-neutral-400">Requested on ${formattedTimestamp}</span>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-neutral-300">${rentalTotal.toLocaleString()} coins</span>
          <i class="fa-solid fa-chevron-down rental-accordion-chevron text-lg text-neutral-400 transition-transform duration-200 flex-shrink-0"></i>
        </div>
      </button>

      <div class="rental-accordion-content bg-neutral-900/50" style="height: 0px;">
        <div class="p-4 border-t border-neutral-800">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-medium text-neutral-300">Rental Details (${rentalItems.length} ${rentalItems.length === 1 ? 'item' : 'items'})</h4>
                 <button data-rental-id="${rental.id}" class="cancel-rental-btn text-xs inline-flex items-center gap-1.5 text-neutral-400 hover:text-red-400 transition-colors" aria-label="Cancel rental">
                  <i class="fa-solid fa-xmark text-sm"></i>
                  Cancel Request
                </button>
            </div>
             <div class="space-y-3">
              ${rentalItems.map(item => `
                <div class="flex items-center gap-3 text-xs">
                  <div class="flex-shrink-0 w-10 h-14 rounded-md bg-neutral-800 p-0.5 flex items-center justify-center overflow-hidden">
                    ${item.image
                      ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain" loading="lazy">`
                      : `<div class="w-full h-full grid place-items-center text-neutral-600 font-bold">${item.name.charAt(0).toUpperCase()}</div>`}
                  </div>
                  <div class="flex-grow">
                    <p class="text-neutral-200 font-medium text-sm">${item.name}</p>
                    <p class="text-neutral-400">${formatLongDate(new Date(item.startDate))} for ${item.duration === 1 ? 'day' : item.duration + ' days'}</p>
                  </div>
                  <span class="text-neutral-300 font-medium">${item.total.toLocaleString()} coins</span>
                </div>
              `).join('')}
            </div>
        </div>
      </div>
    `;
    D.rentalsList.appendChild(rentalEl);
  });

  D.rentalsList.querySelectorAll('.rental-accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const content = trigger.nextElementSibling;
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      trigger.setAttribute('aria-expanded', !isExpanded);
      if (!isExpanded) {
        content.style.height = `${content.scrollHeight}px`;
      } else {
        content.style.height = '0px';
      }
    });
  });

  D.rentalsList.querySelectorAll(".cancel-rental-btn").forEach(button => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const rentalId = e.currentTarget.dataset.rentalId;
      const rentalDomElement = e.currentTarget.closest(".rental-accordion-item");
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
    let iconClass = '';
    let displayHtml = '';
    const isCardSuggestion = allDetailedCardsMap.has(itemText);
    
    if (isCardSuggestion) {
      const cardDetails = allDetailedCardsMap.get(itemText);
      iconClass = `fa-solid fa-magnifying-glass text-sm opacity-60 text-neutral-400`;
      displayHtml = `
        <span class="flex-grow">${highlightMatch(itemText, query)}</span>
        <span class="element-badge element-badge-${cardDetails.element.toLowerCase()} rounded-full px-2 py-0.5 text-xs font-medium">${cardDetails.element}</span>
        <span class="suggest-tag">${cardDetails.rarity}</span>
      `;
    } else { // It's a pure recent search or "search for query" option
      iconClass = `fa-solid fa-clock-rotate-left text-sm opacity-60 text-neutral-400`;
      displayHtml = `<span>${highlightMatch(itemText, query)}</span>`;
    }
    
    itemEl.innerHTML = `
      <i class="${iconClass}"></i>
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
      <i class="fa-solid fa-magnifying-glass text-sm opacity-60 text-neutral-400"></i>
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

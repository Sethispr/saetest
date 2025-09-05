import dayjs from "dayjs";
import { getDomElements } from "./domElements.js";
import { data, ELEMENTS } from "./data.js";
import { getAppState, setQuery, setRarity, toggleElementFilter, resetFilters, addToCart, getCartItems, setCurrentCalendarMonth, getCalendarState } from "./state.js";
import { renderCatalogGrid, renderElementFilterButtons, renderSearchSuggestions, renderCartItems, renderCalendarView, updateCartDisplayCount } from "./renderers.js";
import { openDetailsModal, closeDetailsModal, openCheckoutModal, closeCheckoutModal, openRentalsDrawer, closeRentalsDrawer, openCalendarModal, closeCalendarModal, handleConfirmCheckout, setupDialogCloseListeners, handleDateClick } from "./modals.js";
import { addRecentSearch, parseRarity, baseName, priceFor, throttle } from "./utils.js";
import { toast } from "./toasts.js";

const D = getDomElements();

let activeSuggestionIndex = -1;
let keyboardNavigating = false; // Flag to indicate if input change is from keyboard navigation

// Function to update the reading progress bar based on scroll position
function updateReadingProgressBar() {
  const { readingProgressBar } = D;
  if (!readingProgressBar) return; // Safeguard if element not found

  // Calculate the total scrollable height of the document
  const documentHeight = document.documentElement.scrollHeight;
  const viewportHeight = document.documentElement.clientHeight;
  const scrollableHeight = documentHeight - viewportHeight;

  // Get the current vertical scroll position
  const scrolled = document.documentElement.scrollTop;

  let progress = 0;
  if (scrollableHeight > 0) { // Avoid division by zero if content is not scrollable
    progress = (scrolled / scrollableHeight) * 100;
  }

  // Update the width of the reading progress bar
  readingProgressBar.style.width = `${progress}%`;
}

function updateActiveSuggestion(newIndex) {
  const suggestions = Array.from(D.suggestionsContainer.querySelectorAll('.suggest-item'));
  if (suggestions.length === 0) {
    activeSuggestionIndex = -1;
    return;
  }

  if (activeSuggestionIndex !== -1 && suggestions[activeSuggestionIndex]) {
    suggestions[activeSuggestionIndex].removeAttribute('data-active');
  }

  activeSuggestionIndex = newIndex;
  if (activeSuggestionIndex < 0) {
    activeSuggestionIndex = suggestions.length - 1;
  } else if (activeSuggestionIndex >= suggestions.length) {
    activeSuggestionIndex = 0;
  }

  if (suggestions[activeSuggestionIndex]) {
    suggestions[activeSuggestionIndex].setAttribute('data-active', 'true');
    suggestions[activeSuggestionIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });

    keyboardNavigating = true; 
    D.searchInput.value = suggestions[activeSuggestionIndex].dataset.value;
    setQuery(suggestions[activeSuggestionIndex].dataset.value); 
    keyboardNavigating = false; 
  }
}

D.searchInput.addEventListener("keydown", (e) => {
  const suggestions = Array.from(D.suggestionsContainer.querySelectorAll('.suggest-item'));

  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault(); 
    if (D.suggestionsContainer.classList.contains("search-fade-out")) { // Use new class
      renderSearchSuggestions();
      const newSuggestions = Array.from(D.suggestionsContainer.querySelectorAll('.suggest-item'));
      if (newSuggestions.length > 0) {
          updateActiveSuggestion(0);
      }
    } else {
      updateActiveSuggestion(activeSuggestionIndex + (e.key === "ArrowDown" ? 1 : -1));
    }
    return;
  }
  
  if (suggestions.length > 0 && !D.suggestionsContainer.classList.contains("search-fade-out")) { // Use new class
    if (e.key === "Enter") {
      e.preventDefault(); 
      if (activeSuggestionIndex !== -1 && suggestions[activeSuggestionIndex]) {
        suggestions[activeSuggestionIndex].click(); 
      } else {
        const currentQuery = D.searchInput.value.trim();
        if (currentQuery) {
          addRecentSearch(currentQuery);
          setQuery(currentQuery);
          renderCatalogGrid();
          D.suggestionsContainer.classList.add("search-fade-out"); // Use new class
          D.suggestionsContainer.classList.remove("search-fade-in"); // Remove active class
          D.clearSearchBtn.classList.remove("search-fade-out"); // Show clear button
          D.clearSearchBtn.classList.add("search-fade-in");
        }
      }
    } else if (e.key === "Escape") {
      D.suggestionsContainer.classList.add("search-fade-out"); // Use new class
      D.suggestionsContainer.classList.remove("search-fade-in"); // Remove active class
      D.searchInput.value = getAppState().query; 
      activeSuggestionIndex = -1;
    }
  }
});

D.searchInput.addEventListener("input", (e) => {
  if (keyboardNavigating) {
    return; 
  }
  const currentValue = e.target.value;
  setQuery(currentValue);
  renderSearchSuggestions();
  activeSuggestionIndex = -1; 
  renderCatalogGrid(); 

  // Show/hide clear button and search shortcut
  if (currentValue.length > 0) {
    D.clearSearchBtn.classList.remove("search-fade-out");
    D.clearSearchBtn.classList.add("search-fade-in");
    D.searchShortcutKbd.classList.add("search-fade-out");
    D.searchShortcutKbd.classList.remove("search-fade-in");
  } else {
    D.clearSearchBtn.classList.add("search-fade-out");
    D.clearSearchBtn.classList.remove("search-fade-in");
    D.searchShortcutKbd.classList.remove("search-fade-out");
    D.searchShortcutKbd.classList.add("search-fade-in");
  }
});

D.searchInput.addEventListener("focus", () => {
  renderSearchSuggestions();
  activeSuggestionIndex = -1;
});

D.searchInput.addEventListener("blur", (e) => {
  setTimeout(() => {
    // Check if focus went to clear button or suggestions
    const isRelatedElementFocused = D.clearSearchBtn.contains(document.activeElement) || D.suggestionsContainer.contains(document.activeElement);
    if (!D.searchInput.contains(document.activeElement) && !isRelatedElementFocused) {
      D.suggestionsContainer.classList.add("search-fade-out"); // Use new class
      D.suggestionsContainer.classList.remove("search-fade-in"); // Remove active class
      activeSuggestionIndex = -1; 
    }
  }, 100);
});

D.raritySelect.addEventListener("change", (e) => {
  setRarity(e.target.value);
  renderCatalogGrid();
});

D.clearFiltersBtn.addEventListener("click", () => {
  resetFilters();
  D.searchInput.value = "";
  D.raritySelect.value = "";
  renderElementFilterButtons(); 
  renderCatalogGrid(); 
  renderSearchSuggestions(); 
  D.clearSearchBtn.classList.add("search-fade-out"); // Hide clear button when filters are cleared
  D.clearSearchBtn.classList.remove("search-fade-in");
  D.searchShortcutKbd.classList.remove("search-fade-out"); // Show shortcut
  D.searchShortcutKbd.classList.add("search-fade-in");
});

// New listener for the clear search input button
D.clearSearchBtn.addEventListener("click", () => {
  D.searchInput.value = "";
  setQuery("");
  renderCatalogGrid();
  renderSearchSuggestions();
  D.clearSearchBtn.classList.add("search-fade-out"); // Hide clear button
  D.clearSearchBtn.classList.remove("search-fade-in");
  D.searchShortcutKbd.classList.remove("search-fade-out"); // Show shortcut
  D.searchShortcutKbd.classList.add("search-fade-in");
  D.searchInput.focus(); // Keep focus on search bar for convenience
});

D.openCartBtn.addEventListener("click", openCheckoutModal);
D.closeCheckoutBtn.addEventListener("click", closeCheckoutModal);
D.closeDetailsBtn.addEventListener("click", closeDetailsModal);
D.openRentalsBtn.addEventListener("click", openRentalsDrawer);
D.closeRentalsBtn.addEventListener("click", closeRentalsDrawer);
D.confirmCheckoutBtn.addEventListener("click", handleConfirmCheckout);

D.calendarPrevMonthBtn.addEventListener("click", () => {
  const { currentDate } = getCalendarState();
  setCurrentCalendarMonth(currentDate.subtract(1, 'month'));
  renderCalendarView(handleDateClick); 
});

D.calendarNextMonthBtn.addEventListener("click", () => {
  const { currentDate } = getCalendarState();
  setCurrentCalendarMonth(currentDate.add(1, 'month'));
  renderCalendarView(handleDateClick); 
});

D.closeCalendarBtn.addEventListener("click", closeCalendarModal);

// Initial renders
document.addEventListener("DOMContentLoaded", () => {
  // Register Service Worker for caching
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }

  renderElementFilterButtons();
  renderCatalogGrid();
  renderSearchSuggestions();
  updateCartDisplayCount();
  setupDialogCloseListeners();

  // Initialize and attach the reading progress bar logic
  updateReadingProgressBar(); // Set initial state
  window.addEventListener('scroll', throttle(updateReadingProgressBar, 100)); // Update on scroll, throttled

  // Initial state for clear button based on search input value
  if (D.searchInput.value.length > 0) {
    D.clearSearchBtn.classList.remove("search-fade-out");
    D.clearSearchBtn.classList.add("search-fade-in");
    D.searchShortcutKbd.classList.add("search-fade-out");
    D.searchShortcutKbd.classList.remove("search-fade-in");
  } else {
    D.clearSearchBtn.classList.add("search-fade-out");
    D.clearSearchBtn.classList.remove("search-fade-in");
    D.searchShortcutKbd.classList.remove("search-fade-out");
    D.searchShortcutKbd.classList.add("search-fade-in");
  }

  // Re-attach listeners for element filter buttons
  D.elementFilters.querySelectorAll(".element-tag").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleElementFilter(btn.dataset.element);
      btn.dataset.state = getAppState().elements[btn.dataset.element]; // Update dataset state immediately for visual
      renderCatalogGrid();
    });
  });

  // FAQ Accordion
  D.faqAccordion.querySelectorAll('.faq-item').forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      
      // Close all other open items
      D.faqAccordion.querySelectorAll('.faq-item').forEach(otherItem => {
        const otherTrigger = otherItem.querySelector('.faq-trigger');
        const otherContent = otherItem.querySelector('.faq-content');
        if (otherTrigger !== trigger && otherTrigger.getAttribute('aria-expanded') === 'true') {
          otherTrigger.setAttribute('aria-expanded', 'false');
          otherContent.style.height = '0px'; // Collapse others
        }
      });

      // Toggle current item
      trigger.setAttribute('aria-expanded', !isExpanded);
      if (!isExpanded) {
        content.style.height = `${content.scrollHeight}px`; // Expand
      } else {
        content.style.height = '0px'; // Collapse
      }
    });

    // Set initial height to 0 for collapsing
    content.style.height = '0px';
  });
});

D.ctaRandomBtn.addEventListener("click", () => {
  const allCards = ELEMENTS.flatMap(el => data[el].map(cardObj => ({ element: el, ...cardObj })));
  if (allCards.length > 0) {
    const randomIndex = Math.floor(Math.random() * allCards.length);
    const randomCard = allCards[randomIndex];

    // Derive rarity and perDay here before passing to modal
    const rarity = parseRarity(randomCard.name);
    const perDay = priceFor(randomCard.name);

    openDetailsModal({
      element: randomCard.element,
      name: baseName(randomCard.name), // Use baseName for display consistency
      rarity: rarity, 
      perDay: perDay,   
      image: randomCard.image,
      details: randomCard.details
    });
  } else {
    toast("No cards available to surprise you with!", "info");
  }
});

console.log("App.js loaded successfully.");

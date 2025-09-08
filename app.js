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

  // Batch layout reads and writes in a rAF to avoid forced reflows
  window.requestAnimationFrame(() => {
    // Read layout once
    const docEl = document.documentElement;
    const documentHeight = docEl.scrollHeight;
    const viewportHeight = docEl.clientHeight;
    const scrolled = docEl.scrollTop;

    const scrollableHeight = documentHeight - viewportHeight;
    let progress = 0;
    if (scrollableHeight > 0) {
      progress = (scrolled / scrollableHeight) * 100;
    }

    // Only update style if changed to avoid unnecessary layout work
    const newWidth = `${progress}%`;
    if (readingProgressBar.style.width !== newWidth) {
      readingProgressBar.style.width = newWidth;
    }
  });
}

// Helper function to update search button visibility based on input content
function updateSearchButtonVisibility() {
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
          updateSearchButtonVisibility(); // Update button visibility after Enter
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

  updateSearchButtonVisibility(); // Call new function
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
  
  // Reset new rarity filter UI
  const rarityOptions = D.rarityFilterContent.querySelectorAll('.filter-popover-item');
  rarityOptions.forEach(item => {
    item.removeAttribute('data-state');
  });
  D.raritySelect.value = ""; // Reset the hidden select
  setRarity(""); // Also update state directly
  D.rarityFilterBadge.classList.add('hidden');
  D.rarityFilterBadge.textContent = '0';
  if (D.rarityFilterTrigger) { // Safeguard in case trigger is not yet available
    D.rarityFilterTrigger.querySelector('i').style.transform = 'rotate(0deg)'; // Reset chevron rotation
  }
  // Ensure "All rarities" is visually selected if that's the default behavior
  const allRaritiesOption = D.rarityFilterContent.querySelector('.filter-popover-item[data-value=""]');
  if (allRaritiesOption) {
    allRaritiesOption.setAttribute('data-state', 'selected');
  }

  renderElementFilterButtons(); // This will now re-render buttons AND re-attach their listeners
  renderCatalogGrid(); 
  renderSearchSuggestions(); 
  updateSearchButtonVisibility(); 
});

// New listener for the clear search input button
D.clearSearchBtn.addEventListener("click", () => {
  D.searchInput.value = "";
  setQuery("");
  renderCatalogGrid();
  renderSearchSuggestions();
  updateSearchButtonVisibility(); // Call new function
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
  const newDate = new Date(currentDate);
  newDate.setMonth(newDate.getMonth() - 1); // Subtract one month
  setCurrentCalendarMonth(newDate);
  renderCalendarView(handleDateClick); 
});

D.calendarNextMonthBtn.addEventListener("click", () => {
  const { currentDate } = getCalendarState();
  const newDate = new Date(currentDate);
  newDate.setMonth(newDate.getMonth() + 1); // Add one month
  setCurrentCalendarMonth(newDate);
  renderCalendarView(handleDateClick); 
});

D.closeCalendarBtn.addEventListener("click", closeCalendarModal);

// Rarity Filter Popover Logic
// Check if rarityFilterTrigger and rarityFilterContent exist before attaching listeners
if (D.rarityFilterTrigger && D.rarityFilterContent) {
  const rarityTrigger = D.rarityFilterTrigger;
  const rarityContent = D.rarityFilterContent;
  const rarityOptions = D.rarityFilterContent.querySelectorAll('.filter-popover-item');

  const openRarityPopover = () => {
    rarityContent.classList.add('popover-open');
    rarityTrigger.setAttribute('aria-expanded', 'true');
    const chevronIcon = rarityTrigger.querySelector('i');
    if (chevronIcon) {
      chevronIcon.style.transform = 'rotate(180deg)'; // Rotate chevron
    }
  };

  const closeRarityPopover = () => {
    rarityContent.classList.remove('popover-open');
    rarityTrigger.setAttribute('aria-expanded', 'false');
    const chevronIcon = rarityTrigger.querySelector('i');
    if (chevronIcon) {
      chevronIcon.style.transform = 'rotate(0deg)'; // Reset chevron
    }
  };

  rarityTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click listener from immediately closing
    if (rarityTrigger.getAttribute('aria-expanded') === 'true') {
      closeRarityPopover();
    } else {
      openRarityPopover();
    }
  });

  rarityOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent document click listener from immediately closing
      const value = option.dataset.value;
      const isSelected = option.getAttribute('data-state') === 'selected';

      // Clear all selections first
      rarityOptions.forEach(opt => opt.removeAttribute('data-state'));
      
      let selectedRarity = '';
      if (!isSelected) { // If the clicked option was not previously selected
        option.setAttribute('data-state', 'selected');
        selectedRarity = value;
        if (value) { // Only show badge if a specific rarity (not "All rarities") is selected
          D.rarityFilterBadge.textContent = '1';
          D.rarityFilterBadge.classList.remove('hidden');
        } else {
          D.rarityFilterBadge.classList.add('hidden'); // Hide badge for "All rarities"
          D.rarityFilterBadge.textContent = '0';
        }
      } else { // If the clicked option was already selected, keep it selected (single select)
        option.setAttribute('data-state', 'selected'); // Re-apply selected state
        selectedRarity = value;
        if (value) {
            D.rarityFilterBadge.textContent = '1';
            D.rarityFilterBadge.classList.remove('hidden');
        } else {
            D.rarityFilterBadge.classList.add('hidden');
            D.rarityFilterBadge.textContent = '0';
        }
      }
      
      D.raritySelect.value = selectedRarity; 
      setRarity(selectedRarity);
      renderCatalogGrid();
      closeRarityPopover();
    });
  });

  // Close popover when clicking outside
  document.addEventListener('click', (e) => {
    if (D.rarityFilterContainer && !D.rarityFilterContainer.contains(e.target)) {
      closeRarityPopover();
    }
  });
}

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

  renderElementFilterButtons(); // This call now handles initial rendering and event attachment
  renderCatalogGrid();
  renderSearchSuggestions();
  updateCartDisplayCount();
  setupDialogCloseListeners();

  // Initialize and attach the reading progress bar logic
  updateReadingProgressBar(); // Set initial state
  window.addEventListener('scroll', throttle(updateReadingProgressBar, 100)); // Update on scroll, throttled

  // Initial state for clear button based on search input value
  updateSearchButtonVisibility(); // Call new function here

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
          // read height once and then write to collapse
          otherContent.style.height = '0px'; // Collapse others (write only)
        }
      });

      // Toggle current item
      trigger.setAttribute('aria-expanded', !isExpanded);
      if (!isExpanded) {
        // Read scrollHeight once into a variable (single layout read), then write height
        const targetHeight = content.scrollHeight;
        content.style.height = `${targetHeight}px`; // Expand (write only)
      } else {
        content.style.height = '0px'; // Collapse (write only)
      }
    });

    // Set initial height to 0 for collapsing
    content.style.height = '0px';
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Check if an input field, textarea, or select is currently focused
    const isInputFieldFocused = document.activeElement.tagName === 'INPUT' ||
                                document.activeElement.tagName === 'TEXTAREA' ||
                                document.activeElement.tagName === 'SELECT';

    // Cmd/Ctrl + K for search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault(); // Prevent browser's default search shortcut
      D.searchInput.focus();
      D.searchInput.select(); // Select existing text if any
      renderSearchSuggestions(); // Ensure suggestions are visible
      updateSearchButtonVisibility(); // Update clear/shortcut buttons
    } 
    // Only process other shortcuts if no input field is focused
    else if (!isInputFieldFocused) {
      // Check if any dialog is open to prevent opening cart/rentals over another dialog
      const anyDialogIsOpen = D.checkoutDialog.open || D.detailsDialog.open || D.rentalsDrawer.open || D.calendarDialog.open || D.imageZoomDialog.open;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (!anyDialogIsOpen) { // Only open if no other dialogs are open
          openCheckoutModal();
        } else if (D.checkoutDialog.open) { // If it is the cart dialog and it's open, close it
          closeCheckoutModal(); 
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (!anyDialogIsOpen) { // Only open if no other dialogs are open
          openRentalsDrawer();
        } else if (D.rentalsDrawer.open) { // If it is the rentals dialog and it's open, close it
          closeRentalsDrawer(); 
        }
      }
    }
  });

  // Initialize the rarity filter's visual state
  if (D.rarityFilterTrigger && D.rarityFilterContent) { // Ensure elements exist
    const currentRarity = getAppState().rarity;
    if (currentRarity) {
      const selectedOption = D.rarityFilterContent.querySelector(`.filter-popover-item[data-value="${currentRarity}"]`);
      if (selectedOption) {
        selectedOption.setAttribute('data-state', 'selected');
        D.rarityFilterBadge.textContent = '1';
        D.rarityFilterBadge.classList.remove('hidden');
      }
    } else {
      // Default to "All rarities" selected visually if no rarity is active
      const allRaritiesOption = D.rarityFilterContent.querySelector('.filter-popover-item[data-value=""]');
      if (allRaritiesOption) {
        allRaritiesOption.setAttribute('data-state', 'selected');
      }
    }
  }
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

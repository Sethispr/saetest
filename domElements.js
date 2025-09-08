import { RECENT_SEARCHES_KEY } from "./constants.js";
export const getDomElements = () => ({
    grid: document.getElementById("grid"),
    elementFilters: document.getElementById("element-filters"),
    searchInput: document.getElementById("search"),
    raritySelect: document.getElementById("rarity"),
    clearFiltersBtn: document.getElementById("clear-filters"),
    emptyState: document.getElementById("empty-state"),

    checkoutDialog: document.getElementById("checkout-dialog"),
    checkoutTitle: document.getElementById("checkout-title"),
    cartItemsList: document.getElementById("cart-items-list"),
    cartGrandTotal: document.getElementById("cart-grand-total"),
    confirmCheckoutBtn: document.getElementById("confirm-checkout"),
    discordInput: document.getElementById("discord"),
    reasonSelect: document.getElementById("reason"),
    closeCheckoutBtn: document.getElementById("close-checkout"),

    rentalsDrawer: document.getElementById("rentals-drawer"),
    rentalsList: document.getElementById("rentals-list"),
    openRentalsBtn: document.getElementById("open-rentals"),
    closeRentalsBtn: document.getElementById("close-rentals"),

    toastsContainer: document.getElementById("toasts"),
    ctaRandomBtn: document.getElementById("cta-random"),
    detailsDialog: document.getElementById("details-dialog"),
    detailsTitle: document.getElementById("details-title"),
    detailsBody: document.getElementById("details-body"),
    closeDetailsBtn: document.getElementById("close-details"),

    suggestionsContainer: document.getElementById("suggestions"),
    clearSearchBtn: document.getElementById("clear-search-btn"),
    searchShortcutKbd: document.getElementById("search-shortcut"),

    openCartBtn: document.getElementById("open-cart"),
    cartCountSpan: document.getElementById("cart-count"),

    progressBar: document.getElementById("progress-bar"),
    readingProgressBar: document.getElementById("reading-progress-bar"), // Element for reading progress

    calendarDialog: document.getElementById("calendar-dialog"),
    closeCalendarBtn: document.getElementById("close-calendar"),
    calendarMonthYearSpan: document.getElementById("calendar-month-year"),
    calendarDaysGrid: document.getElementById("calendar-days"),
    calendarPrevMonthBtn: document.getElementById("calendar-prev-month"),
    calendarNextMonthBtn: document.getElementById("calendar-next-month"),

    faqAccordion: document.getElementById("faq-accordion"),

    // Image Zoom Dialog elements
    imageZoomDialog: document.getElementById("image-zoom-dialog"),
    imageZoomImg: document.getElementById("image-zoom-img"),

    // Rarity Filter UI elements
    rarityFilterContainer: document.getElementById("rarity-filter-container"),
    rarityFilterTrigger: document.getElementById("rarity-filter-trigger"),
    rarityFilterContent: document.getElementById("rarity-filter-content"),
    rarityFilterBadge: document.getElementById("rarity-filter-badge"),
});

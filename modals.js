import { getDomElements } from "./domElements.js";
import { getCalendarState, getCartItems, getCurrentDetailsCard, setCalendarActiveInput, setCalendarOnSelectCallback, setCurrentCalendarMonth, setSelectedDateInCalendar, resetCalendarState, clearCart, recordRental } from "./state.js";
import { renderCartItems, updateDetailsModalContent, renderCalendarView, renderRentalsView, updateCartDisplayCount } from "./renderers.js";
import { toast } from "./toasts.js";
import { sendDiscordWebhook } from "./webhooks.js";
import { formatDate } from "./utils.js"; // Import new utility

const D = getDomElements();

export function openDetailsModal(card) {
  D.detailsDialog.classList.remove("details-dialog-closing");
  updateDetailsModalContent(card);
  D.detailsDialog.showModal();
}

export function closeDetailsModal() {
  if (!D.detailsDialog.open || D.detailsDialog.classList.contains("details-dialog-closing")) {
    return;
  }
  D.detailsDialog.classList.add("details-dialog-closing");
  D.detailsDialog.addEventListener("animationend", () => {
    D.detailsDialog.close();
    D.detailsDialog.classList.remove("details-dialog-closing");
  }, { once: true });
}

export function openCheckoutModal() {
  D.checkoutDialog.classList.remove("checkout-dialog-closing");
  renderCartItems(); 
  D.checkoutDialog.showModal();
}

export function closeCheckoutModal() {
  if (!D.checkoutDialog.open || D.checkoutDialog.classList.contains("checkout-dialog-closing")) {
    return;
  }
  D.checkoutDialog.classList.add("checkout-dialog-closing");
  D.checkoutDialog.addEventListener("animationend", () => {
    D.checkoutDialog.close();
    D.checkoutDialog.classList.remove("checkout-dialog-closing");
  }, { once: true });
}

export function openRentalsDrawer() {
  D.rentalsDrawer.classList.remove("rentals-drawer-closing");
  renderRentalsView(); 
  D.rentalsDrawer.showModal();
}

export function closeRentalsDrawer() {
  if (!D.rentalsDrawer.open || D.rentalsDrawer.classList.contains("rentals-drawer-closing")) {
    return;
  }
  D.rentalsDrawer.classList.add("rentals-drawer-closing");
  D.rentalsDrawer.addEventListener("animationend", () => {
    D.rentalsDrawer.close();
    D.rentalsDrawer.classList.remove("rentals-drawer-closing");
  }, { once: true });
}

export function openCalendarModal(inputElement, currentSelectedDate, onSelectCallback) {
  setCalendarActiveInput(inputElement);
  setCalendarOnSelectCallback(onSelectCallback);

  // currentSelectedDate can be a "YYYY-MM-DD" string or a Date object
  let parsedDate = new Date(currentSelectedDate);
  // Check if parsedDate is a valid date (e.g., if currentSelectedDate was an invalid string)
  if (isNaN(parsedDate.getTime())) {
    parsedDate = new Date(); // Fallback to today
    console.warn(`Invalid date string "${currentSelectedDate}". Falling back to today's date.`);
  }
  parsedDate.setHours(0,0,0,0); // Normalize to start of day

  setSelectedDateInCalendar(parsedDate);
  setCurrentCalendarMonth(parsedDate); // Sets currentDate in state to the first day of that month

  // Pass handleDateClick as a callback to renderCalendarView
  renderCalendarView(handleDateClick); 
  D.calendarDialog.classList.remove("calendar-dialog-closing");
  D.calendarDialog.showModal();
}

export function closeCalendarModal() {
  if (!D.calendarDialog.open || D.calendarDialog.classList.contains("calendar-dialog-closing")) {
    return;
  }
  D.calendarDialog.classList.add("calendar-dialog-closing");
  D.calendarDialog.addEventListener("animationend", () => {
    D.calendarDialog.close();
    D.calendarDialog.classList.remove("calendar-dialog-closing");
    resetCalendarState(); // Clear calendar state after closing
  }, { once: true });
}

export function handleDateClick(date) { // date is now a Date object
  const { onSelectCallback, activeInput } = getCalendarState();
  setSelectedDateInCalendar(date); 
  if (onSelectCallback) {
    const formattedDate = formatDate(date, "YYYY-MM-DD");
    onSelectCallback(date); // Pass the Date object to the callback
    if (activeInput) {
      activeInput.value = formattedDate; // Directly update the input element's value
    }
  }
  closeCalendarModal();
}

export async function handleConfirmCheckout() {
  const discordUser = D.discordInput.value.trim();
  const rentalReason = D.reasonSelect.value;
  const cart = getCartItems();

  if (!discordUser) {
    toast("Please enter your Discord username.", "error");
    D.discordInput.focus();
    return;
  }
  if (cart.length === 0) {
    toast("Your cart is empty. Add some cards first!", "error");
    return;
  }

  const success = await sendDiscordWebhook(cart, discordUser, rentalReason);

  if (success) {
    recordRental(cart, discordUser); // Save to local storage
    clearCart(); // Clear cart after successful submission
    updateCartDisplayCount();
    closeCheckoutModal(); 
  }
}

// Image zoom functionality
export function openImageZoom(src) {
  // Clear previous image src to prevent flashing old image
  D.imageZoomImg.src = ''; 
  D.imageZoomImg.alt = 'Zoomed card image';

  // Set the new image source
  D.imageZoomImg.src = src;

  // Show the dialog
  D.imageZoomDialog.classList.remove('image-zoom-dialog-closing');
  D.imageZoomDialog.showModal();

  // Trigger image scale-in animation after dialog is open and image src is set
  requestAnimationFrame(() => {
    D.imageZoomImg.classList.add('visible');
  });

  // Attach ESC listener for closing
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeImageZoom();
    }
  };
  document.addEventListener('keydown', handleEsc, { once: true });
  // Store the handleEsc function reference on the dialog itself for removal
  D.imageZoomDialog._handleEsc = handleEsc;
}

export function closeImageZoom() {
  if (!D.imageZoomDialog.open || D.imageZoomDialog.classList.contains('image-zoom-dialog-closing')) {
    return;
  }

  // Start image scale-out animation
  D.imageZoomImg.classList.remove('visible'); 
  // Add closing class for backdrop fade-out and dialog closing animation
  D.imageZoomDialog.classList.add('image-zoom-dialog-closing'); 

  // Use setTimeout to match the CSS transition duration (300ms)
  // This ensures the dialog's modal state is properly ended after the visual animation.
  setTimeout(() => {
    D.imageZoomDialog.close();
    D.imageZoomDialog.classList.remove('image-zoom-dialog-closing');
    D.imageZoomImg.src = ''; // Clear image source after closing
  }, 300); // Duration matches CSS transition-all duration-300 and backdrop transition

  // Ensure the ESC listener is removed
  if (D.imageZoomDialog._handleEsc) {
    document.removeEventListener('keydown', D.imageZoomDialog._handleEsc);
    D.imageZoomDialog._handleEsc = null;
  }
}

export function setupDialogCloseListeners() {
  const dialogs = [
    { element: D.detailsDialog, closeFn: closeDetailsModal, className: "details-dialog-closing" },
    { element: D.checkoutDialog, closeFn: closeCheckoutModal, className: "checkout-dialog-closing" },
    { element: D.rentalsDrawer, closeFn: closeRentalsDrawer, className: "rentals-drawer-closing" },
    { element: D.calendarDialog, closeFn: closeCalendarModal, className: "calendar-dialog-closing" },
    // Image Zoom Dialog added to the list of dialogs
    { element: D.imageZoomDialog, closeFn: closeImageZoom, className: "image-zoom-dialog-closing" }
  ];

  dialogs.forEach(({ element, closeFn, className }) => {
    element.addEventListener("click", (e) => {
      if (e.target === element) { // Clicked on the backdrop
        closeFn();
      }
    });
    element.addEventListener("cancel", (e) => {
      e.preventDefault(); // Prevent default immediate close
      closeFn();
    });
  });

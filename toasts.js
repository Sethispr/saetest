import { getDomElements } from "./domElements.js";

let toastCount = 0; // variable is declared but never read !!

export function toast(message, type = "info", duration = 3000) {
  const { toastsContainer } = getDomElements();
  if (!toastsContainer) return;

  const toastEl = document.createElement("div");
  toastEl.className = `flex items-center gap-3 p-3 pr-4 rounded-lg shadow-lg text-sm transition-all duration-300 ease-out translate-y-2 opacity-0 toast-item`;
  let iconClass = '';
  // let bgColor = 'bg-neutral-800'; // Not directly used due to rgba and backdrop-filter
  let textColor = 'text-neutral-200';

  switch (type) {
    case 'success':
      iconClass = `fa-solid fa-circle-check text-green-400`;
      break;
    case 'error':
      iconClass = `fa-solid fa-circle-xmark text-red-400`;
      break;
    default: 
      iconClass = `fa-solid fa-circle-info text-blue-300`;
      break;
  }

  toastEl.innerHTML = `<i class="${iconClass} text-base"></i><span class="${textColor}">${message}</span>`;
  toastEl.style.backgroundColor = 'rgba(23, 23, 23, 0.9)'; 
  toastEl.style.backdropFilter = 'blur(8px)'; 
  toastEl.style.border = '1px solid rgb(38, 38, 38)'; 

  toastsContainer.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.transform = 'translateY(0) scale(1)';
    toastEl.style.opacity = '1';
  }, 10); 

  setTimeout(() => {
    toastEl.style.transform = 'translateY(-20px) scale(0.95)';
    toastEl.style.opacity = '0';
    toastEl.style.pointerEvents = 'none'; 
    toastEl.addEventListener('transitionend', () => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, { once: true });
  }, duration);
}

import { getDomElements } from "./domElements.js";

let toastCount = 0;

export function toast(message, type = "info", duration = 3000) {
  const { toastsContainer } = getDomElements();
  if (!toastsContainer) return;

  toastCount++;
  const toastEl = document.createElement("div");
  toastEl.className = `flex items-center gap-3 p-3 pr-4 rounded-lg shadow-lg text-sm transition-all duration-300 ease-out translate-y-2 opacity-0 toast-item`;
  let icon = '';
  // let bgColor = 'bg-neutral-800'; // Not directly used due to rgba and backdrop-filter
  let textColor = 'text-neutral-200';

  switch (type) {
    case 'success':
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      break;
    case 'error':
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      break;
    default: 
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-300"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      break;
  }

  toastEl.innerHTML = `${icon}<span class="${textColor}">${message}</span>`;
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


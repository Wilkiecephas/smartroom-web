export function showToast(message, type = 'info') {
  // Ensure container exists
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '10000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.minWidth = '200px';
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  toast.style.background = type === 'error' ? 'rgba(255,80,80,0.9)' : (type === 'success' ? 'rgba(80,200,80,0.9)' : 'rgba(50,50,150,0.9)');
  toast.style.color = '#fff';
  toast.style.fontFamily = 'Inter, sans-serif';
  toast.style.cursor = 'pointer';
  toast.addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  // Auto dismiss after 3s
  setTimeout(() => toast.remove(), 3000);
}

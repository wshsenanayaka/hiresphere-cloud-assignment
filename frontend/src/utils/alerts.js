function fallbackAlert(title, message) {
  window.alert(message ? `${title}\n\n${message}` : title);
}

export function showSuccess(title, text = '') {
  if (window.Swal) {
    return window.Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#2563eb',
    });
  }

  fallbackAlert(title, text);
  return Promise.resolve();
}

export function showError(title, error) {
  const text = typeof error === 'string' ? error : error?.message || 'Something went wrong. Please try again.';

  if (window.Swal) {
    return window.Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#dc2626',
    });
  }

  fallbackAlert(title, text);
  return Promise.resolve();
}

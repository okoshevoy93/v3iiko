(function() {
  const form = document.getElementById('loginForm');
  const btn = document.getElementById('loginBtn');
  const icon = document.getElementById('loginStatus');
  const label = document.getElementById('loginLabel');
  const hasError = document.body.dataset.error === '1';
  const usernameInput = document.querySelector('input[name="username"]');

  if (usernameInput) {
    usernameInput.focus();
    usernameInput.select();
  }

  if (hasError && icon) {
    icon.style.display = 'inline-block';
    icon.classList.add('fail');
  }

  if (form && btn && icon && label) {
    form.addEventListener('submit', () => {
      btn.disabled = true;
      icon.style.display = 'inline-block';
      icon.classList.remove('fail');
      icon.classList.add('ok', 'pulse');
      label.textContent = 'Проверяем…';
      setTimeout(() => {
        label.textContent = 'Входим…';
      }, 320);
    });
  }
})();

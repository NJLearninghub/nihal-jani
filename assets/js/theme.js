/* Theme toggle: persisted in localStorage, defaults to system preference.
   The initial theme is applied by an inline script in <head> to avoid a flash. */
(function () {
  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function apply(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', theme); } catch (e) {}
    // Let canvases and other listeners repaint with the new palette.
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      apply(current() === 'dark' ? 'light' : 'dark');
    });
  });

  // Follow the OS if the user never chose explicitly.
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function (e) {
      var stored = null;
      try { stored = localStorage.getItem('theme'); } catch (err) {}
      if (!stored) apply(e.matches ? 'dark' : 'light');
    });
  }
})();

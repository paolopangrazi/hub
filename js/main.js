
  function applyTheme(t) {
    const isLight = t === 'light';
    document.documentElement.classList.toggle('light', isLight);
    const icon = document.getElementById('theme-icon'),
          label = document.getElementById('theme-label');
    if (icon)  icon.textContent  = isLight ? '☀' : '☾';
    if (label) label.textContent = isLight ? 'Dark mode' : 'Light mode';
  }
  function toggleTheme() {
    const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
    try { localStorage.setItem('theme', next); } catch (e) {}
    applyTheme(next);
  }
  applyTheme(localStorage.getItem('theme') || 'dark');

  // Nerdy / fancy mode. Both currently share the same style; the nerdy
  // look is still to be built — the switch is wired up and ready for it.
  function applyMode(m) {
    const isNerdy = m === 'nerdy';
    document.documentElement.classList.toggle('nerdy', isNerdy);
    const icon = document.getElementById('mode-icon'),
          label = document.getElementById('mode-label');
    if (icon)  icon.textContent  = isNerdy ? '✨' : '🤓';
    if (label) label.textContent = isNerdy ? 'Fancy mode' : 'Nerdy mode';
  }
  function toggleMode() {
    const next = document.documentElement.classList.contains('nerdy') ? 'fancy' : 'nerdy';
    try { localStorage.setItem('mode', next); } catch (e) {}
    applyMode(next);
  }
  applyMode(localStorage.getItem('mode') || 'fancy');

  // Mobile nav drawer (below the lg breakpoint)
  function toggleNav(force) {
    const nav = document.getElementById('nav-rail'),
          bd  = document.getElementById('nav-backdrop'),
          btn = document.getElementById('nav-toggle');
    const open = force === undefined ? !nav.classList.contains('open') : force;
    nav.classList.toggle('open', open);
    bd.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', open);
    document.getElementById('nav-toggle-icon').textContent = open ? '✕' : '☰';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  // close the drawer after tapping a rail link
  document.querySelectorAll('#nav-rail .rail a').forEach(a =>
    a.addEventListener('click', () => toggleNav(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleNav(false); });
  // reaching the lg breakpoint pins the rail open via CSS — clear any drawer state
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) toggleNav(false); });

  function showCode(which) {
    const before = document.getElementById('code-before'),
          after = document.getElementById('code-after'),
          bB = document.getElementById('btn-before'),
          bA = document.getElementById('btn-after'),
          fn = document.getElementById('code-filename');
    const isBefore = which === 'before';
    before.classList.toggle('hidden', !isBefore);
    after.classList.toggle('hidden', isBefore);
    fn.textContent = isBefore ? 'resync_naive.cpp' : 'resync_bfs.cpp';
    bB.className = 'px-4 py-1.5 transition-colors ' + (isBefore ? 'bg-[#ff6b6b]/15 text-[#ff6b6b]' : 'text-dim hover:text-[#ff6b6b]');
    bA.className = 'px-4 py-1.5 transition-colors ' + (isBefore ? 'text-dim hover:text-ember' : 'bg-ember/15 text-ember');
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Accomplishment cards → open DETAILS, scroll to the matching item and flash it.
  function revealAccomplishment(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const det = target.closest('details');
    if (det && !det.open) det.open = true;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.remove('dx-flash');
      void target.offsetWidth;
      target.classList.add('dx-flash');
    });
  }
  document.querySelectorAll('a.acc-card').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      revealAccomplishment(a.getAttribute('href').slice(1));
    });
  });

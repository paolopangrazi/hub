const NAV_ITEMS = [
  { label: 'Professional Summary', href: '#pro' },
  { label: 'Education & Professional Development', href: '#edu' },
  { label: 'Novartis', href: '#novartis', bullet: true },
  { label: 'AISCO Firetrainer', href: '#aisco', bullet: true },
  { label: 'Alcatel-Lucent (Nokia)', href: '#alcatel-lucent', bullet: true },
  null,
  { label: '📖 Books', href: '#books' },
  { label: '💬 Languages', href: '#languages' },
  { label: '♟️ Hobbies', href: '#hobbies' },
  { label: '✏️ Creative Corner', href: '#creative-corner' },
  { label: '💻 Computer Science', href: '#cs' },
];

function renderNav(containerId, { onClose = false } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = NAV_ITEMS.map(item => {
    if (!item) return '<br>';
    const onclick = onClose ? ' onclick="closeFab()"' : '';
    const link = `<a class="link" href="${item.href}"${onclick}>${item.label}</a>`;
    return item.bullet
      ? `<span style="color:#00FA9A;">▸</span> ${link}<br>`
      : `${link}<br>`;
  }).join('\n');
}

document.addEventListener('DOMContentLoaded', function () {
  renderNav('nav-index');
  renderNav('nav-fab', { onClose: true });
});

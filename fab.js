function toggleFab() {
  const menu = document.getElementById('fab-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function closeFab() {
  document.getElementById('fab-menu').style.display = 'none';
}

document.addEventListener('click', function(e) {
  if (!document.getElementById('fab-container').contains(e.target)) {
    closeFab();
  }
});

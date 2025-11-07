(function () {
  const params = new URLSearchParams(window.location.search);
  let roomId = params.get('room');
  if (!roomId) {
    roomId = Math.random().toString(36).slice(2, 8);
    params.set('room', roomId);
    history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  }

  window.__ROOM_ID__ = roomId;

  console.log(`🧩 Room: ${roomId}`);
  const toolbar = document.getElementById('toolbar');
  if (toolbar) {
    const link = document.createElement('a');
    link.href = location.href;
    link.textContent = `Invite: ${location.href}`;
    link.style.marginLeft = '8px';
    link.style.fontSize = '12px';
    link.style.opacity = '0.8';
    toolbar.appendChild(link);
  }
})();

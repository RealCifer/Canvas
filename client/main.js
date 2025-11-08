(function () {
  const params = new URLSearchParams(window.location.search);
  let roomId = params.get('room');
  if (!roomId) {
    roomId = Math.random().toString(36).slice(2, 8);
    params.set('room', roomId);
    history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  }

  window.__ROOM_ID__ = roomId;

  const toolbar = document.getElementById('toolbar');
  const link = document.createElement('span');
  link.textContent = `Invite: ${location.href}`;
  link.style.fontSize = "12px";
  link.style.opacity = "0.7";
  toolbar.appendChild(link);
})();

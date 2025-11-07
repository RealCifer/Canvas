(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const toolSelect = document.getElementById('tool');
  const colorInput = document.getElementById('color');
  const widthInput = document.getElementById('width');
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo'); 
  const usersDiv = document.getElementById('users');

  const toolbar = document.getElementById('toolbar');
  const overlay = document.createElement('canvas');
  overlay.id = 'cursor-layer';
  const octx = overlay.getContext('2d');
  Object.assign(overlay.style, {
    position: 'fixed',
    left: '0',
    top: `${toolbar ? toolbar.offsetTop + toolbar.offsetHeight : 60}px`,
    pointerEvents: 'none',
    zIndex: '10',
  });
  document.body.appendChild(overlay);

  let drawing = false;
  let ops = [];
  let me = null;

  const otherCursors = {};

  function sizeCanvases() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - (toolbar ? toolbar.offsetHeight : 60);
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.width = canvas.width + 'px';
    overlay.style.height = canvas.height + 'px';
    overlay.style.top = `${toolbar ? toolbar.offsetTop + toolbar.offsetHeight : 60}px`;

    redraw();      
    drawCursors(); 
  }
  window.addEventListener('resize', sizeCanvases);
  sizeCanvases();

  const toNorm = (x, y) => [x / canvas.width, y / canvas.height];
  const toPx = ([x, y]) => ({ x: x * canvas.width, y: y * canvas.height });

  function drawPoints(op) {
    if (!op.points || op.points.length < 2) return;
    ctx.lineWidth = op.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = op.color;
    ctx.globalCompositeOperation = op.tool === 'eraser' ? 'destination-out' : 'source-over';

    ctx.beginPath();
    const start = toPx(op.points[0]);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < op.points.length; i++) {
      const { x, y } = toPx(op.points[i]);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const op of ops) drawPoints(op);
  }

  function drawCursors() {
    octx.clearRect(0, 0, overlay.width, overlay.height);
    for (const uid in otherCursors) {
      const c = otherCursors[uid];
      if (typeof c.x !== 'number' || typeof c.y !== 'number') continue;
      const px = { x: c.x * overlay.width, y: c.y * overlay.height };
      octx.save();
      octx.beginPath();
      octx.fillStyle = c.color || '#333';
      octx.arc(px.x, px.y, 6, 0, Math.PI * 2);
      octx.fill();

      const label = c.name || uid.slice(0, 4);
      octx.font = '12px sans-serif';
      const paddingX = 6;
      const paddingY = 4;
      const metrics = octx.measureText(label);
      const textW = metrics.width;
      const textH = 12;
      const bx = px.x + 10;
      const by = px.y - (textH + 8);

      octx.fillStyle = 'rgba(0,0,0,0.6)';
      octx.fillRect(bx, by, textW + paddingX * 2, textH + paddingY * 2);

      octx.fillStyle = 'white';
      octx.fillText(label, bx + paddingX, by + paddingY + textH - 3);
      octx.restore();
    }
  }

  let lastCursorSent = 0;
  const CURSOR_INTERVAL = 30; 

  canvas.addEventListener('mousedown', () => {
    drawing = true;
    const opId = Math.random().toString(36).slice(2);
    const op = {
      opId,
      tool: toolSelect.value,
      color: colorInput.value,
      width: parseInt(widthInput.value, 10),
      points: []
    };
    ops.push(op);
    window.socket.emit('stroke.begin', op);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;

    const now = performance.now();
    if (now - lastCursorSent >= CURSOR_INTERVAL) {
      window.socket.emit('cursor', {
        x: x / canvas.width,
        y: y / canvas.height,
        userId: me?.userId,
        color: me?.color,
        name: me?.name
      });
      lastCursorSent = now;
    }

    if (drawing) {
      const op = ops[ops.length - 1];
      op.points.push(toNorm(x, y));
      drawPoints(op);
      window.socket.emit('stroke.data', { opId: op.opId, points: [toNorm(x, y)] });
    }
  });

  window.addEventListener('mouseup', () => {
    if (!drawing) return;
    drawing = false;
    if (ops.length) {
      const op = ops[ops.length - 1];
      window.socket.emit('stroke.end', { opId: op.opId });
    }
  });

  if (undoBtn) undoBtn.addEventListener('click', () => window.socket.emit('undo'));
  if (redoBtn) redoBtn.addEventListener('click', () => window.socket.emit('redo'));

  window.socket.on('init', (data) => {
    ops = data.ops || [];
    me = data.user;
    renderUsers(data.users);
    redraw();
    drawCursors();
  });

  window.socket.on('stroke.begin', (op) => ops.push({ ...op, points: [] }));
  window.socket.on('stroke.data', (data) => {
    const op = ops.find(o => o.opId === data.opId);
    if (op) {
      op.points.push(...data.points);
      drawPoints(op);
    }
  });

  window.socket.on('op.remove', ({ opId }) => {
    ops = ops.filter(o => o.opId !== opId);
    redraw();
    drawCursors();
  });

  window.socket.on('op.restore', ({ op }) => {
    ops.push(op);
    redraw();
    drawCursors();
  });

  window.socket.on('cursor', (payload) => {
    if (!payload?.userId || payload.userId === me?.userId) return;
    otherCursors[payload.userId] = {
      x: payload.x,
      y: payload.y,
      color: payload.color,
      name: payload.name
    };
    drawCursors();
  });

  window.socket.on('user.leave', ({ user }) => {
    if (user?.userId && otherCursors[user.userId]) {
      delete otherCursors[user.userId];
      drawCursors();
    }
  });

  function renderUsers(userList) {
    usersDiv.innerHTML = '';
    (userList || []).forEach((u) => {
      const el = document.createElement('span');
      el.textContent = u.name || u.userId.slice(0, 4);
      el.className = 'user-badge';
      el.style.background = u.color;
      usersDiv.appendChild(el);
    });
  }
})();

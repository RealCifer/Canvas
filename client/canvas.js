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
  document.body.appendChild(overlay);

  let drawing = false;
  let ops = [];
  let me = null;
  const otherCursors = {};

  function sizeCanvases() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - toolbar.offsetHeight;

    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.top = toolbar.offsetHeight + 'px';

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
    ctx.globalCompositeOperation =
      op.tool === 'eraser' ? 'destination-out' : 'source-over';

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
      const px = { x: c.x * overlay.width, y: c.y * overlay.height };
      
      octx.fillStyle = c.color || "#333";
      octx.beginPath();
      octx.arc(px.x, px.y, 6, 0, Math.PI * 2);
      octx.fill();

      const label = c.name || uid.slice(0, 4);
      octx.font = "12px sans-serif";
      const padding = 4;
      const textW = octx.measureText(label).width;
      const bx = px.x + 10;
      const by = px.y - 18;

      octx.fillStyle = "rgba(0,0,0,0.6)";
      octx.fillRect(bx, by - 12, textW + padding * 2, 18);

      octx.fillStyle = "white";
      octx.fillText(label, bx + padding, by);
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    const op = ops[ops.length - 1];
    window.socket.emit('stroke.end', { opId: op.opId });
  });

  undoBtn.addEventListener('click', () => window.socket.emit('undo'));
  redoBtn.addEventListener('click', () => window.socket.emit('redo'));

  window.socket.on('init', (data) => {
    ops = data.ops || [];
    me = data.user;
    renderUsers(data.users);
    redraw();
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
  });

  window.socket.on('op.restore', ({ op }) => {
    ops.push(op);
    redraw();
  });

  window.socket.on('cursor', (payload) => {
    if (!payload?.userId || payload.userId === me?.userId) return;
    otherCursors[payload.userId] = payload;
    drawCursors();
  });

  window.socket.on('user.leave', ({ user }) => {
    delete otherCursors[user.userId];
    drawCursors();
  });

  function renderUsers(userList) {
    usersDiv.innerHTML = '';
    (userList || []).forEach((u) => {
      const el = document.createElement('div');
      el.className = 'user-badge';

      let initials = (u.name.includes('-') ? u.name.split('-')[1] : u.userId)
        .slice(0, 2)
        .toUpperCase();

      el.textContent = initials;
      el.style.background = u.color;
      usersDiv.appendChild(el);
    });
  }
})();

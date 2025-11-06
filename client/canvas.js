(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const toolSelect = document.getElementById('tool');
  const colorInput = document.getElementById('color');
  const widthInput = document.getElementById('width');
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  const usersDiv = document.getElementById('users');

  let drawing = false;
  let ops = [];
  let me = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
    redraw();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

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

  canvas.addEventListener('mousedown', () => {
    drawing = true;
    const opId = Math.random().toString(36).slice(2);
    const op = {
      opId,
      tool: toolSelect.value,
      color: colorInput.value,
      width: parseInt(widthInput.value),
      points: []
    };
    ops.push(op);
    window.socket.emit('stroke.begin', op);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (drawing) {
      const op = ops[ops.length - 1];
      op.points.push(toNorm(x, y));
      drawPoints(op);
      window.socket.emit('stroke.data', { opId: op.opId, points: [toNorm(x, y)] });
    }
    window.socket.emit('cursor', { x: x / canvas.width, y: y / canvas.height, userId: me?.userId, color: me?.color });
  });

  window.addEventListener('mouseup', () => {
    drawing = false;
    if (ops.length) {
      const op = ops[ops.length - 1];
      window.socket.emit('stroke.end', { opId: op.opId });
    }
  });

  undoBtn.addEventListener('click', () => {
  console.log("Undo clicked ");
  window.socket.emit('undo');
});

redoBtn.addEventListener('click', () => {
  console.log("Redo clicked ");
  window.socket.emit('redo');
});

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

  function renderUsers(userList) {
    usersDiv.innerHTML = '';
    for (const user of userList) {
      const el = document.createElement('span');
      el.textContent = user.name;
      el.className = 'user-badge';
      el.style.background = user.color;
      usersDiv.appendChild(el);
    }
  }
})();

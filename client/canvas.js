(function () {

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const colorInput = document.getElementById("color");
  const widthInput = document.getElementById("width");
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  const usersDiv = document.getElementById("users");
  const toolbar = document.getElementById("toolbar");
  const themeToggle = document.getElementById("theme-toggle");

  const brushBtn = document.getElementById("brush-btn");
  const eraserBtn = document.getElementById("eraser-btn");

  const overlay = document.getElementById("cursor-layer");
  const octx = overlay.getContext("2d");

  let currentTool = "brush";
  let drawing = false;
  let ops = [];
  let me = null;
  const otherCursors = {};

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - toolbar.offsetHeight;

    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.top = toolbar.offsetHeight + "px";

    redraw();
    drawCursors();
  }
  window.addEventListener("resize", resize);
  resize();

  const toNorm = (x, y) => [x / canvas.width, y / canvas.height];
  const toPx = ([nx, ny]) => ({ x: nx * canvas.width, y: ny * canvas.height });

  function drawPoints(op) {
    if (op.points.length < 2) return;

    ctx.lineWidth = op.width;
    ctx.lineCap = "round";
    ctx.strokeStyle = op.color;
    ctx.globalCompositeOperation = op.tool === "eraser" ? "destination-out" : "source-over";

    ctx.beginPath();
    let p0 = toPx(op.points[0]);
    let p1 = toPx(op.points[1]);
    ctx.moveTo(p0.x, p0.y);

    for (let i = 1; i < op.points.length - 1; i++) {
      const p2 = toPx(op.points[i + 1]);
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, cx, cy);
      p1 = p2;
    }

    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ops.forEach(drawPoints);
  }

  function drawCursors() {
    octx.clearRect(0, 0, overlay.width, overlay.height);

    Object.values(otherCursors).forEach(c => {
      const p = { x: c.x * overlay.width, y: c.y * overlay.height };

      octx.beginPath();
      octx.fillStyle = c.color;
      octx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      octx.fill();

      const label = (c.name || "USER").slice(-4).toUpperCase();
      octx.font = "12px sans-serif";
      const padding = 6;
      const w = octx.measureText(label).width;

      octx.fillStyle = "rgba(0,0,0,0.65)";
      octx.fillRect(p.x + 12, p.y - 22, w + padding * 2, 18);

      octx.fillStyle = "white";
      octx.fillText(label, p.x + 12 + padding, p.y - 10);
    });
  }

  function beginStroke(x, y) {
    drawing = true;
    const op = {
      opId: Math.random().toString(36).slice(2),
      tool: currentTool,
      color: colorInput.value,
      width: +widthInput.value,
      points: [[x / canvas.width, y / canvas.height]]
    };
    ops.push(op);
    window.socket.emit("stroke.begin", op);
  }

  let lastSent = 0;
  function sendCursor(x, y) {
    const now = performance.now();
    if (now - lastSent > 25) {
      window.socket.emit("cursor", {
        x: x / canvas.width,
        y: y / canvas.height,
        userId: me?.userId,
        color: me?.color,
        name: me?.name
      });
      lastSent = now;
    }
  }

  function addPoint(x, y) {
    sendCursor(x, y);
    if (!drawing) return;

    const op = ops[ops.length - 1];
    const norm = toNorm(x, y);
    const last = op.points[op.points.length - 1];

    if (!last || Math.abs(last[0] - norm[0]) > 0.001 || Math.abs(last[1] - norm[1]) > 0.001) {
      op.points.push(norm);
      drawPoints(op);
      window.socket.emit("stroke.data", { opId: op.opId, points: [norm] });
    }
  }

  function endStroke() {
    drawing = false;
    if (ops.length) {
      const op = ops[ops.length - 1];
      window.socket.emit("stroke.end", { opId: op.opId });
    }
  }

  canvas.addEventListener("mousedown", e => beginStroke(e.offsetX, e.offsetY));
  canvas.addEventListener("mousemove", e => addPoint(e.offsetX, e.offsetY));
  window.addEventListener("mouseup", endStroke);

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.touches[0];
    beginStroke(t.clientX - canvas.offsetLeft, t.clientY - canvas.offsetTop);
  }, { passive: false });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];
    addPoint(t.clientX - canvas.offsetLeft, t.clientY - canvas.offsetTop);
  }, { passive: false });

  window.addEventListener("touchend", endStroke, { passive: false });

  brushBtn.onclick = () => {
    currentTool = "brush";
    brushBtn.classList.add("active");
    eraserBtn.classList.remove("active");
  };

  eraserBtn.onclick = () => {
    currentTool = "eraser";
    eraserBtn.classList.add("active");
    brushBtn.classList.remove("active");
  };

  undoBtn.onclick = () => window.socket.emit("undo");
  redoBtn.onclick = () => window.socket.emit("redo");

  window.socket.on("init", data => {
    ops = data.ops;
    me = data.user;
    redraw();

    usersDiv.innerHTML = "";
    data.users.forEach(u => {
      const badge = document.createElement("div");
      badge.className = "user-badge";
      badge.style.background = u.color;
      badge.textContent = u.name.slice(-4).toUpperCase();
      usersDiv.appendChild(badge);
    });
  });

  window.socket.on("stroke.begin", op => ops.push({ ...op, points: [] }));
  window.socket.on("stroke.data", data => {
    const op = ops.find(o => o.opId === data.opId);
    if (op) op.points.push(...data.points);
    drawPoints(op);
  });

  window.socket.on("op.remove", ({ opId }) => { ops = ops.filter(o => o.opId !== opId); redraw(); });
  window.socket.on("op.restore", ({ op }) => { ops.push(op); redraw(); });

  window.socket.on("cursor", payload => {
    if (!payload?.userId || payload.userId === me?.userId) return;
    otherCursors[payload.userId] = payload;
    drawCursors();
  });

  window.socket.on("user.leave", ({ user }) => {
    delete otherCursors[user.userId];
    drawCursors();
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark")
      ? "☀️ Light"
      : "🌙 Dark";
    redraw();
    drawCursors();
  });

})();

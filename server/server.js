const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'data.json');
let ops = [];
let redoStack = [];
let users = {};

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    ops = JSON.parse(raw) || [];
  } catch {
    ops = [];
  }
}
load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(ops, null, 2));
}
setInterval(persist, 5000);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '..', 'client')));

io.on('connection', (socket) => {
  const userId = uuidv4();
  const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
  users[socket.id] = { userId, color, name: 'User-' + userId.slice(0, 4) };

  socket.emit('init', { ops, user: users[socket.id], users: Object.values(users) });
  io.emit('user.join', { user: users[socket.id] });

  socket.on('stroke.begin', (op) => {
    ops.push({ ...op, points: [] });
    redoStack = [];
    io.emit('stroke.begin', op);
  });

  socket.on('stroke.data', (data) => {
    const op = ops.find(o => o.opId === data.opId);
    if (op) op.points.push(...data.points);
    socket.broadcast.emit('stroke.data', data);
  });

  socket.on('stroke.end', () => persist());

  socket.on('cursor', (data) => socket.broadcast.emit('cursor', data));

  socket.on('undo', () => {
    const last = ops.pop();
    if (!last) return;
    redoStack.push(last);
    io.emit('op.remove', { opId: last.opId });
    persist();
  });

  socket.on('redo', () => {
    const op = redoStack.pop();
    if (!op) return;
    ops.push(op);
    io.emit('op.restore', { op });
    persist();
  });

  socket.on('disconnect', () => {
    io.emit('user.leave', { user: users[socket.id] });
    delete users[socket.id];
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));

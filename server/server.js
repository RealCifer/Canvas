const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'data.json');
let ops = [];
let users = {};

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    ops = JSON.parse(raw) || [];
    console.log('Loaded previous strokes:', ops.length);
  } catch {
    ops = [];
  }
}
load();

function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(ops, null, 2));
  } catch (e) {
    console.error('Error saving data', e);
  }
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

  // Handle strokes
  socket.on('stroke.begin', (op) => {
    ops.push({ ...op, points: [] });
    io.emit('stroke.begin', op);
  });

  socket.on('stroke.data', (data) => {
    const op = ops.find(o => o.opId === data.opId);
    if (op) op.points.push(...data.points);
    socket.broadcast.emit('stroke.data', data);
  });

  socket.on('stroke.end', (op) => {
    persist();
    socket.broadcast.emit('stroke.end', op);
  });

     socket.on('cursor', (data) => {
    socket.broadcast.emit('cursor', data);
  });

  socket.on('undo', () => {
    const last = ops.pop();
    if (last) io.emit('op.remove', { opId: last.opId });
  });

  socket.on('redo', () => {
  });

  socket.on('disconnect', () => {
    io.emit('user.leave', { user: users[socket.id] });
    delete users[socket.id];
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

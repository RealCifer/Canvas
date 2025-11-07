// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Rooms = require('./rooms'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '..', 'client')));

io.on('connection', (socket) => {
  const roomId = "default"; 
  const state = Rooms.getRoom(roomId);

  const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  const userId = uuidv4();
  const user = { userId, color, name: 'User-' + userId.slice(0, 4) };

  Rooms.join(roomId, socket.id, user);

  socket.emit("init", { 
    ops: state.getOps(), 
    user,
    users: Rooms.getUsers(roomId)
  });

  io.emit("user.join", { user });

  socket.on("stroke.begin", (op) => {
    state.beginStroke(op);
    io.emit("stroke.begin", op);
  });
  socket.on("stroke.data", (data) => {
    state.addStrokeData(data);
    socket.broadcast.emit("stroke.data", data);
  });
  socket.on("stroke.end", () => {
  });

  socket.on("cursor", (data) => {
    socket.broadcast.emit("cursor", data);
  });
  socket.on("undo", () => {
    const removed = state.undo();
    if (removed) io.emit("op.remove", { opId: removed.opId });
  });
  socket.on("redo", () => {
    const restored = state.redo();
    if (restored) io.emit("op.restore", { op: restored });
  });

  socket.on("disconnect", () => {
    const leave = Rooms.leave(roomId, socket.id);
    if (leave?.user) io.emit("user.leave", { user: leave.user });
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running at: http://localhost:${PORT}`));

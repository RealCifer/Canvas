// server/rooms.js
const { v4: uuidv4 } = require('uuid');
const DrawingState = require('./drawing-state');

class Room {
  constructor(id) {
    this.id = id;
    this.state = new DrawingState();
    this.users = new Map(); 
  }
}

class RoomRegistry {
  constructor() {
    this.rooms = new Map(); 
  }

  getOrCreate(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId);
  }

  join(roomId, socket) {
    const room = this.getOrCreate(roomId);
    const userId = uuidv4();
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const user = { userId, color, name: 'User-' + userId.slice(0, 4) };
    room.users.set(socket.id, user);
    return { room, user };
  }

  leave(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const user = room.users.get(socketId);
    room.users.delete(socketId);
    if (room.users.size === 0) {
    }
    return { room, user };
  }

  getUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  getState(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.state : null;
  }
}

module.exports = new RoomRegistry();

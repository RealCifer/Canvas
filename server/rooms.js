const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() {
    this.rooms = new Map(); 
  }

  getRoom(roomId = "default") {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        state: new DrawingState(),
        users: new Map()
      });
    }
    return this.rooms.get(roomId).state;
  }

  join(roomId = "default", socketId, user) {
    const room = this.rooms.get(roomId) || this.getRoom(roomId);
    this.rooms.get(roomId).users.set(socketId, user);
  }

  leave(roomId = "default", socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.users.get(socketId);
    room.users.delete(socketId);

    return user || null;
  }

  getUsers(roomId = "default") {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }
}

module.exports = new RoomManager();

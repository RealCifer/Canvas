# Real-Time Collaborative Drawing Canvas

A real-time collaborative whiteboard application where multiple users can draw simultaneously on a shared canvas. The application synchronizes all drawing actions across connected users using WebSockets. No frontend frameworks or drawing libraries are used — all rendering is handled manually using the HTML5 Canvas API.

This project demonstrates:
- Real-time state synchronization
- Custom stroke handling and interpolation
- Multi-user presence awareness
- Shared undo and redo functionality

---

## Features

### Drawing Tools
- Brush and eraser modes
- Adjustable stroke width and color
- Smooth curved stroke rendering (quadratic interpolation)

### Real-Time Collaboration
- Live drawing updates shared across connected clients
- Visual cursor indicators showing where other users are drawing
- Unique color and identity assigned to each user
- User list display indicating who is currently online

### Shared Canvas State
- Global undo and redo functionality
- All users see the same canvas state
- Canvas state persists on the server

### Additional Support
- Works on desktop and mobile devices
- Touch drawing support (e.g., phones/tablets)

---

## Technology Stack

| Category | Technology |
|---------|------------|
| Frontend | HTML, CSS, Vanilla JavaScript, Canvas API |
| Backend | Node.js, Express.js |
| Real-Time Communication | Socket.io |
| State Management | Custom operation history with undo/redo stacks |
| Project Organization | Modular server-state architecture |

---

## Project Structure

collaborative-canvas/
├── client/
│ ├── index.html # UI layout
│ ├── style.css # Styling
│ ├── canvas.js # Drawing + rendering logic
│ ├── websocket.js # Client WebSocket connection
│ └── main.js # Client initialization
├── server/
│ ├── server.js # Express + Socket.io server
│ ├── rooms.js # Room / user session management
│ └── drawing-state.js # Shared stroke state & undo/redo logic
├── package.json
├── README.md
└── ARCHITECTURE.md 


---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/RealCifer/Canvas.git
cd Canvas

npm install

npm start

http://localhost:3000

Testing Multi-User Collaboration

To view collaboration in action:

Open http://localhost:3000 in two different browsers 
Open one instance in your laptop, and one in your phone 
Both users will see each other's drawing strokes and cursor movements in real time.

Undo / Redo Logic
Every stroke is stored as an operation (ops[])
Undo removes the most recent stroke and moves it into redoStack[]
Redo restores the most recently undone stroke
State remains synchronized across all active users

Developed by Aditya Khamait
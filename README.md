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

```
collaborative-canvas/
├── client/
│   ├── index.html         
│   ├── style.css           
│   ├── canvas.js           
│   ├── websocket.js       
│   └── main.js             
│
├── server/
│   ├── server.js          
│   ├── rooms.js           
│   └── drawing-state.js   
│
├── package.json
├── README.md
└── ARCHITECTURE.md
```


## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/RealCifer/Canvas.git
cd Canvas
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
npm start
```

Server will run at:
```
http://localhost:3000
```

---

## Testing Multi-User Collaboration

To view collaboration in action:

1. Open the project in **two different browsers**  
   Example:
   - One on your **laptop**
   - One on your **phone**

2. Visit:
```
http://localhost:3000
```

3. Both users will now see:
- Each other's drawing strokes in **real-time**
- Live **cursor indicators**
- Brush / Eraser actions synchronized instantly

---

## Undo / Redo Logic Explanation

| Action | What Happens | Where It Is Stored |
|-------|--------------|-------------------|
| Stroke Drawn | Stroke is added to history | `ops[]` (main history array) |
| Undo | Removes latest stroke and saves it | `redoStack[]` |
| Redo | Restores the most recently undone stroke | Moves from `redoStack[]` back → `ops[]` |

**Canvas state stays synchronized for all active users.**

---

Deployed link - https://canvas-ce4q.onrender.com

**Developed by:** Aditya Khamait

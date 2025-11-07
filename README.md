Real-Time Collaborative Drawing Canvas

This is a real-time collaborative drawing application where multiple users can draw together on a shared canvas. The system synchronizes drawing actions across clients using WebSockets, without relying on frontend frameworks or drawing libraries. The project demonstrates canvas rendering, state synchronization, multi-user presence, and shared undo/redo logic.

Features

Real-time drawing synchronization across multiple users
Brush and eraser tools with adjustable stroke width and color
Smooth stroke rendering using quadratic curve interpolation
Global undo and redo functionality shared between all users
Visual indicators showing active users and their cursor positions
Mobile and touch drawing support
State is shared across all connected users

Technology Stack
Component	Technology Used
Frontend	HTML, CSS, Vanilla JavaScript, HTML5 Canvas
Backend	Node.js, Express
Realtime Communication	Socket.io (WebSocket layer)
State Handling	Custom drawing history + undo/redo stack

Folder Structure
collaborative-canvas/
├── client/
│   ├── index.html
│   ├── style.css
│   ├── canvas.js
│   ├── websocket.js
│   └── main.js
├── server/
│   ├── server.js
│   ├── rooms.js
│   └── drawing-state.js
├── package.json
├── README.md
└── ARCHITECTURE.md

Installation and Setup
1. Clone the repository
git clone https://github.com/RealCifer/Canvas.git
cd Canvas

2. Install dependencies
npm install

3. Start the development server
npm start

4. Open the application

Navigate to:
http://localhost:3000

Testing Multi-User Collaboration
Open the application in two different browser windows or devices:

http://localhost:3000


Drawing in one browser window should appear instantly in the other.

Undo and Redo Behavior

Undo and redo operations apply to the entire shared canvas, not just the initiating user's strokes.
The application maintains:

ops[] — operation history stack
redoStack[] — redo history stack

Undo removes the most recent stroke globally; redo restores it.

Mobile and Touch Support

Touch events are handled so that drawing works on phones and tablets.
No additional configuration is required.



Author

Aditya Khamait

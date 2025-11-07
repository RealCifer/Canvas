## Overview

This project implements a real-time collaborative drawing canvas where multiple users can draw simultaneously on a shared board. All drawing actions, cursor updates, user joins/leaves, and undo/redo operations are synchronized across clients using WebSockets.

The application follows a **client–server model**, where the browser handles rendering and input, and the server manages shared drawing state and broadcasts updates to all connected users.

---

## Data Flow Diagram

```
+-----------+       stroke events       +------------+       broadcast       +-----------+
|  Client A | ------------------------> |            |  ------------------> |  Client B |
| (canvas)  | <------------------------ |   Server   | <------------------  | (canvas)  |
+-----------+     updates + state       | (Socket.io)|       updates        +-----------+
                                        +------------+
```

---

## Key Components

| Component | Location | Responsibility |
|----------|----------|----------------|
| **index.html** | `client/` | UI structure and canvas container |
| **style.css** | `client/` | Styling for toolbar, layout, user badges, cursor overlay |
| **canvas.js** | `client/` | Input handling, drawing logic, mobile support, smoothing |
| **websocket.js** | `client/` | Creates the WebSocket connection (`io()`) |
| **main.js** | `client/` | Client app initialization |
| **server.js** | `server/` | Node.js + Express + Socket.io WebSocket server |
| **rooms.js** | `server/` | (Future-ready) Room/session manager for multi-room boards |
| **drawing-state.js** | `server/` | Shared canvas state + undo/redo manager |

---

## WebSocket Protocol (Event Message Types)

| Event Name | Direction | Payload | Description |
|-----------|-----------|----------|-------------|
| `init` | server → client | `{ ops, user, users[] }` | Sends full canvas + user info on join |
| `stroke.begin` | client → server | `{ opId, tool, color, width }` | Start of a new stroke |
| `stroke.data`  | client → server | `{ opId, points[] }` | Stroke points streamed during drawing |
| `stroke.end` | client → server | `{ opId }` | Indicates the stroke is completed |
| `cursor` | client → server | `{ x, y, userId, color, name }` | Sends live cursor positions |
| `undo` | client → server | none | Requests global undo |
| `redo` | client → server | none | Requests global redo |
| `op.remove` | server → client | `{ opId }` | Remove stroke from canvas |
| `op.restore` | server → client | `{ op }` | Restore stroke to canvas |
| `user.join` | server → client | `{ user }` | New user enters |
| `user.leave` | server → client | `{ user }` | User disconnects |

---

## Undo/Redo Strategy (Global Shared History)

The server maintains two structures:

```
ops[]        = list of all completed strokes (main history)
redoStack[]  = stack of undone strokes
```

### Undo Algorithm
```
last = ops.pop()
redoStack.push(last)
broadcast op.remove(last.opId)
```

### Redo Algorithm
```
restored = redoStack.pop()
ops.push(restored)
broadcast op.restore(restored)
```

Because undo/redo happens **on the server**, all connected clients always stay synchronized.

---

## Performance Considerations

| Optimization | Description |
|-------------|-------------|
| **Normalized Coordinates** | Points stored as percentages (`0.0 - 1.0`), canvas redraw scales correctly on resize |
| **Quad Curve Smoothing** | Smooths stroke appearance, reduces jagged lines |
| **Point Thinning** | Mouse/touch points are filtered to avoid unnecessary redraw |
| **Cursor Updates Throttled** | Cursor broadcast limited to ~30 fps to reduce bandwidth |

---

## Conflict Resolution Strategy

There is **no locking**. Multiple users can draw at the same time.

Conflicts are avoided because:
- Each stroke is independent and stored separately.
- Undo/redo applies to **global stroke history**, not per user.
- The canvas is continually re-rendered from the authoritative shared history (`ops[]`).

---

## How State Stays Consistent

1. Every drawing action modifies state stored **on the server**.
2. The server broadcasts updates to all clients.
3. Each client keeps a local copy of `ops[]` but never changes it directly.
4. The canvas is redrawn every time the shared state updates.

This ensures deterministic, synchronized state across all clients.

---


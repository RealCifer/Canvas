class DrawingState {
  constructor() {
    this.ops = [];     
    this.redoStack = []; 
  }
  getOps() {
    return this.ops;
  }
  beginStroke(op) {
    this.ops.push({ ...op, points: [] }); 
    this.redoStack = []; 
  }
  addStrokeData({ opId, points }) {
    const op = this.ops.find(o => o.opId === opId);
    if (!op) return;
    if (Array.isArray(points) && points.length > 0) {
      op.points.push(...points);
    }
  }
  undo() {
    const last = this.ops.pop();
    if (last) this.redoStack.push(last);
    return last || null;
  }
  redo() {
    const op = this.redoStack.pop();
    if (op) {
      this.ops.push(op);
      return op;
    }
    return null;
  }
  restore(ops = []) {
    this.ops = Array.isArray(ops) ? ops : [];
    this.redoStack = [];
  }
}

module.exports = DrawingState;

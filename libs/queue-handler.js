class QueueHandler {
  constructor(instrumentName) {
    this.queue = [];
    this.lastTick = false;

    this.isActive = false;
    this.instrumentName = instrumentName;
  }

  addIteration(obj) {
    this.queue.push(obj);

    if (!this.isActive) {
      this.isActive = true;
      this.nextStep();
    }
  }

  updateLastTick(obj) {
    this.lastTick = obj;

    if (!this.isActive) {
      this.isActive = true;
      this.nextTick();
    }
  }

  async nextTick() {
    // ...

    setTimeout(() => { this.nextTick(); }, 1 * 1000);
  }

  async nextStep() {
    const step = this.queue.shift();

    if (!step) {
      this.isActive = false;
      return true;
    }

    return this.nextStep();
  }
}

module.exports = QueueHandler;

const { EventEmitter } = require("node:events");

function createEventBus() {
  const emitter = new EventEmitter();
  const pending = new Set();

  return {
    publish(eventName, payload) {
      emitter.emit(eventName, { name: eventName, occurredAt: new Date().toISOString(), payload });
    },

    subscribe(eventName, handler) {
      emitter.on(eventName, event => {
        const task = Promise.resolve()
          .then(() => handler(event))
          .catch(err => console.error(`[event:${eventName}] handler failed`, err))
          .finally(() => pending.delete(task));
        pending.add(task);
      });
    },

    drain() {
      return Promise.all(pending);
    }
  };
}

const noopEventBus = {
  publish() {},
  subscribe() {},
  drain: async () => {}
};

module.exports = { createEventBus, noopEventBus };

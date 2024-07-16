class EventEmitter {
  #events = {};
  get events() {
    return this.#events;
  }
  async has(event) {
    return this.#events[event] != null;
  }
  async on(event, callback) {
    let events = this.#events[event] ||= [];
    if (events.indexOf(callback) == -1) {
      events.push(callback);
    }
  }
  async emit(event, args) {
    if (this.#events[event]) {
      const events = this.#events[event];
      if (events.length == 1) {
        return await events[0](args);
      } else {
        for (let e of events) {
          await e(args);
        }
      }
    }
  }
  async remove(event, callback) {
    if (this.#events[event]) {
      const events = this.#events[event];
      const index = events.indexOf(callback);
      if (index != -1) {
        events.splice(index, 1);
      }
      if (events.length === 0) {
        delete this.#events[event];
      }
    }
  }
  async postMessage(query, args, scope) {
    const element = scope || document;
    const documentElements = Array.from(element.querySelectorAll(query));
    const queryableElements = crs.binding.queryable.query(query);
    const items = /* @__PURE__ */ new Set([...documentElements, ...queryableElements]);
    const promises = [];
    for (let item of items) {
      promises.push(item.onMessage.call(item, args));
    }
    await Promise.all(promises);
  }
}
(crs.binding.events ||= {}).emitter = new EventEmitter();
export {
  EventEmitter
};

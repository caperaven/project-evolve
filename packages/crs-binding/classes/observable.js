class Observable {
  #events = [];
  #eventEmitter = new EventTarget();
  #allowNotifications = true;
  get allowNotifications() {
    return this.#allowNotifications;
  }
  set allowNotifications(newValue) {
    this.#allowNotifications = newValue;
  }
  get events() {
    return Object.freeze(this.#events);
  }
  dispose() {
    for (const { event, listener } of this.#events) {
      this.#eventEmitter.removeEventListener(event, listener);
    }
    this.#events.length = 0;
  }
  addEventListener(event, listener) {
    this.#eventEmitter.addEventListener(event, listener);
    this.#events.push({ event, listener });
  }
  removeEventListener(event, listener) {
    this.#eventEmitter.removeEventListener(event, listener);
    this.#events.splice(this.#events.indexOf({ event, listener }), 1);
  }
  notify(event, detail) {
    if (this.allowNotifications === true) {
      this.#eventEmitter.dispatchEvent(new CustomEvent(event, { detail }));
    }
  }
}
crs.classes.Observable = Observable;
export {
  Observable
};

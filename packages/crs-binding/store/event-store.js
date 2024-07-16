class EventStore {
  #store = {};
  #eventHandler = this.#onEvent.bind(this);
  #callEventHandler = this.callEvent.bind(this);
  get store() {
    return this.#store;
  }
  async #onEvent(event) {
    const targets = getTargets(event);
    if (targets.length === 0)
      return;
    for (const target of targets) {
      const uuid = target["__uuid"];
      const data = this.#store[event.type];
      const intent = data[uuid];
      if (intent != null) {
        const bid = target["__bid"];
        if (Array.isArray(intent)) {
          for (const i of intent) {
            await this.#onEventExecute(event, i, bid, target);
          }
          continue;
        }
        await this.#onEventExecute(event, intent, bid, target);
      }
    }
  }
  async #onEventExecute(event, intent, bid, target) {
    let provider = intent.provider;
    provider = provider.replaceAll("\\", "");
    const providerInstance = crs.binding.providers.attrProviders[provider];
    await providerInstance.onEvent?.(event, bid, intent, target);
  }
  async callEvent(event) {
    const target = event.composedPath()[0];
    if (target instanceof HTMLInputElement == false)
      return;
    const uuid = target["__uuid"];
    const data = this.#store[event.type];
    const element = crs.binding.elements[uuid];
    let intent = data[uuid];
    if (intent == null)
      return;
    if (!Array.isArray(intent))
      intent = [intent];
    for (const i of intent) {
      await this.#onEventExecute(event, i, element.__bid, element);
    }
  }
  getIntent(event, uuid) {
    return this.#store[event]?.[uuid];
  }
  getBindingField(event, intent, componentProperty) {
    const intentValue = intent.value;
    for (const key of Object.keys(intentValue)) {
      const value = intentValue[key];
      if (value === componentProperty)
        return key;
    }
  }
  register(event, uuid, intent) {
    const element = crs.binding.elements[uuid];
    const root = element.getRootNode();
    if (event === "change" && element instanceof HTMLInputElement && root instanceof ShadowRoot && root.host.registerEvent != null) {
      root.host.registerEvent(root, event, this.#callEventHandler);
    }
    if (this.#store[event] == null) {
      document.addEventListener(event, this.#eventHandler, {
        capture: true,
        passive: true
      });
      this.#store[event] = {};
    }
    this.#store[event][uuid] ||= [];
    this.#store[event][uuid].push(intent);
  }
  clear(uuid) {
    const element = crs.binding.elements[uuid];
    if (element?.__events == null)
      return;
    const events = element.__events;
    for (const event of events) {
      delete this.#store[event][uuid];
    }
  }
}
function getTargets(event) {
  return event.composedPath().filter((element) => element["__uuid"] != null);
}
export {
  EventStore
};

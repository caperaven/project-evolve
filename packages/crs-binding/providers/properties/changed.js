class ChangedProvider {
  #store = {};
  get store() {
    return this.#store;
  }
  async parse(attr, context) {
    const storeItem = this.#store[context.bid] ||= {};
    const parts = attr.name.split(".changed.");
    const propertyPath = parts[0];
    const action = parts[1];
    const collection = storeItem[propertyPath] ||= [];
    collection.push(await this.getIntent(attr.value, action));
  }
  async getIntent(attrValue, action) {
    const moduleKey = `.${action}`;
    const provider = await crs.binding.providers.getAttrProvider(moduleKey);
    return provider.getIntent(attrValue);
  }
  async update(bid, property) {
    if (this.#store[bid] == null || this.#store[bid][property] == null)
      return;
    const collection = this.#store[bid][property];
    for (const intent of collection) {
      const provider = await crs.binding.providers.getAttrProvider(intent.provider);
      await provider.onEvent?.(null, bid, intent);
    }
  }
  async clear(bid) {
    const storeItem = this.#store[bid];
    delete this.#store[bid];
    crs.binding.utils.disposeProperties(storeItem);
  }
}
export {
  ChangedProvider as default
};

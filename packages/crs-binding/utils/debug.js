class Debug {
  static async help() {
    console.log("overview(element) - get robust debug information for an element");
    console.log("store(element) - get store items for an element");
    console.log("properties(element) - get properties for an element");
    console.log("context(element) - get context for an element");
    console.log("data(element) - get data for an element");
    console.log("providers(element) - get providers for an element");
    console.log("boundTo(bid, propertyPath) - get elements bound to a property path");
  }
  static async overview(element) {
    const bid = element.__bid;
    if (bid == null) {
      return console.log("WARNING: NO BINDING ID FOUND ON ELEMENT");
    }
    console.clear();
    console.group("Debug Information for Element");
    await this.properties(element);
    const store = await this.store(element);
    console.log("Store content");
    console.log(store);
    console.groupEnd();
  }
  static async store(element) {
    const events = Object.keys(crs.binding.eventStore.store);
    const results = [];
    for (const key of events) {
      for (const uuid of Object.keys(crs.binding.eventStore.store[key])) {
        if (uuid === element.__uuid) {
          const obj = crs.binding.eventStore.store[key][uuid];
          obj.event = key;
          results.push(obj);
        }
      }
    }
    return results;
  }
  static async properties(element) {
    const results = [];
    await getTextIntent(element, results);
    await getAttributeIntent(element, results);
    await getEventIntent(element, results);
    console.log("Properties for Element");
    console.table(results);
  }
  static async context(element) {
    const bid = element.__bid;
    console.log("Context for Element");
    return crs.binding.data.getContext(bid);
  }
  static async data(element) {
    const bid = element.__bid;
    console.log("Data for Element");
    return crs.binding.data.getData(bid).data;
  }
  static async providers(element) {
    const items = Array.from(crs.binding.data.getElementProviders(element.__uuid));
    console.log("Providers for Element");
    for (const item of items) {
      console.log(item);
    }
  }
  static async boundTo(bid, propertyPath) {
    const results = [];
    for (const uuid of crs.binding.data.getCallbacks(bid, propertyPath)) {
      results.push(crs.binding.elements[uuid]);
    }
    console.log("Elements using property path on context");
    for (const item of results) {
      console.log(item);
    }
  }
}
async function getTextIntent(element, results) {
  for (const provider of crs.binding.providers.textProviders) {
    if (provider.store[element.__uuid] != null) {
      const expr = provider.store[element.__uuid];
      const expo = crs.binding.functions.get(expr);
      const data = crs.binding.data.getDataForElement(element);
      const value = await expo.function(data);
      results.push({
        "Provider": provider.constructor.name,
        "Attribute": "textContent",
        "Data Property": provider.store[element.__uuid].replace("context:", ""),
        "Data Value": value
      });
    }
  }
}
const CONDITIONAL_PROVIDERS = [".if", ".case", "classlist.if", "classlist.case", "classlist.toggle", ".attr.toggle", "^style..*.if$", "^style..*.case$"];
async function getAttributeIntent(element, results) {
  const providers = crs.binding.providers.attrProviders;
  for (const providerKey of Object.keys(providers)) {
    if (CONDITIONAL_PROVIDERS.indexOf(providerKey) !== -1) {
      await getConditionalIntent(providers[providerKey], element, results);
      continue;
    }
    if (providerKey === "style.") {
      await getStyleIntent(providers[providerKey], element, results);
      continue;
    }
    const provider = providers[providerKey];
    if (typeof provider === "string" || provider.store == null)
      continue;
    const elementStoreItem = provider.store[element.__uuid];
    if (elementStoreItem == null)
      continue;
    for (const propertyPath of Object.keys(elementStoreItem)) {
      for (const attribute of Object.keys(elementStoreItem[propertyPath])) {
        results.push({
          "Provider": provider.constructor.name,
          "Attribute": attribute,
          "Data Property": propertyPath,
          "Data Value": await crs.binding.data.getProperty(element.__bid, propertyPath)
        });
      }
    }
  }
}
async function getEventIntent(element, results) {
  const items = await Debug.store(element);
  for (const intentItem of items) {
    for (const definition of intentItem) {
      const provider = definition.provider;
      if (provider === ".call") {
        const context = crs.binding.data.getContext(element.__bid);
        results.push({
          "Provider": provider,
          "Attribute": intentItem.event,
          "Data Property": definition.value,
          "Data Value": context[definition.value]
        });
        continue;
      }
      if (provider === ".setvalue") {
        const intent = await Debug.store(element);
        for (const storeItem of intent) {
          for (const eventItem of storeItem) {
            results.push({
              "Provider": provider,
              "Attribute": storeItem.event,
              "Data Property": "",
              "Data Value": eventItem.value
            });
          }
        }
        continue;
      }
      for (const bindingPropertyPath of Object.keys(definition.value)) {
        const attribute = definition.value[bindingPropertyPath];
        results.push({
          "Provider": provider,
          "Attribute": attribute,
          "Data Property": bindingPropertyPath,
          "Data Value": await crs.binding.data.getProperty(element.__bid, bindingPropertyPath)
        });
      }
    }
  }
}
async function getConditionalIntent(provider, element, results) {
  if (typeof provider === "string" || provider.store == null)
    return;
  const storeItem = provider.store[element.__uuid];
  if (storeItem == null)
    return;
  for (const attr of Object.keys(storeItem)) {
    const exp = storeItem[attr];
    const data = crs.binding.data.getDataForElement(element);
    const expo = crs.binding.functions.get(exp);
    const result = await expo.function(data);
    results.push({
      "Provider": provider.constructor.name,
      "Attribute": attr,
      "Data Property": exp,
      "Data Value": result
    });
  }
}
async function getStyleIntent(provider, element, results) {
  if (typeof provider === "string")
    return;
  const storeItem = provider.store[element.__uuid];
  if (storeItem == null)
    return;
  for (const attr of Object.keys(storeItem)) {
    const exp = storeItem[attr].replace("context:", "");
    const value = await crs.binding.data.getProperty(element.__bid, exp);
    results.push({
      "Provider": provider.constructor.name,
      "Attribute": attr,
      "Data Property": exp,
      "Data Value": value
    });
  }
}
export {
  Debug
};

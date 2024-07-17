import { getQueries } from "./utils/get-queries.js";
class AttrToggleProvider {
  async onEvent(event, bid, intent, target) {
    for (const query of intent.queries) {
      const element = query == "this" ? target : target.getRootNode().querySelector(query);
      for (const attribute of intent.attributes) {
        const parts = attribute.split(":");
        const attr = parts[0];
        let attrValue = parts[1];
        if (attrValue == null) {
          element.toggleAttribute(attr);
          continue;
        }
        const value = element.getAttribute(attr);
        if (value == null) {
          element.setAttribute(attr, attrValue);
          continue;
        }
        const isTrue = value === "true";
        element.setAttribute(attr, !isTrue);
      }
    }
  }
  async parse(attr, context) {
    const element = attr.ownerElement;
    const nameParts = attr.name.split(".");
    const event = nameParts[0];
    crs.binding.utils.markElement(element, context);
    const uuid = element["__uuid"];
    const valueParts = attr.value.replace(")", "").split("(");
    const attributes = valueParts[1].split(",").map((item) => item.trim().replaceAll("'", ""));
    for (let i = 0; i < attributes.length; i++) {
      let attribute = attributes[i];
      if (attribute.indexOf("=") != -1) {
        const attrParts = attribute.split("=");
        attribute = `${attrParts[0]}:${attrParts[1].replaceAll("'", "")}`;
        attributes[i] = attribute;
      }
    }
    const intent = {
      provider: ".attr.toggle",
      attributes
    };
    getQueries(valueParts[0], intent);
    crs.binding.eventStore.register(event, uuid, intent);
    element.__events ||= [];
    element.__events.push(event);
    element.removeAttribute(attr.name);
  }
  async clear(uuid) {
    crs.binding.eventStore.clear(uuid);
  }
}
export {
  AttrToggleProvider as default
};

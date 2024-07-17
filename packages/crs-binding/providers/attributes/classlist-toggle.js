import { getQueries } from "./utils/get-queries.js";
class ClassListToggleProvider {
  async onEvent(event, bid, intent, target) {
    for (const query of intent.queries) {
      const element = query == "this" ? target : target.getRootNode().querySelector(query);
      for (const className of intent.classNames) {
        element.classList.toggle(className);
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
    const classNames = valueParts[1].split(",").map((item) => item.trim().replaceAll("'", ""));
    const intent = {
      provider: "classlist.toggle",
      classNames
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
  ClassListToggleProvider as default
};

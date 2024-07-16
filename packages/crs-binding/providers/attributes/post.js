import { createEventPacket, createEventParameters } from "./utils/create-event-parameters.js";
import { parseEvent } from "./utils/parse-event.js";
class PostProvider {
  async onEvent(event, bid, intent) {
    await post(intent.value, event);
  }
  async parse(attr) {
    parseEvent(attr, this.getIntent);
  }
  getIntent(attrValue) {
    const parts = attrValue.split("(");
    const queryParts = parts[0].split("[");
    const event = queryParts[0].trim();
    const queries = queryParts[1].replace("]", "").split(",").map((q) => q.trim().replaceAll("'", ""));
    const paramExp = parts[1] ? parts[1].replace(")", "") : null;
    const value = createEventParameters(event, paramExp);
    value.queries = queries;
    return { provider: ".post", value };
  }
  async clear(uuid) {
    crs.binding.eventStore.clear(uuid);
  }
}
async function post(intent, event) {
  const intentObj = Object.assign({}, intent);
  const queries = intentObj.queries;
  delete intentObj.queries;
  const args = createEventPacket(intent, event);
  args.key = intent.event;
  for (const query of queries) {
    const documentElements = Array.from(document.querySelectorAll(query));
    const queryableElements = crs.binding.queryable.query(query);
    const items = /* @__PURE__ */ new Set([...documentElements, ...queryableElements]);
    items.forEach((element) => {
      if (element.onMessage != null) {
        element.onMessage(args);
      }
    });
  }
}
export {
  PostProvider as default
};

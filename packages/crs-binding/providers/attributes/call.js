import { parseEvent } from "./utils/parse-event.js";
import { getQueries } from "./utils/get-queries.js";
class CallProvider {
  async onEvent(event, bid, intent) {
    await execute(bid, intent, event);
  }
  async parse(attr) {
    parseEvent(attr, this.getIntent);
  }
  getIntent(attrValue) {
    const result = { provider: ".call", value: attrValue };
    getQueries(attrValue, result);
    return result;
  }
  async clear(uuid) {
    crs.binding.eventStore.clear(uuid);
  }
}
async function execute(bid, intent, event) {
  let context = crs.binding.data.getContext(bid);
  if (context == null)
    return;
  const parts = intent.value.replace(")", "").split("(");
  let fn = parts[0];
  const args = parts.length == 1 ? [event] : processArgs(parts[1], event, bid);
  if (intent.queries != null) {
    let parent;
    if (context instanceof crs.classes.BindableElement) {
      parent = context.shadowRoot || context;
    } else if (context.element != null) {
      parent = context.element.shadowRoot || context.element;
    } else {
      parent = document;
    }
    for (let query of intent.queries) {
      const elements = parent.querySelectorAll(query);
      for (const element of elements) {
        await element[fn].call(element, ...args);
      }
    }
    return;
  }
  if (fn.indexOf(".") !== -1) {
    const parts2 = fn.split(".");
    fn = parts2.pop();
    context = crs.binding.data.getProperty(bid, parts2.join("."));
  }
  await context[fn].call(context, ...args);
}
function processArgs(expr, event, bid) {
  const args = [];
  const parts = expr.split(",");
  for (let part of parts) {
    part = part.trim();
    if (part.indexOf("$context.") != -1) {
      const path = part.replace("$context.", "");
      const value = crs.binding.data.getProperty(bid, path);
      args.push(value);
      continue;
    }
    if (part === "$event") {
      args.push(event);
      continue;
    } else if (Number.isNaN(part) == true) {
      args.push(Number(part));
      continue;
    } else if (part.indexOf("'") == 0) {
      args.push(part.replaceAll("'", ""));
      continue;
    } else {
      args.push(part);
    }
  }
  return args;
}
export {
  CallProvider as default
};

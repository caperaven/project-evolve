import "../../expressions/code-factories/if.js";
import { bindingUpdate } from "./utils/binding-update.js";
import { bindingParse } from "./utils/binding-parse.js";
import { toKebabCase } from "./../../utils/capitalization.js";
class BindProvider {
  async onEvent(event, bid, intent, target) {
    if (event.target.dataset.ignoreBinding != null)
      return;
    if (event?.detail?.["componentProperty"] != null) {
      return await this.onCustomPropertyEvent(event, bid, intent, target);
    }
    const field = target.dataset.field;
    if (bid == null || field == null)
      return;
    let value = target.value;
    if (target.nodeName === "INPUT") {
      if (target.type === "checkbox") {
        value = target.checked;
      }
      if (target.type === "number") {
        value = Number(value);
      }
    }
    await crs.binding.data.setProperty(bid, field, value);
  }
  async onCustomPropertyEvent(event, bid, intent, target) {
    const componentProperty = event.detail["componentProperty"];
    const kebabComponentProperty = toKebabCase(componentProperty);
    let field = crs.binding.eventStore.getBindingField("change", intent, kebabComponentProperty);
    if (field == null) {
      return;
    }
    const value = target[componentProperty];
    await crs.binding.data.setProperty(bid, field, value);
  }
  async parse(attr, context) {
    const provider = attr.name.indexOf("two-way") != -1 ? ".two-way" : ".bind";
    await bindingParse(attr, context, provider);
  }
  async update(uuid) {
    await bindingUpdate(uuid);
  }
  async clear(uuid) {
    crs.binding.eventStore.clear(uuid);
  }
}
export {
  BindProvider as default
};

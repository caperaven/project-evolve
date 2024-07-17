import { ClassListBase } from "./classlist-base.js";
import { OptionalChainActions } from "../../utils/optional-chain-actions.js";
class ClassListIfProvider extends ClassListBase {
  get providerKey() {
    return "classlist.if";
  }
  async parse(attr, context) {
    const classes = getIfClasses(attr.value);
    await super.parse(attr, context, classes, async (value) => {
      return await crs.binding.expression.ifFactory(value);
    });
  }
}
function getIfClasses(exp) {
  const parts = OptionalChainActions.split(exp);
  const valuesPart = parts[1].replaceAll("[", "").replaceAll("]", ":").replaceAll(",", ":").replaceAll("'", "").split(":").map((item) => item.trim()).filter((item) => item.length > 0);
  const classes = valuesPart;
  const set = new Set(classes);
  return Array.from(set);
}
export {
  ClassListIfProvider as default
};

import { capitalizePropertyPath } from "../../utils/capitalization.js";
class OnceProvider {
  async parse(attr, context) {
    const parts = attr.name.split(".");
    const property = capitalizePropertyPath(parts[0]);
    let value;
    if (attr.value.startsWith("&{")) {
      value = await crs.binding.translations.get_with_markup(attr.value);
    } else {
      value = await crs.binding.data.getProperty(context.bid, attr.value);
    }
    attr.ownerElement[property] = value;
    attr.ownerElement.removeAttribute(attr.name);
  }
}
export {
  OnceProvider as default
};

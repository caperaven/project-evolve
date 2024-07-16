import { capitalizePropertyPath } from "../../../utils/capitalization.js";
const propertyBindingTypes = [".bind", ".two-way", ".one-way", ".once"];
async function bindingUpdate(uuid) {
  const element = crs.binding.elements[uuid];
  if (element == null)
    return;
  let intent = crs.binding.eventStore.getIntent("change", uuid);
  intent ||= crs.binding.eventStore.getIntent("component-change", uuid);
  if (Array.isArray(intent)) {
    for (const i of intent) {
      if (propertyBindingTypes.indexOf(i.provider) !== -1) {
        await applyProperty(element, i);
      }
    }
    return;
  }
  await applyProperty(element, intent);
}
async function applyProperty(element, intent) {
  const properties = Object.keys(intent.value);
  const emptyProperty = ["value", "textContent", "innerText", "innerHTML"];
  for (const property of properties) {
    if (intent.value[property] == null)
      continue;
    const targetProperty = capitalizePropertyPath(intent.value[property]);
    const value = emptyProperty.includes(targetProperty) === true ? "" : null;
    element[targetProperty] = await crs.binding.data.getProperty(element["__bid"], property) ?? value;
  }
}
export {
  bindingUpdate
};

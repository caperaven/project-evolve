async function bindingParse(attr, context, provider) {
  const parts = attr.name.split(".");
  const element = attr.ownerElement;
  const property = parts[0];
  let path = attr.value;
  crs.binding.utils.markElement(element, context);
  element.removeAttribute(attr.name);
  if (property == "value") {
    element.setAttribute("data-field", path);
  }
  const uuid = element["__uuid"];
  const event = "change";
  const intentCollection = crs.binding.eventStore.getIntent(event, uuid);
  const intent = {
    provider,
    value: { [path]: property },
    dataDef: null
  };
  if (intentCollection != null) {
    intentCollection.push(intent);
  } else {
    crs.binding.eventStore.register(event, uuid, intent);
  }
  crs.binding.data.setCallback(element["__uuid"], context.bid, [path], provider);
  element.__events ||= [];
  element.__events.push(event);
}
export {
  bindingParse
};

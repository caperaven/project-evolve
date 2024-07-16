class BindableElement extends HTMLElement {
  #bid;
  #allowNotifications = true;
  get allowNotifications() {
    return this.#allowNotifications;
  }
  set allowNotifications(newValue) {
    this.#allowNotifications = newValue;
  }
  get hasStyle() {
    return true;
  }
  get shadowDom() {
    return false;
  }
  get hasOwnContext() {
    return true;
  }
  get bid() {
    return this.#bid;
  }
  constructor() {
    super();
    if (this.shadowDom == true) {
      this.attachShadow({ mode: "open" });
    }
    if (this.hasOwnContext == true) {
      this.#bid = crs.binding.data.addObject(this.constructor.name);
      crs.binding.data.addContext(this.#bid, this);
    }
    crs.binding.dom.enableEvents(this);
  }
  dispose() {
    crs.binding.dom.disableEvents(this);
    crs.binding.utils.disposeProperties(this);
  }
  async connectedCallback() {
    await this["preLoad"]?.();
    await loadHtml(this);
    await load(this);
    await setName(this);
    this.dataset.ready = "true";
    this.dispatchEvent(new CustomEvent("ready", { bubbles: true, composed: true }));
  }
  async disconnectedCallback() {
    this.dispose();
    crs.binding.utils.unmarkElement(this);
    crs.binding.utils.disposeProperties(this);
    await crs.binding.templates.remove(this.constructor.name);
    await crs.binding.data.remove(this.#bid);
  }
  getProperty(property) {
    return crs.binding.data.getProperty(this, property);
  }
  async setProperty(property, value) {
    await crs.binding.data.setProperty(this, property, value);
  }
  async updateProperty(property, callback) {
    await crs.binding.data.updateProperty(this, property, callback);
  }
  notify(event, detail) {
    if (this.allowNotifications === true) {
      this.dispatchEvent(new CustomEvent(event, { detail, composed: true, bubbles: true }));
    }
  }
}
function getHtmlPath(obj) {
  const mobiPath = obj.mobi;
  if (mobiPath != null && /Mobi/.test(navigator.userAgent)) {
    return mobiPath;
  }
  return obj.html;
}
async function setName(component) {
  requestAnimationFrame(() => {
    const name = component.getAttribute("id");
    if (name != null) {
      crs.binding.data.setName(component.bid, name);
    }
  });
}
async function load(component) {
  if (component.load != null) {
    await component.load.call(component);
  }
}
async function loadHtml(component) {
  if (component.html == null)
    return;
  let styleLink = "";
  if (component.hasStyle == true) {
    styleLink = `<link rel="stylesheet" href="${component.html.replace(".html", ".css")}">`;
  }
  let html = await crs.binding.templates.get(component.constructor.name, getHtmlPath(component));
  html = `${styleLink}${html}`;
  if (component.shadowRoot != null) {
    component.shadowRoot.innerHTML = html;
  } else {
    component.innerHTML = html;
  }
  await crs.binding.parsers.parseElements(component.shadowRoot ? component.shadowRoot.children : component.children, component);
  await crs.binding.data.updateContext(component.bid);
}
crs.classes.BindableElement = BindableElement;
export {
  BindableElement
};

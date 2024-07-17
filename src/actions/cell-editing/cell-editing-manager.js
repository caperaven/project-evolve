import {validateCell} from "./cell-validation.js";

class CellEditingManager extends crs.classes.Observable {
    #store = {};
    #currentCell = null;
    #focusCell = null;
    #keyDownHandler = this.#keyDown.bind(this);
    #focusInHandler = this.#focusIn.bind(this);
    #keyUpTarget = null;
    #clickHandler = this.#click.bind(this);
    #dblclickHandler = this.#dblclick.bind(this);

    constructor() {
        super();
        document.addEventListener("keydown", this.#keyDownHandler, { capture: true, composed: true });
        document.addEventListener("click", this.#clickHandler, { capture: true, composed: true });
        document.addEventListener("dblclick", this.#dblclickHandler, { capture: true, composed: true });
    }

    dispose() {
        document.removeEventListener("keydown", this.#keyDownHandler, { capture: true, composed: true });
        document.removeEventListener("click", this.#clickHandler, { capture: true, composed: true });
        document.removeEventListener("dblclick", this.#dblclickHandler, { capture: true, composed: true });

        crs.binding.utils.disposeProperties(this.#store);
        this.#store = null;
        super.dispose();
    }

    async #setFocusCell(element) {
        // 1 remove focus decorations from current focus item
        if (this.#focusCell != null && this.#focusCell.dataset.celltype != null) {
            const text = this.#focusCell.firstElementChild.textContent;
            this.#focusCell.classList.remove("collection");
            this.#focusCell.innerHTML = text;
        }

        // 2 add focus decoration to new focus item if required
        this.#focusCell = element;
        if (this.#focusCell.dataset.celltype != null) {
            await createEditable(this.#focusCell);
        }
    }

    async #startEditing(target) {
        if (target.classList.contains("collection")) {
            target = target.firstElementChild;
        }

        target.__oldValue = target.textContent;
        target.setAttribute("contenteditable", "true");
        this.#currentCell = target;
        setSelectionRange(target);
    }

    async #endEditing(target) {
        const result = await validateCell(target);

        this.#currentCell = null;
        target.removeAttribute("contenteditable");
        clearSelectionRange();

        // if the value is valid then update accordingly.
        if (result === true) {
            delete target.__oldValue;
            await setValueOnModel(target);
            return true;
        }

        return false;
    }

    async #click(event) {
        const target = event.composedPath()[0];

        if (target.nodeName === "SPAN" && target.parentElement.dataset.contenteditable != null) return;

        if (target.nodeName === "BUTTON" && target.parentElement.dataset.contenteditable != null) {
            return this.#btnClick(target);
        }

        if (this.#currentCell != null) {
            await this.#endEditing(this.#currentCell);
        }

        await this.#setFocusCell(target);
    }

    async #btnClick(target) {
        const action = target.dataset.action;
        const fieldName = target.parentElement.dataset.field;
        const definitionElement = target.closest("[data-def]");
        const definition = definitionElement.dataset.def;

        const fieldDefinition = await crs.call("cell_editing", "get_field_definition", {
            name: definition,
            field_name: fieldName
        })

        const model = await crs.call("cell_editing", "get_model", {
            name: definition
        });

        if (fieldDefinition.callback != null) {
            // 1. call the callback and get the result
            const result = await fieldDefinition.callback(action, fieldName, fieldDefinition, model);

            // if the result is a collection then we show a select to find the item.
            if (Array.isArray(result)) {
                return this.#showSelect(target, result);
            }

            return this.#selectItem(target, result);
        }
    }

    async #dblclick(event) {
        const target = event.composedPath()[0];
        if (target.dataset.field == null || target.dataset.contenteditable == null) return;
        await this.#startEditing(target);
    }

    async #keyDown(event) {
        const target = event.composedPath()[0];

        if (target.dataset.field == null || target.dataset.contenteditable == null) return;

        if (event.code === "Escape") {
            event.preventDefault();
            event.stopPropagation();

            target.textContent = target.__oldValue || "";
            return await this.#endEditing(target);
        }

        if (event.code === "Enter") {
            event.preventDefault();
            event.stopPropagation();

            if (target.getAttribute("contenteditable") == null) {
                await this.#startEditing(target);
            }
            else {
                await this.#endEditing(target);
            }

            return;
        }

        // we need this to overcome event issues with focusout and focusin through shadow dom.
        // when you are tabbing through cells that are on the same shadow root the focusout and focusin events are not fired.
        // since we need to step editing on focus out we need to do it manually.
        if (event.code === "Tab") {
            await this.#endEditing(target);
            this.#keyUpTarget = target.getRootNode();
            this.#keyUpTarget.addEventListener("focusin", this.#focusInHandler, { capture: true, composed: true });
        }

        // if we are editing a numeric input then only allow numeric keys.
        if (target.dataset.datatype === "number") {
            if (/Digit[0-9]|Numpad[0-9]|NumpadDecimal|Comma|Period|Backspace|ArrowRight|ArrowLeft|Tab/.test(event.code) == false) {
                event.preventDefault();
                event.stopPropagation();
            }
            return;
        }

        // if we are editing a date input then only allow numeric keys.
        if (target.dataset.datatype === "date") {
            if (/Digit[0-9]|Numpad[0-9]|Backspace|ArrowRight|ArrowLeft|Tab|Slash|Minus/.test(event.code) == false) {
                event.preventDefault();
                event.stopPropagation();
            }
            return;
        }
    }

    async #focusIn(event) {
        this.#keyUpTarget.removeEventListener("focusin", this.#focusInHandler, { capture: true, composed: true });
        this.#keyUpTarget = null;

        const target = event.composedPath()[0];
        if (target.dataset.field != null && target.dataset.contenteditable != null) {
            await this.#setFocusCell(target);
        }
    }

    /**
     * Show a select to find the item and once you have found it use selectItem to select it.
     * @param target - the button that was clicked.
     * @param items - the data items to select from.
     * @returns {Promise<void>}
     */
    async #showSelect(target, items) {

    }

    /**
     * Update the model with the selected item.
     * This also includes other properties that may be required.
     * Also make sure that the relevant UI has been updated.
     * @param target - the button that was clicked.
     * @param item - the selected item.
     * @returns {Promise<void>}
     */
    async #selectItem(target, item) {

    }

    /**
     * @method register - register a cell or group of cells for editing.
     * Pass the top most element that contains the cells.
     * Sometimes that would be a single element or a element with children.
     * @param name {string} - the name of the cell or group of cells.
     * @param definition {object} - the definition of the cell or group of cells.
     * @param element {HTMLElement} - the top most element that contains the cells.
     * @param model {object} - the model that contains the data for the cells.
     * @returns {Promise<void>}
     */
    async register(name, definition, element, model) {
        this.#store[name] = {
            definition,
            model
        }

        element.dataset.def = name;
        await updateCells(element);
    }

    /**
     * @method unregister - unregister a cell or group of cells for editing.
     * @param name {string} - the name of the cell or group of cells.
     * @returns {Promise<void>}
     */
    async unregister(name) {
        const storeItem = this.#store[name];

        if (storeItem != null) {
            delete storeItem["definition"];
            delete storeItem["model"];
            delete storeItem["callback"];
        }
    }

    async getDefinition(name) {
        return this.#store[name]?.definition;
    }

    async getFieldDefinition(name, fieldName) {
        const definition = await this.getDefinition(name);
        return definition?.fields[fieldName];
    }

    /**
     * @method getModel - get the model of a cell or group of cells.
     * @param name {string} - the name of the cell or group of cells.
     * @returns {Promise<*>}
     */
    async getModel(name) {
        return this.#store[name]?.model;
    }
}

/**
 * @method updateCells - for all the content editable cells update the HTML as required.
 * @param element
 * @returns {Promise<void>}
 */
async function updateCells(element) {
    // 1. Make all cells tab focusable.
    if (element.matches("[data-contenteditable]")) {
        element.setAttribute("tabindex", "0");
        await setElementTypes(element);
    }

    // 2. Check the children for contenteditable and  make them focusable.
    for (const child of element.querySelectorAll("[data-contenteditable]")) {
        child.setAttribute("tabindex", "0");
        await setElementTypes(child);
    }
}

function clearSelectionRange() {
    const selection = window.getSelection();
    selection.removeAllRanges();
}

function setSelectionRange(target) {
    const range = document.createRange();
    range.selectNodeContents(target);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    target.focus();
}

async function setValueOnModel(cellElement) {
    const fieldName = cellElement.dataset.field;
    const definitionElement = cellElement.closest("[data-def]");
    const definition = definitionElement.dataset.def;

    const fieldDefinition = await crs.call("cell_editing", "get_field_definition", {
        name: definition,
        field_name: fieldName
    })

    const model = await crs.call("cell_editing", "get_model", {
        name: definition
    });

    let value = cellElement.textContent;

    if (fieldDefinition.dataType === "number") {
        value = Number(value);
    }

    if (fieldDefinition.dataType === "boolean") {
        value = value === "true";
    }

    if (fieldDefinition.dataType === "date") {
        value = new Date(value);
    }

    await crs.binding.utils.setValueOnPath(model, fieldName, value);
}

async function setElementTypes(cellElement) {
    const definitionElement = cellElement.closest("[data-def]");
    const definition = definitionElement.dataset.def;
    const fieldName = cellElement.dataset.field;

    const fieldDefinition = await crs.call("cell_editing", "get_field_definition", {
        name: definition,
        field_name: fieldName
    })

    const dataType = fieldDefinition.dataType || "string";
    cellElement.dataset.datatype = dataType;

    if (fieldDefinition.defaultValidations?.required?.required === true) {
        cellElement.setAttribute("aria-required", "true");
    }

    if (fieldDefinition.cellType != null) {
        cellElement.dataset.celltype = fieldDefinition.cellType;
    }
}

async function createEditable(cellElement) {
    const field = cellElement.dataset.field;

    const fragment = document.createDocumentFragment();
    const span = document.createElement("span");
    span.dataset.field = field;
    span.dataset.contenteditable = "true";
    span.textContent = cellElement.textContent;

    fragment.appendChild(span);

    let icon = "chevron-down";

    switch (cellElement.dataset.celltype) {
        case "lookup": {
            icon = "lookup";
            break;
        }
        // ... add ore options as it may become necessary.
    }

    const button = document.createElement("button");
    button.setAttribute("tabindex", "-1");
    button.setAttribute("aria-label", "Open");
    button.classList.add("icon");
    button.textContent = icon;
    button.dataset.action = cellElement.dataset.celltype;
    fragment.appendChild(button);

    cellElement.textContent = "";
    cellElement.classList.add("collection");
    cellElement.appendChild(fragment);
}

crs.cellEditing = new CellEditingManager();

/**
 * @class SelectionManager - This class manages the selection of a tri-state checkbox, and its dependent items.
 * Will listen for checkedChange events on the container element and update the respective items accordingly
 * i.e. If the master checkbox emits a checkedChange event, all dependent items will be updated accordingly.
 * If a dependent item emits a checkedChange, the master checkbox will be updated accordingly.
 */
export class SelectionManager {
    #containerElement;
    #masterQuery;
    #masterAttribute;
    #itemQuery;
    #itemAttribute;
    #checkedChangedHandler = this.#checkedChanged.bind(this);

    /**
     * @constructor
     * @param element - the element that contains the collection of items and that will also limit the query selection for UI
     * @param masterQuery - the query that will be used to determine if an element is a master element (select all or none)
     * @param masterAttribute - The attribute on the masterCheckbox that will be toggled when the master checkbox is selected (i.e. aria-checked)
     * @param itemQuery - the query that will be used to determine if an element is a child element to be toggled
     * @param itemAttribute - The attribute on the child items that will be toggled when the child item is selected (i.e. aria-selected)
     */
    constructor(element, masterQuery, masterAttribute = "aria-checked", itemQuery, itemAttribute = "aria-selected") {
        this.#containerElement = element;
        this.#masterQuery = masterQuery;
        this.#masterAttribute = masterAttribute;
        this.#itemQuery = itemQuery;
        this.#itemAttribute = itemAttribute;
        this.#containerElement.addEventListener("checkedChange", this.#checkedChangedHandler);
        this.#checkChildrenStates();
    }

    dispose() {
        this.#containerElement.removeEventListener("checkedChange", this.#checkedChangedHandler);
        this.#checkedChangedHandler = null;
        this.#containerElement = null;
        this.#masterQuery = null;
        this.#masterAttribute = null;
        this.#itemQuery = null;
        this.#itemAttribute = null;
    }

    /**
     * checkedChanged event handler. Will check the event to see if it is a master or selection element emitted a checkedChange event and update the items accordingly.
     * @param event {MouseEvent} - the checkedChanged event
     * @returns {Promise<void>}
     */
    async #checkedChanged(event) {
        const triggeredElement = this.#getElement(event);
        if (triggeredElement == null) return;

        if (triggeredElement.matches(this.#masterQuery)) {
            const checkedState = triggeredElement.getAttribute(this.#masterAttribute);
            if (checkedState === "mixed") return;
            this.#setChildrenStates(checkedState === "true")
        }

        if (triggeredElement.matches(this.#itemQuery)) {
            this.#checkChildrenStates();
        }
    }

    /**
     * Attempts to find the master checkbox or the child checkbox that emitted the checkedChange event.
     * @param event {Event} - The checkedChange event
     * @param event.detail.target {Element} - The element that emitted the checkedChange event
     * @returns {*|null}
     */
    #getElement(event) {
        const element = event?.detail?.target || event.target;
        if (element == null) return;

        if (element.matches(this.#masterQuery) || element.matches(this.#itemQuery)) return element;

        const shadowRoot = element.getRootNode();
        if (shadowRoot.host == null) return;
        if (shadowRoot.host.matches(this.#masterQuery) || shadowRoot.host.matches(this.#itemQuery)) return shadowRoot.host;
    }

    /**
     * Sets the state of the master checkbox, and all dependent items.
     * @param checked {boolean|'mixed'} - the state to set the master checkbox to
     * @param element {HTMLElement} - the master checkbox
     */
    #setMasterState(checked, element) {
        if (element.matches("check-box")) {
            element.checked = checked;
        } else {
            element.setAttribute(this.#masterAttribute, checked);
        }
    }

    /**
     * Goes through the children checkboxes checking which are checked.
     * If all are checked, the master checkbox will be checked.
     * If none are checked, the master checkbox will be unchecked.
     * If some are checked, the master checkbox will be mixed.
     */
    #checkChildrenStates() {
        const dependents = this.#containerElement.querySelectorAll(this.#itemQuery);
        if (dependents.length === 0) return;

        const master = this.#containerElement.querySelector(this.#masterQuery);

        let checkCount = 0;
        for (const dependent of dependents) {
            const checked = dependent.getAttribute(this.#itemAttribute) === "true";

            if(checked) {
                checkCount++;
            }

         }

        if (checkCount === 0) {
            this.#setMasterState(false, master);
        }

        if (checkCount === dependents.length) {
            this.#setMasterState(true, master);
        }

        if (checkCount > 0 && checkCount < dependents.length) {
            this.#setMasterState("mixed", master);
        }
    }

    /**
     * Sets the state of all children checkboxes.
     * @param checked {boolean} - the state to set the dependent checkboxes to
     */
    #setChildrenStates(checked) {
        const dependents = this.#containerElement.querySelectorAll(this.#itemQuery);
        if (dependents.length === 0) return;

        for (const dependent of dependents) {
            this.#setChildState(checked, dependent);
        }
    }

    /**
     * Sets the state of a child checkbox.
     * @param checked {boolean} - the state to set the dependent checkbox to
     * @param checkbox {HTMLElement} - the dependent checkbox
     */
    #setChildState(checked, element) {
        element.setAttribute(this.#itemAttribute, checked);
    }
}
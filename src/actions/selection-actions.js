import {SelectionManager} from "../managers/selection-manager/selection-manager.js";

export class SelectionActions {
    static async perform(step, context, process, item) {
        await this[step.action]?.(step, context, process, item);
    }

    /**
     * Enables the selection-manager on the parent container element which will manage the toggling of a master checkbox and its dependent checkboxes.
     * @param step {object} - The step object.
     * @param context {object} - The context object.
     * @param process {object} - The current process object.
     * @param item {object} - The item object.
     *
     * @param step.args.element {HTMLElement} - The parent container who needs to listen for click events
     * @param step.args.master_query {string} - The query selector for the master checkbox
     * @param step.args.master_attribute {string} - The attribute on the masterCheckbox that will be toggled (i.e. aria-checked)
     * @param step.args.item_query {string} - The query selector for the dependent checkboxes
     * @param step.args.item_attribute {string} - The attribute on the child items that will be toggled (i.e. aria-selected)
     * @returns {Promise<void>}
     */
    static async enable(step, context, process, item) {
        const element = await crs.dom.get_element(step, context, process, item);
        const masterQuery = await crs.process.getValue(step.args.master_query, context, process, item);
        const masterAttribute = await crs.process.getValue(step.args.master_attribute, context, process, item);
        const itemQuery = await crs.process.getValue(step.args.item_query, context, process, item);
        const itemAttribute = await crs.process.getValue(step.args.item_attribute, context, process, item);

        element.__selectionManager = new SelectionManager(element, masterQuery, masterAttribute, itemQuery, itemAttribute);
    }

    /**
     * Disables the selection-manager on the parent container element if one is found.
     * @param step {object} - The step object.
     * @param context {object} - The context object.
     * @param process {object} - The current process object.
     * @param item {object} - The item object.
     *
     * @param step.args.element {HTMLElement} - The parent container where the eventListener needs to be removed
     * @returns {Promise<void>}
     */
    static async disable(step, context, process, item) {
        const element = await crs.dom.get_element(step, context, process, item);

        if (element.__selectionManager) {
            element.__selectionManager = element.__selectionManager.dispose();
        }
    }
}

crs.intent.selection = SelectionActions;
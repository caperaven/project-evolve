import {VirtualizationManager} from "./../managers/virtualization/virtualization-manager.js";

export class VirtualizationActions {
    static async perform(step, context, process, item) {
        await this[step.action]?.(step, context, process, item);
    }

    /**
     * @method enable - enable virtualization on a element
     * @param step {object} - The step object.
     * @param context {object} - The context object.
     * @param process {object} - The current process object.
     * @param item {object} - The item object.
     *
     * @param step.args.element {HTMLElement} - Element to enable virtualization on.
     * @param step.args.itemSize {number} - The size of each item.
     * @param step.args.itemCount {number} - The number of items.
     * @returns {Promise<void>}
     */
    static async enable(step, context, process, item) {
        return new Promise(async resolve => {
            const element = await crs.dom.get_element(step, context, process, item);
            const itemSize = await crs.process.getValue(step.args.itemSize, context, process, item);
            const template = await crs.process.getValue(step.args.template, context, process, item);
            const inflationFn = await crs.process.getValue(step.args.inflation, context, process, item);
            const manager = await crs.process.getValue(step.args.manager, context, process, item);
            const direction = await crs.process.getValue(step.args.direction || "vertical", context, process, item);
            const callbacks = await crs.process.getValue(step.args.callbacks || {}, context, process, item);

            element.__virtualizationManager = new VirtualizationManager(element, template, inflationFn, manager, itemSize, callbacks, direction);

            await crs.call("component", "wait_for_element_render", { element })

            await element.__virtualizationManager.initialize();
            resolve();
        });
    }

    static async disable(step, context, process, item) {
        const element = await crs.dom.get_element(step, context, process, item);
        if (element == null) return;

        if (element.__virtualizationManager != null) {
            await element.__virtualizationManager.dispose();
            delete element.__virtualizationManager;
        }
    }
}

crs.intent.virtualization = VirtualizationActions;
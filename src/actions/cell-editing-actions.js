import "./cell-editing/cell-editing-manager.js"


export class CellEditingActions {
    static async perform(step, context, process, item) {
        await this[step.action]?.(step, context, process, item);
    }

    static async register(step, context, process, item) {
        const name = await crs.process.getValue(step.args.name, context, process, item);
        const element = await crs.dom.get_element(step.args.element, context, process, item);
        const definition = await crs.process.getValue(step.args.definition, context, process, item);
        const model = await crs.process.getValue(step.args.model, context, process, item);
        await crs.cellEditing.register(name, definition, element, model);
    }

    static async unregister(step, context, process, item) {
        const name = await crs.process.getValue(step.args.name, context, process, item);
        await crs.cellEditing.unregister(name);
    }

    static async get_field_definition(step, context, process, item) {
        const name = await crs.process.getValue(step.args.name, context, process, item);
        const fieldName = await crs.process.getValue(step.args.field_name, context, process, item);
        return await crs.cellEditing.getFieldDefinition(name, fieldName);
    }

    static async get_model(step, context, process, item) {
        const name = await crs.process.getValue(step.args.name, context, process, item);
        return await crs.cellEditing.getModel(name);
    }
}

crs.intent.cell_editing = CellEditingActions;
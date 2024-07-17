export const ModelProxyHandler = {
    get: function (target, prop) {
        return target[prop];
    },

    set: function (receiver, property, value, proxy) {
        receiver[property] = value;
        setConditionalDefaults(proxy, property);
        return true;
    }
}

/**
 * @function setConditionalDefaults - The definition has a conditionalDefaults object.
 * This object defines what fields need to be updated a given field has changed.
 * Look up those fields and then check if those fields have conditional defaults defined on.
 * If they do, update them accordingly.
 * @param proxy
 * @param property
 */
function setConditionalDefaults(proxy, property) {
    const definition = globalThis.recordDefinitions[proxy.$manager];
    if (definition == null) return;

    // 1. get me a list of fields that need to be updated if I change
    const updateFields = definition.conditionalDefaultsMap[property];
    if (updateFields == null) return;

    // 2. go through those fields and make updates if their conditional defaults are met
    for (const updateField of updateFields) {
        const fieldDef = definition.fields.find(f => f.field === updateField || f.name === updateField);
        if (fieldDef.conditionalDefaults == null) continue;

        for (const rule of fieldDef.conditionalDefaults) {
            if (rule.conditionExpr(proxy)) {
                proxy[updateField] = rule.value;
            }
        }
    }
}
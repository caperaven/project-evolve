export function assertRequired(value, context, message, allowEmpty=false, dataType=null) {
    if (value == null) {
        throw new Error(`[${context}] ${message}`);
    }

    if (typeof value === "string") {
        value = value.trim();
        if (value === "" && !allowEmpty) {
            throw new Error(`[${context}] ${message}`);
        }
    }

    if (dataType != null) {
        if (typeof value !== dataType) {
            throw new Error(`[${context}] value: ${value}, should be of type ${dataType}`);
        }
    }

    return value;
}
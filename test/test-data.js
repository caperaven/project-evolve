class TestData {
    static async perform(step, context, process, item) {
        await this[step.action]?.(step, context, process, item);
    }

    /**
     * @method get - Get test data.
     * @param step {Object} - The step object.
     * @param context {Object} - The context of the process.
     * @param process {Object} - The process that is currently running.
     * @param item {Object} - The item that is being processed.
     *
     * @param step.args.fields {Object} - defines a dictionary where the key is the field name and the value the field data type.
     * @param step.args.count {Number} - The number of items to generate.
     * @returns {Promise<array>}
     */
    static async get(step, context, process, item) {
        const fields = await crs.process.getValue(step.args.fields, context, process, item);
        const count = await crs.process.getValue(step.args.count, context, process, item);

        const result = [];
        for (let i = 0; i < count; i++) {
            const item = { id: i };

            for (let [field, value] of Object.entries(fields)) {
                let parts = value.split(":");
                const type = parts[0];
                parts.splice(0, 1);
                item[field] = await Random[type](field, ...parts, i);
            }

            result.push(item);
        }
        return result;
    }
}

class Random {
    /**
     * @method int - Get a random integer.
     * @parma field {string} - The field name.
     * @param min {number} - The minimum value.
     * @param max {number} - The maximum value.
     * @returns {Promise<*>}
     *
     * @example <caption>javascript example</caption>
     * const int = await Random.int(1, 10);
     */
    static async int(field, min, max) {
        min = Number(min);
        max = Number(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * @method float - Get a random float.
     * @param field {string} - The field name.
     * @param min {number} - The minimum value.
     * @param max {number} - The maximum value.
     * @returns {Promise<*>}
     *
     * @example <caption>javascript example</caption>
     * const float = await Random.float(1, 10);
     */
    static async float(field, min, max) {
        min = Number(min);
        max = Number(max);
        return Math.random() * (max - min) + min;
    }

    static async bool() {
        const value = await this.int(null, 0, 1);
        return Boolean(value);
    }

    /**
     * @method string - Get a random string.
     * @param field {string} - The field name.
     * @param length {number|string} - The length of the string.
     * @returns {Promise<string>}
     *
     * @example <caption>javascript example</caption>
     * const string = await Random.string(10);
     */
    static async string(field, length, count) {
        if (length === "auto") {
            return `${field}${count}`;
        }

        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < Number(length); i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
     * @method date - Get a random date.
     * @param field {string} - The field name.
     * @param min {number} - The minimum date.
     * @param max {number} - The maximum date.
     * @returns {Promise<Date>}
     *
     * @example <caption>javascript example</caption>
     * const min = new Date('2020-01-01');
     * const max = new Date('2020-12-31');
     * const date = await Random.date(min, max);
     */
    static async date(field, min, max) {
        return new Date(await Random.int(min, max));
    }
}

crs.intent.test_data = TestData;
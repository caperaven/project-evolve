import "./packages/crs-schema/crs-schema.js";
import "./packages/crs-binding/crs-binding.js";
import "./packages/crs-binding/events/event-emitter.js";
import "./packages/crs-binding/classes/view-base.js";
import "./packages/crs-binding/classes/bindable-element.js";
import "./packages/crs-binding/classes/observable.js";
import "./packages/crs-binding/expressions/code-factories/if.js";
import "./packages/crs-binding/expressions/code-factories/case.js";
import "./packages/crs-binding/managers/inflation-manager.js";
import "./packages/crs-binding/classes/perspective-element.js";
import "./packages/crs-binding/managers/static-inflation-manager.js";
import "./packages/crs-modules/crs-modules.js";
import "./packages/crs-router/crs-router.js";
import {initialize} from "./packages/crs-process-api/crs-process-api.js";
import "./src/index.js";
import {HTMLParser} from "./packages/crs-schema/html/crs-html-parser.js";
import "./packages/crs-process-api/action-systems/data-processing-actions.js";
import "./packages/crs-process-api/action-systems/schema-actions.js";

await initialize("/packages/crs-process-api");
await import("/packages/crs-process-api/components/view-loader/view-loader.js");


export class IndexViewModel {
    #bid;

    get bid() {
        return this.#bid;
    }

    constructor() {
        this.#bid = crs.binding.data.addObject(this.constructor.name);
        crs.binding.data.addContext(this.#bid, this);
        crs.binding.dom.enableEvents(this);
        crs.binding.parsers.parseElements(document.body.children, this);

        crs.call("schema", "register", {
            id: "html",
            parser: HTMLParser,
            providers: []
        })

        crs.call("translations", "add", {
            "context": "pageToolbar",
            "translations": {
                "rowsPerPage": "Rows per page"
            }
        })

        crs.call("translations", "add", {
            "context": "system",
            "translations": {
                "loadingMessage": "Loading..."
            }
        })
    }

    dispose() {
        this.#bid = null;
    }

    async debugStateChanged(event) {
        if (event.detail == "on") {
            return await crs.call("debug", "start_monitor_events", {});
        }

        return await crs.call("debug", "stop_monitor_events", {});
    }
}

globalThis.indexViewModel = new IndexViewModel();
import {SizeManager} from "./size-manager.js";
import {InflationManager} from "./inflation-manager.js";
import {ScrollDirection, ScrollManager} from "../scroll-manager/scroll-manager.js";

export class VirtualizationManager {
    #sizeManager;
    #element;
    #itemTemplate;
    #rowMap = {};
    #topIndex = 0;
    #bottomIndex = 0;
    #virtualSize = 0;
    #fitsOnScreen = true;
    #itemSize = 0;
    #inflationManager;
    #scrollManager;
    #syncPage = false;
    #scrollPos = 0;
    #recordCount = 0;
    #dataManager = null;
    #direction = "vertical";
    #dataManagerChangeHandler = this.#dataManagerChange.bind(this);
    #callbacks = null;

    get pageItemCount() {
        return this.#sizeManager.pageItemCount;
    }

    get scrollPos() {
        return this.#scrollPos;
    }

    get virtualSize() {
        return this.#virtualSize;
    }

    get rowMap() {
        return this.#rowMap;
    }

    get recordCount() {
        return this.#recordCount;
    }

    get topIndex() {
        return this.#topIndex;
    }

    get bottomIndex() {
        return this.#bottomIndex;
    }

    /**
     * @constructor
     * @param element {HTMLElement} - The element to enable virtualization on.
     * @param itemTemplate {HTMLTemplateElement} - The template to use for each item.
     * @param inflationFn {function} - The function to call when an item is inflated.
     * @param dataManager {string} - The data manager to use.
     * @param itemCount {number} - The number of items.
     * @param itemSize {number} - The size of each item.
     */
    constructor(element, itemTemplate, inflationFn, dataManager, itemSize, callbacks, direction = "vertical") {
        this.#dataManager = dataManager;
        this.#element = element;
        this.#itemTemplate = itemTemplate;
        this.#inflationManager = new InflationManager(dataManager, inflationFn);
        this.#itemSize = itemSize;
        this.#direction = direction;
        this.#callbacks = callbacks || {};
    }

    /**
     * @method dispose - clean up memory.
     */
    async dispose() {
        await crs.call("data_manager", "remove_change", {
            manager: this.#dataManager,
            callback: this.#dataManagerChangeHandler
        })

        for (const key of Object.keys(this.#rowMap)) {
            this.#rowMap[key] = null;
        }

        this.#sizeManager = this.#sizeManager.dispose();
        this.#scrollManager = this.#scrollManager.dispose();
        this.#inflationManager = this.#inflationManager.dispose();

        this.#rowMap = null;
        this.#element = null;
        this.#itemTemplate = null;
        this.#topIndex = null;
        this.#bottomIndex = null;
        this.#virtualSize = null;
        this.#sizeManager = null;
        this.#inflationManager = null;
        this.#scrollManager = null;
        this.#syncPage = null;
        this.#scrollPos = null;
        this.#recordCount = null;
        this.#dataManager = null;
        this.#itemSize = null;
        this.#callbacks = null;
        return null;
    }

    /**
     * @private
     * @method #createMarker - Creates the marker element that will be used to determine the scroll position.
     */
    #createMarker() {
        const marker = document.createElement("div");
        marker.id = "marker";
        marker.style.height = `1px`;
        marker.style.width = "1px";
        marker.style.position = "absolute";
        marker.style.top = "0";
        marker.style.left = "0";
        marker.style.translate = this.#direction == "vertical" ? `${0}px ${this.#sizeManager.contentSize}px` : `${this.#sizeManager.contentSize}px ${0}px`;
        this.#element.appendChild(marker);
    }

    #createExactItems(count) {
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < count; i++) {
            const top = i * this.#sizeManager.itemSize;
            const element = this.#createElement();

            this.#inflationManager.inflate(element, i);
            this.#setTop(element, top);

            fragment.appendChild(element);
        }

        this.#topIndex = 0;
        this.#bottomIndex = count - 1;
        this.#element.append(fragment);
        this.#initializeRowMap(0);
        this.#fitsOnScreen = true;
        this.#virtualSize = 0;
    }

    #createElement() {
        const clone = this.#itemTemplate.content.cloneNode(true);
        const element = clone.firstElementChild;
        element.style.position = "absolute";
        element.style.top = "0";
        element.style.left = "0";
        element.style.willChange = "translate";

        if (this.#callbacks.createdCallback != null) {
            this.#callbacks.createdCallback(element);
        }

        return element;
    }

    /**
     * @private
     * @method #createItems - Creates the items that will be used for the virtualization.
     */
    #createItems(count) {
        const fragment = document.createDocumentFragment();

        if (count < this.pageItemCount) {
            return this.#createExactItems(count)
        }

        // we have to set this here again because if we had exact items the value was set to 0.
        // with a new batch of data we need to reset this.
        // this only applies to scenarios where you had a exact number and a batch that is greater.
        this.#virtualSize = Math.floor(this.pageItemCount / 2);
        let childCount = this.pageItemCount + (this.#virtualSize * 2);

        // half of virtualize elements at the top and half at the bottom.
        for (let i = -this.#virtualSize; i < childCount - this.#virtualSize; i++) {
            const top = i * this.#sizeManager.itemSize;
            const element = this.#createElement();

            if (i >= 0) {
                this.#inflationManager.inflate(element, i);
            }

            this.#setTop(element, top);
            fragment.appendChild(element);
        }

        this.#element.appendChild(fragment);
        this.#initializeRowMap(-this.#virtualSize);

        this.#topIndex = -this.#virtualSize;
        this.#bottomIndex = childCount - 1 - this.#virtualSize;
        this.#fitsOnScreen = false;
    }

    /**
     * @private
     * @method #initializeRowMap - Creates a map of the elements that are currently visible.
     * This is used internally to keep the order of items on screen without having to change the DOM.
     */
    #initializeRowMap(start) {
        this.#rowMap = {};

        for (let i = 0; i < this.#element.children.length; i++) {
            const index = start + i;
            this.#rowMap[index] = this.#element.children[i];
        }
    }

    #getLastRowMapKey() {
        const keys = Object.keys(this.#rowMap);
        return Number(keys[keys.length - 1]);
    }

    /**
     * @private
     * @method setTop - Sets the top position of an element by changing the transform.
     * It also does some rudimentary checks to make sure the element is not out of bounds.
     * @param element {HTMLElement} - The element to set the top position on.
     * @param top {number} - The top position to set.
     */
    #setTop(element, top) {
        if (top >= this.#sizeManager.contentSize) {
            top = -this.#sizeManager.itemSize * 2;
        }

        element.style.transform = this.#direction == "vertical" ? `translate(0, ${top}px)` : `translate(${top}px, 0)`;
    }

    /**
     * @private
     * @method #onScrollDown - This is called when the scroll event fires to perform scroll operations up or down.
     * We first check the quantity of items scrolled. If it is greater than the virtual size cache we don't do anything.
     * The user in that scenario is jumping pages and once the scroll ends we will sync the page.
     * @param event {Event} - The scroll event.
     * @param scrollPos {number} - The current scroll top position.
     * @param scrollOffset {number} - How big was the jump between the previous scroll and this one.
     * @param direction {string} - The direction of the scroll. Either "up" or "down".
     * @returns {Promise<void>}
     */
    async #onScroll(event, scrollPos, scrollOffset, direction) {
        const itemsScrolled = Math.floor(scrollOffset / this.#sizeManager.itemSize);
        const topIndex = Math.floor(scrollPos / this.#sizeManager.itemSize);

        if (itemsScrolled <= this.#virtualSize) {
            this.#syncPage = false;

            if (direction === ScrollDirection.TO_END) {
                await this.#onScrollDown(topIndex, itemsScrolled);
            } else {
                await this.#onScrollUp(topIndex, itemsScrolled);
            }
        }
        else {
            // if you scroll fast you can jump hundreds of records.
            // in that case the normal virtualization does not work.
            // instead you need to reset from the top down again
            //await this.#onSyncPage(topIndex);
            this.#syncPage = true;
        }

        if (this.#callbacks.onScrollStart != null) {
            await this.#callbacks.onScrollStart();
        }
    }

    /**
     * @private
     * @method #onScrollDown - This is called when the scroll event fires to perform scroll operations down.
     * @param scrollIndex {number} - The current scroll top index.
     * @returns {Promise<void>}
     */
    async #onScrollDown(scrollIndex) {
        const count = scrollIndex - this.#topIndex;
        const toMove = count - this.#virtualSize;

        const startIndex = this.#topIndex;
        const endIndex = startIndex + toMove;

        for (let i = startIndex; i < endIndex; i++) {
            const element = this.#rowMap[i];
            const newIndex = this.#bottomIndex + 1;

            await this.#scrollPropertiesUpdate(element, newIndex, i, 1);
        }
    }

    /**
     * @private
     * @method #onScrollUp - This is called when the scroll event fires to perform scroll operations up.
     * @param scrollIndex {number} - The current scroll top index.
     * @returns {Promise<void>}
     */
    async #onScrollUp(scrollIndex) {
        const count = scrollIndex - this.#topIndex;
        const toMove = Math.abs(count - this.#virtualSize);

        const startIndex = this.#bottomIndex;
        const endIndex = startIndex - toMove;

        for (let i = startIndex; i > endIndex; i--) {
            const element = this.#rowMap[i];
            const newIndex = this.#topIndex - 1;

            if (newIndex < 0) {
                return;
            }

            await this.#scrollPropertiesUpdate(element, newIndex, i, -1);
        }
    }

    /**
     * @private
     * @method #scrollPropertiesUpdate - Updates the properties after it has been scrolled.
     * This would include:
     * - #rowMap swapping of the element from old to new position
     * - updating the dom by moving the element and inflating it
     * - updating the top and bottom index
     * @param element {HTMLElement} - The element to update.
     * @param newIndex {number} - The new index of the element.
     * @param dataIndex {number} - The old index of the element.
     * @param indexOffset {number} - +1 or -1 depending on the direction of the scroll to update the top and bottom index.
     * @returns {Promise<void>}
     */
    async #scrollPropertiesUpdate(element, newIndex, dataIndex, indexOffset) {
        this.#rowMap[newIndex] = element;
        delete this.#rowMap[dataIndex];

        if (newIndex <= this.#sizeManager.itemCount) {
            this.#setTop(element, newIndex * this.#sizeManager.itemSize);
            await this.#inflationManager.inflate(element, newIndex);
        }

        this.#bottomIndex += indexOffset;
        this.#topIndex += indexOffset;
    }

    /**
     * @private
     * @method #onEndScroll - This is called when the scroll event ends.
     * This checks if we have jumped pages and if it did jump pages it will sync the page.
     * @param event {Event} - The scroll event.
     * @param scrollPos {number} - The current scroll top position.
     * @returns {Promise<void>}
     */
    async #onEndScroll(event, scrollPos) {
        if (this.#syncPage) {
            await this.#performSyncPage(scrollPos);
        }

        this.#scrollPos = scrollPos;

        if (this.#callbacks.onScrollEnd != null) {
            await this.#callbacks.onScrollEnd();
        }
    }

    /**
     * @private
     * @method #performSyncPage - This is called when the scroll event ends and, we have jumped pages.
     * The elements are moved so that you have a top buffer, bottom buffer and elements on page again.
     * This is an expensive operation because it affects all the elements.
     * Because it is so expensive, we don't do this on scroll but only on scroll end.
     * @param scrollPos {number} - The current scroll top position.
     * @returns {Promise<void>}
     */
    async #performSyncPage(scrollPos) {
        const topIndex = Math.floor(scrollPos / this.#sizeManager.itemSize) - this.#virtualSize;
        let count = 0;

        const newMap = {};
        for (let i = this.#topIndex; i <= this.#bottomIndex; i++) {
            const element = this.#rowMap[i];
            const newIndex = topIndex + count;
            newMap[newIndex] = element;
            count++;

            if (newIndex <= this.#sizeManager.itemCount) {
                const newTop = newIndex * this.#sizeManager.itemSize;
                this.#setTop(element, newTop);
                await this.#inflationManager.inflate(element, newIndex);
            }
        }

        this.#rowMap = newMap;
        this.#topIndex = topIndex;
        this.#bottomIndex = topIndex + count - 1;

        if (this.#callbacks.onPerformSync != null) {
            await this.#callbacks.onPerformSync();
        }
    }

    async #dataManagerChange(change) {
        if (this[change.action] != null) {
            this[change.action](change);
        }
    }

    async #updateMarker() {
        const marker = this.#element.querySelector("#marker");
        marker.style.translate = this.#direction == "vertical" ? `${0}px ${this.#sizeManager.contentSize}px` : `${this.#sizeManager.contentSize}px ${0}px`;
    }

    async #clear() {
        this.#recordCount = 0;
        this.#element.innerHTML = "";
        this.#sizeManager.setItemCount(0);
    }

    async refreshCurrent() {
        await this.#performSyncPage(this.#scrollPos);
    }

    async refresh() {
        await this.#clear();

        const count = await crs.call("data_manager", "record_count", { manager: this.#dataManager })
        this.#sizeManager.setItemCount(count);

        await this.#createItems(count);

        if (this.#fitsOnScreen == false) {
            await this.#createMarker();
            await this.#updateMarker();
            await this.refreshCurrent();
        }
        else {
            await this.#scrollManager.scrollToTop();

            if (this.#callbacks.onPerformSync != null) {
                await this.#callbacks.onPerformSync();
            }
        }
    }

    async update(change) {
        await this.refreshCurrent();
    }

    async add(change) {
        await this.refresh();
    }

    async delete() {
        await this.refresh();
    }

    /**
     * @method initialize - create resources required for the virtualization to work.
     * That includes the element that will be used for the virtualization.
     */
    async initialize() {
        await crs.call("component", "wait_for_element_render", { element: this.#element })

        const containerSize = this.#direction == "vertical" ? this.#element.offsetHeight : this.#element.offsetWidth;

        this.#sizeManager = new SizeManager(this.#itemSize, 0, containerSize);
        this.#virtualSize = Math.floor(this.pageItemCount / 2);

        this.#scrollManager = new ScrollManager(
            this.#element,
            null,
            this.#onScroll.bind(this),
            this.#onEndScroll.bind(this),
            this.#sizeManager.itemSize,
            this.#direction
        );

        await crs.call("data_manager", "on_change", {
            manager: this.#dataManager,
            callback: this.#dataManagerChangeHandler
        })

        this.#element.style.position = "relative";
        this.#element.style.overflowY = "auto";
        this.#element.style.willChange = "transform";

        // this.#createItems(); we need to create this on refresh instead
        this.#createMarker();
    }
}

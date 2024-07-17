/**
 * @enum ScrollDirection - what direction is the scroll going.
 * @type {Readonly<{DOWN: string, UP: string, NONE: string}>}
 */
export const ScrollDirection = Object.freeze({
    TO_START: "to_start",
    TO_END: "to_end",
    NONE: "none"
});

/**
 * @class ScrollManager - This class deals with the scroll event on a given element.
 * - It checks for the start of a scroll,
 * - Are you busy with a scroll,
 * - Did you stop scrolling.
 *
 * It executes functions that you passed on as callbacks for those events that you are interested.
 * If those functions are not set then it will only call those that are set.
 *
 * Callback parameters include the
 * - event - the scroll event.
 * - scrollTop - what is the current scroll top.
 * - scrollOffset - what is the size difference between the last scroll event and the current. This also indicates speed.
 * - direction - direction of the scroll, up or down.
 */
export class ScrollManager {
    #element;
    #onStartScroll;
    #onScroll;
    #onEndScroll;
    #scrollHandler = this.#scroll.bind(this);
    #scrollTimerHandler = this.#scrollTimer.bind(this);
    #lastScrollPos = 0;
    #scrollPos = 0;
    #scrollOffset = 0;
    #lastStopScrollPos = 0;
    #timeout = 0;
    #scrolling = false;
    #direction;
    #triggerSize;
    #event;
    #scrollProperty;

    /**
     * @constructor
     * @param element {HTMLElement} - The element to listen for scroll events on.
     * @param onStartScroll {function} - The function to call when the scroll starts.
     * @param onScroll {function} - The function to call when the scroll is in progress.
     * @param onEndScroll {function} - The function to call when the scroll ends.
     * @param triggerSize {number} - The number of pixels that need to pass before action is taken.
     */
    constructor(element, onStartScroll, onScroll, onEndScroll, triggerSize, layoutDirection) {
        this.#element = element;
        this.#onStartScroll = onStartScroll;
        this.#onScroll = onScroll;
        this.#onEndScroll = onEndScroll;
        this.#triggerSize = triggerSize || 1;
        this.#scrollHandler = this.#scroll.bind(this);
        this.#element.addEventListener("scroll", this.#scrollHandler);
        this.#scrollProperty = layoutDirection === "vertical" ? "scrollTop" : "scrollLeft";
    }

    /**
     * @method dispose - clean up memory
     */
    dispose() {
        this.#element.removeEventListener("scroll", this.#scrollHandler);
        this.#element = null;
        this.#scrollHandler = null;
        this.#scrollTimerHandler = null;
        this.#onStartScroll = null;
        this.#onScroll = null;
        this.#onEndScroll = null;
        this.#scrolling = null;
        this.#direction = null;
        this.#triggerSize = null;
        this.#scrollPos = null;
        this.#scrollOffset = null;
        this.#event = null;
        this.#lastScrollPos = null;
        this.#lastStopScrollPos = null;
        this.#timeout = null;
        return null;
    }

    /**
     * @method #scroll - The scroll event handler.
     * We try and do the minimum amount of work here.
     * It's primary function is to update the required values for the scrollTimer to use.
     * It also starts the scroll timer when we start the scroll operation
     * @param event
     * @returns {Promise<void>}
     */
    async #scroll(event) {
        this.#event = event;
        this.#scrollPos = this.#element[this.#scrollProperty];
        this.#scrollOffset = Math.abs(Math.ceil(this.#lastScrollPos - this.#scrollPos));
        this.#direction = this.#lastScrollPos < this.#scrollPos ? ScrollDirection.TO_END : ScrollDirection.TO_START;

        if (this.#scrolling !== true) {
            this.#scrolling = true;

            if (this.#onStartScroll) {
                this.#onStartScroll(event, this.#scrollPos, this.#scrollOffset, ScrollDirection.NONE);
            }

            this.#scrollTimerHandler();
        }
    }

    /**
     * @method #scrollTimer - This is the main loop during scrolling operations.
     * It is responsible to check if the scroll has stopped.
     * If it has then it will call the onEndScroll callback.
     * If it has not then it will call the onScroll callback.
     * This is a recursive function that will call itself until the scroll has stopped.
     * @returns {Promise<void>}
     */
    async #scrollTimer() {
        requestAnimationFrame(async () => {
            if (this.#lastScrollPos === this.#scrollPos) {
                if (this.#onEndScroll) {
                    await this.#onEndScroll(this.#event, this.#scrollPos, this.#scrollOffset, this.#direction);
                }
                this.#scrolling = false;

                // This stops the timer, preventing the this.#scrollTimerHandler() from being called.
                return;
            }

            if (this.#onScroll) {
                await this.#onScroll(this.#event, this.#scrollPos, this.#scrollOffset, this.#direction);
            }

            this.#lastScrollPos = this.#scrollPos;

            // Call this timer recursively until the scroll has stopped.
            this.#scrollTimerHandler();
        })
    }

    async scrollToTop() {
        this.#element[this.#scrollProperty] = 0
        this.#lastScrollPos = 0;
        this.#scrollPos = 0;
        this.#scrollOffset = 0;
        this.#lastStopScrollPos = 0;
    }
}
/**
 * @class BrickFactory - this class is responsible for creating the different types of bricks for the game
 *
 * Featured Bricks:
 * - Standard Brick - standard brick that can be destroyed by the ball durability: 1
 * - Durable Brick - brick that can be destroyed by the ball durability: 2
 * - Trick Brick - Brick that changes at random to different type of brick thus its durability is randomised ?
 * - Special Brick - Brick that can be destroyed by the ball but also gives the player a special power durability: 1
 * - Steel Brick - Brick that cannot be destroyed by the ball durability: 3
 *
 * methods:
 * - createStandardBrick
 * - createDurableBrick
 * - createTrickBrick
 * - createSpecialBrick
 * - createSteelBrick
 */

class BrickFactory {
    /**
     * @method createStandardBrick - creates a standard brick
     * @param {number} x - x position of the brick
     * @param {number} y - y position of the brick
     * @param {number} width - width of the brick
     * @param {number} height - height of the brick
     * @param {string||hex} color - color of the brick
     * @param {number} points - points of the brick
     * @param {number} durability - durability of the brick
     * @param {string} id - id of the brick
     * @returns {object} - returns a standard brick
     */
   static async createStandardBrick(x, y, width, height, color, points, durability, id) {

    }

    /**
     * @method createDurableBrick - creates a durable brick
     * @param {number} x - x position of the brick
     * @param {number} y - y position of the brick
     * @param {number} width - width of the brick
     * @param {number} height - height of the brick
     * @param {number} color - color of the brick
     * @param {number} points - points of the brick
     * @param {number} durability - durability of the brick
     * @param {number} id - id of the brick
     * @returns {Brick} - returns a durable brick
     */
    static async createDurableBrick(x, y, width, height, color, points, durability, id) {

    }

    /**
     * @method createTrickBrick - creates a trick brick
     * @param {number} x - x position of the brick
     * @param {number} y - y position of the brick
     * @param {number} width - width of the brick
     * @param {number} height - height of the brick
     * @param {number} color - color of the brick
     * @param {number} points - points of the brick
     * @param {number} id - id of the brick
     * @returns {Brick} - returns a trick brick
     */
    static async createTrickBrick(x, y, width, height, color, points, id) {

    }

    /**
     * @method createSpecialBrick - creates a special brick
     * @param {number} x - x position of the brick
     * @param {number} y - y position of the brick
     * @param {number} width - width of the brick
     * @param {number} height - height of the brick
     * @param {number} color - color of the brick
     * @param {number} points - points of the brick
     * @param {number} durability - durability of the brick
     * @param {number} id - id of the brick
     * @returns {Brick} - returns a special brick
     */
    static async createSpecialBrick(x, y, width, height, color, points, durability, id) {

    }

    /**
     * @method createSteelBrick - creates a steel brick
     * @param {number} x - x position of the brick
     * @param {number} y - y position of the brick
     * @param {number} width - width of the brick
     * @param {number} height - height of the brick
     * @param {number} color - color of the brick
     * @param {number} points - points of the brick
     * @param {number} durability - durability of the brick
     * @param {number} id - id of the brick
     * @returns {Brick} - returns a steel brick
     */
    static async createSteelBrick(x, y, width, height, color, points, durability, id) {

    }
}
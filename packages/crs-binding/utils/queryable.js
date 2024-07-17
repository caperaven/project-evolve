class Queryable {
  #elements = [];
  add(element) {
    if (element == null)
      return;
    this.#elements.push(element);
  }
  remove(element) {
    if (element == null)
      return;
    const index = this.#elements.indexOf(element);
    if (index > -1) {
      this.#elements.splice(index, 1);
    }
  }
  query(selector) {
    if (selector == null)
      return [];
    return this.#elements.filter((element) => element.matches(selector));
  }
}
export {
  Queryable
};

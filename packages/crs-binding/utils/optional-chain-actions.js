class OptionalChainActions {
  static indexOf(exp) {
    const newExp = exp.split("?.").join("~");
    return newExp.indexOf("?");
  }
  static hasTernary(exp) {
    const newExp = exp.split("?.").join("~");
    return newExp.indexOf("?") > -1;
  }
  static split(exp) {
    const newExp = exp.split("?.").join("~");
    const result = newExp.split("?");
    result[0] = result[0].split("~").join("?.").trim();
    result[1] = result[1].split("~").join("?.").trim();
    if (result.length > 1) {
      result[1] = result[1].trim();
    }
    return result;
  }
}
export {
  OptionalChainActions
};

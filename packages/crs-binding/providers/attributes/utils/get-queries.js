function getQueries(string, result) {
  if (string.indexOf("[") != -1) {
    const lastBracket = string.lastIndexOf("]");
    const subStr = string.substring(1, lastBracket);
    result.queries = subStr.split(",");
    if (result.value != null) {
      result.value = string.replace(`[${subStr}].`, "");
    }
  }
}
export {
  getQueries
};

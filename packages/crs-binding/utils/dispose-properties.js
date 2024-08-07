const ignoreDispose = ["_element"];
function disposeProperties(obj) {
  if (obj == null || obj.autoDispose == false)
    return;
  if (typeof obj != "object")
    return;
  if (Object.isFrozen(obj))
    return;
  if (Array.isArray(obj)) {
    return disposeArray(obj);
  }
  if (obj instanceof Set || obj instanceof Map) {
    return disposeMapSet(obj);
  }
  const properties = Object.getOwnPropertyNames(obj).filter((name) => ignoreDispose.indexOf(name) == -1);
  for (let property of properties) {
    let pObj = obj[property];
    if (pObj == null)
      continue;
    if (typeof pObj == "object") {
      if (pObj.autoDispose == false)
        continue;
      if (Array.isArray(pObj)) {
        disposeArray(pObj);
      } else if (pObj instanceof Set || pObj instanceof Map) {
        disposeMapSet(pObj);
      } else {
        if (pObj.dispose != null) {
          pObj.dispose();
        }
        disposeProperties(pObj);
      }
    }
    try {
      pObj = null;
      delete obj[property];
    } catch {
    }
  }
}
function disposeArray(array) {
  if (array.length === 0)
    return;
  for (const item of array) {
    disposeProperties(item);
  }
  array = null;
}
function disposeMapSet(obj) {
  obj.forEach((item) => disposeProperties(item));
  obj.clear();
  obj = null;
}
export {
  disposeProperties
};

import { tokenize } from "./exp-tokenizer.js";
const sanitizeKeywords = ["false", "true", "null"];
async function sanitize(exp, ctxName = "context", addContext = true) {
  let isHTML = false;
  if (typeof exp == "string" && exp.indexOf("$html") != -1) {
    isHTML = true;
    exp = exp.split("$html.").join("");
  }
  if (exp == null || exp == "null" || exp == "undefined" || sanitizeKeywords.indexOf(exp.toString()) != -1 || isNaN(exp) == false || exp.trim() == ctxName) {
    return {
      isLiteral: true,
      expression: exp,
      isHTML
    };
  }
  const namedExp = ctxName != "context";
  if (namedExp == true && exp == ["${", ctxName, "}"].join("")) {
    return {
      isLiteral: true,
      expression: exp
    };
  }
  const properties = /* @__PURE__ */ new Set();
  const isLiteral = exp.indexOf("${") != -1 || exp.indexOf("&{") != -1;
  const tokens = tokenize(exp, isLiteral);
  const expression = [];
  for (let token of tokens) {
    if (token.type === "property") {
      token.value = token.value.split(".").join("?.");
      if (token.value.indexOf("$globals") != -1) {
        expression.push(token.value.replace("$globals", "crs.binding.data.globals"));
      } else if (token.value.indexOf("$event") != -1) {
        expression.push(token.value.replace("$event", "event"));
      } else if (token.value.indexOf("$context") != -1) {
        expression.push(token.value.replace("$context", "context"));
      } else if (token.value.indexOf("$data") != -1) {
        expression.push(token.value.replace("$data", "crs.binding.data.getValue"));
      } else if (token.value.indexOf("$parent") != -1) {
        expression.push(token.value.replace("$parent", "parent"));
      } else if (ctxName !== "context" && token.value.indexOf(`${ctxName}.`) != -1) {
        expression.push(token.value);
      } else if (token.value === "new") {
        expression.push(token.value);
      } else {
        const contextToken = `${ctxName}?.`;
        if (token.value.startsWith(contextToken) && addContext === false) {
          expression.push(token.value);
        } else {
          expression.push(`${ctxName}.${token.value}`);
        }
      }
      addProperty(properties, token.value, ctxName);
    } else if (token.type === "function") {
      token.value = token.value.replace(".", "?.");
      expression.push(token.value);
    } else {
      expression.push(token.value);
    }
  }
  let expr = expression.join("").replaceAll("context.[", "[").replaceAll("context.]", "]");
  if (expr.indexOf("[") !== -1) {
    expr = expr.replace(/(\w+)(\s*)(\?|\:)?(\s*)\[/g, (match, p1, p2, p3) => {
      if (p3 === "?" || p3 === ":") {
        return match;
      } else {
        return p1 + "?.[";
      }
    });
  }
  expr = await crs.binding.expression.translateFactory(expr);
  return {
    isLiteral,
    isHTML,
    expression: expr,
    properties: Array.from(properties)
  };
}
const fnNames = [".trim", ".toLowerCase", "toUpperCase"];
const ignoreProperties = ["$data", "$event", "[", "]"];
function addProperty(set, property, ctxName) {
  if (property.length == 0)
    return;
  property = property.split("?.").join(".");
  for (let ignore of ignoreProperties) {
    if (property.indexOf(ignore) != -1)
      return;
  }
  let propertyValue = property;
  const ctxPrefix = ctxName === "context" ? "$context." : `${ctxName}.`;
  if (propertyValue.indexOf(ctxPrefix) == 0) {
    propertyValue = propertyValue.replace(ctxPrefix, "");
  }
  for (let fnName of fnNames) {
    if (propertyValue.indexOf(fnName) != -1) {
      propertyValue = propertyValue.split(fnName).join("");
    }
  }
  set.add(propertyValue);
}
export {
  sanitize
};

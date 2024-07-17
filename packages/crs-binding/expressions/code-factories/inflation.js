import { OptionalChainActions } from "../../utils/optional-chain-actions.js";
import "../../managers/static-inflation-manager.js";
import { capitalizePropertyPath } from "../../utils/capitalization.js";
async function inflationFactory(element, ctxName = "context", addContext = true) {
  const code = [];
  const preCode = [];
  const bid = element.__bid;
  if (element.nodeName === "TEMPLATE") {
    element = element.content.cloneNode(true).firstElementChild;
  }
  if (element.nodeName != "#document-fragment") {
    await attributes("element", element, preCode, code, ctxName, addContext);
  }
  if (element.children.length === 0) {
    await textContent("element", element, code, ctxName, addContext);
  } else {
    await children("element", element, preCode, code, ctxName, addContext, bid);
  }
  return new globalThis.crs.classes.AsyncFunction("element", ctxName, [...preCode, ...code].join("\n"));
}
async function textContent(path, element, code, ctxName, addContext) {
  const text = element.textContent.trim();
  if (text.indexOf("${") == -1 && text.indexOf("&{") == -1)
    return;
  const exp = await crs.binding.expression.sanitize(text, ctxName, addContext);
  code.push([path, ".textContent = `", exp.expression, "`;"].join(""));
}
async function children(path, element, preCode, code, ctxName, addContext, bid) {
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    if (child.nodeName === "TEMPLATE" && child.hasAttribute("for")) {
      const forValue = child.getAttribute("for");
      const forParts = forValue.split("of");
      const paramName = forParts[0].trim();
      code.push(`
                const sub_template = ${path}.children[${i}];
                sub_template.innerHTML = sub_template.innerHTML.split("${paramName}.").join("");
            `);
      code.push(`
            for (const b_item of ${forParts[1]}) {     
                const instance = sub_template.content.cloneNode(true).firstElementChild;
                crs.binding.staticInflationManager.inflateElement(instance, b_item).then(() => {
                    ${path}.appendChild(instance);
                });                                     
            }`);
    } else if (child.children.length > 0) {
      await children(`${path}.children[${i}]`, child, preCode, code, ctxName, addContext, bid);
    } else {
      const text = child.textContent.trim();
      if (text.indexOf("${") != -1 || text.indexOf("&{") != -1) {
        const exp = await crs.binding.expression.sanitize(text, ctxName, addContext);
        code.push([path, ".children", `[${i}].textContent = `, "`", exp.expression, "`;"].join(""));
      }
    }
    await attributes(`${path}.children[${i}]`, element.children[i], preCode, code, ctxName, addContext);
  }
}
async function attributes(path, element, preCode, code, ctxName, addContext) {
  if (element == null || element instanceof DocumentFragment)
    return;
  for (const attr of element.attributes) {
    if (attr.nodeValue.indexOf("${") != -1) {
      preCode.push(`${path}.removeAttribute("${attr.nodeName}");`);
      const exp = await crs.binding.expression.sanitize(attr.nodeValue.trim(), ctxName, addContext);
      code.push([`${path}.setAttribute("${attr.nodeName}",`, "`", exp.expression, "`", ");"].join(""));
    } else if (attr.nodeName.indexOf("style.") != -1) {
      await styles(attr, path, preCode, code, ctxName, addContext);
    } else if (attr.nodeName.indexOf("classlist.case") != -1) {
      await classListCase(attr, path, preCode, code, ctxName, addContext);
    } else if (attr.nodeName.indexOf("classlist.if") != -1) {
      await classListIf(attr, path, preCode, code, ctxName, addContext);
    } else if (attr.nodeName.indexOf(".if") != -1) {
      await ifAttribute(attr, path, preCode, code, ctxName, addContext);
    } else if (attr.nodeName.indexOf(".attr") != -1) {
      await attrAttribute(attr, path, preCode, code, ctxName, addContext);
    } else if (attr.nodeName.indexOf(".one-way") != -1 || attr.nodeName.indexOf(".once") != -1) {
      await onceAttribute(attr, path, preCode, code, ctxName, addContext);
    }
  }
}
async function classListCase(attr, path, preCode, code, ctxName, addContext) {
  preCode.push(`${path}.removeAttribute("${attr.nodeName}");`);
  const exp = await crs.binding.expression.sanitize(attr.nodeValue.trim(), ctxName, addContext);
  const codeParts = exp.expression.split(",");
  const classes = [];
  for (const line of codeParts) {
    const lineParts = OptionalChainActions.split(line);
    const condition = lineParts[0].trim();
    const values = (lineParts[1] || lineParts[0]).split(":");
    classes.push(...values);
    code.push(`if (${condition}) {`);
    code.push(`    ${path}.classList.add(${values[0].trim()});`);
    code.push(`}`);
    if (values.length > 1) {
      code.push(`else {`);
      code.push(`    ${path}.classList.add(${values[0].trim()});`);
      code.push(`}`);
    }
  }
  preCode.push(`${path}.classList.remove(${classes.join(",")});`);
}
async function classListIf(attr, path, preCode, code, ctxName, addContext) {
  preCode.push(`${path}.removeAttribute("${attr.nodeName}");`);
  const value = attr.nodeValue.trim().replaceAll("?.", "*.");
  const ifParts = OptionalChainActions.split(value);
  let expression = ifParts[0].trim();
  const elseParts = ifParts[1].split(":");
  const ifClasses = elseParts[0].trim().replace("[", "").replace("]", "");
  const elseClasses = elseParts[1]?.trim();
  code.push(`${path}.classList.remove(${ifClasses});`);
  if (elseClasses != null) {
    code.push(`${path}.classList.remove(${elseClasses});`);
  }
  expression = expression.replace("*.", "?.");
  const exp = await crs.binding.expression.sanitize(expression, ctxName, addContext);
  code.push(`if (${exp.expression}) {`);
  code.push(`    ${path}.classList.add(${ifClasses});`);
  code.push(`}`);
  if (elseClasses != null) {
    code.push(`else {`);
    code.push(`    ${path}.classList.add(${elseClasses});`);
    code.push(`}`);
  }
}
async function ifAttribute(attr, path, preCode, code, ctxName, addContext) {
  preCode.push(`${path}.removeAttribute("${attr.nodeName}");`);
  const exp = await crs.binding.expression.sanitize(attr.nodeValue.trim(), ctxName, addContext);
  const attrName = attr.nodeName.replace(".if", "");
  if (!OptionalChainActions.hasTernary(exp.expression)) {
    code.push(`if (${exp.expression} === true) {
            ${path}.setAttribute("${attrName}", "${attrName}");
        }
        else {
            ${path}.removeAttribute("${attrName}");
        }
        `);
    return;
  }
  const conditionParts = OptionalChainActions.split(exp.expression);
  const condition = conditionParts[0].trim();
  const valueParts = conditionParts[1].split(":");
  let trueValue = valueParts[0].trim();
  let falseValue = valueParts.length === 1 ? null : valueParts[1].trim();
  if (trueValue.startsWith("${")) {
    trueValue = `\`${trueValue}\` `;
  }
  if (falseValue != null && falseValue.startsWith("${")) {
    falseValue = `\`${falseValue}\` `;
  }
  code.push(`if (${condition}) {
        ${path}.setAttribute("${attrName}", ${trueValue});
    }`);
  if (falseValue != null) {
    code.push(`else {
            ${path}.setAttribute("${attrName}", ${falseValue});
        }`);
  }
}
async function attrAttribute(attr, path, preCode, code, ctxName, addContext) {
  preCode.push(`${path}.removeAttribute("${attr.nodeName}");`);
  const exp = await crs.binding.expression.sanitize(attr.nodeValue.trim(), ctxName, addContext);
  code.push([`${path}.setAttribute("${attr.nodeName.replace(".attr", "")}",`, exp.expression, ");"].join(""));
}
async function onceAttribute(attr, path, preCode, code, ctxName, addContext) {
  preCode.push(`${path}.removeAttribute("${attr.nodeName}");`);
  const exp = await crs.binding.expression.sanitize(attr.nodeValue.trim(), ctxName, addContext);
  let value = attr.nodeName.replace(".once", "");
  value = value.replace(".one-way", "");
  code.push([`${path}.${value}`, " = ", exp.expression, ";"].join(""));
}
async function styles(attr, path, preCode, code, ctxName, addContext) {
  preCode.push(`${path}.removeAttribute("${attr.nodeName}");`);
  const parts = attr.nodeName.split(".");
  const exp = await crs.binding.expression.sanitize(attr.nodeValue.trim(), ctxName, addContext);
  const stylePropertyName = capitalizePropertyPath(parts[1]);
  preCode.push(`${path}.style.${stylePropertyName} = "";`);
  if (attr.nodeName.indexOf(".case") == -1) {
    code.push([`${path}.style.${stylePropertyName} =`, exp.expression, ";"].join(""));
  } else {
    const codeParts = exp.expression.split(",");
    for (const line of codeParts) {
      if (line.indexOf("context.default") != -1) {
        preCode.push(`${path}.style.${stylePropertyName} = ${line.split(":")[1].trim()};`);
        continue;
      }
      const lineParts = OptionalChainActions.split(line);
      const condition = lineParts[0].trim();
      const values = (lineParts[1] || lineParts[0]).split(":");
      code.push(`if (${condition}) {`);
      code.push(`    ${path}.style.${stylePropertyName} = ${values[0].trim()};`);
      code.push(`}`);
      if (values.length > 1) {
        code.push(`else {`);
        code.push(`    ${path}.style.${stylePropertyName} = ${values[1].trim()};`);
        code.push(`}`);
      }
    }
  }
}
crs.binding.expression.inflationFactory = inflationFactory;
export {
  inflationFactory
};

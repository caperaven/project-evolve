class y{static async perform(e,a,t,l){await this[e.action]?.(e,a,t,l)}static async show_widget_dialog(e,a,t,l){return new Promise(s=>{const n=m(e);document.documentElement.appendChild(n.layer),requestAnimationFrame(async()=>{await g(n.widget.id,e.args.html,e.args.url,a,t,l),s()})})}static async show_form_dialog(e,a,t,l){return new Promise(s=>{const n=m(e);document.documentElement.appendChild(n.layer),requestAnimationFrame(async()=>{await g(n.widget.id,e.args.html,e.args.url,a,t,l);let o=crs.binding.data.getContext(t.parameters.bId);const c=async d=>{if(d==="pass_step"){let i=await f(`#${n.layer.id} form`);if(i.length>0){t.parameters?.bId!==null&&(e.args.errors=i,await crs.call("binding","set_errors",e.args,a,t,l));return}}delete o.pass,delete o.fail,await this.remove_element({args:{element:`#${n.layer.id}`}});const u=e[d];if(u!=null){const i=crs.binding.utils.getValueOnPath(t.steps,u);i!=null&&await crs.process.runStep(i,a,t,l)}e.args.callback!=null&&e.args.callback(),s()};o.pass=()=>c("pass_step"),o.fail=()=>c("fail_step")})})}}async function f(r){const a=document.querySelector(r)?.querySelectorAll("label"),t=[];for(let l of a){const n=l.querySelector("input").validationMessage;n.length>0&&t.push(`${l.children[0].textContent}: ${n}`)}return t}function m(r){const e=document.createElement("div");e.style.zIndex="99999999",e.style.position="fixed",e.style.left="0",e.style.top="0",e.style.width="100%",e.style.height="100%",e.id=r.args.id||"widget_layer";const a=document.createElement("div");a.classList.add("modal-background");const t=document.createElement("crs-widget");return t.style.position="fixed",t.style.left="50%",t.style.top="50%",t.style.transform="translate(-50%, -50%)",t.id=`${e.id}_widget`,e.appendChild(a),e.appendChild(t),{layer:e,widget:t}}async function g(r,e,a,t,l,s){await crs.call("dom_binding","set_widget",{element:`#${r}`,html:e,url:a},t,l,s);const n=document.querySelector(`#${r} [autofocus]`);n!=null?n.focus():document.querySelector(`#${r}`).focus()}crs.intent.dom_widget=y;export{y as DomWidgetsActions};

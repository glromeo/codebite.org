import {dashCase} from "calvin/utility";

export function CustomElement(what, options) {
    if (typeof what === "string") {
        return function (target) {
            window.customElements.define(what, target, options);
        }
    } else if (what instanceof Function) {
        window.customElements.define(dashCase(what.name).substring(1), what, options);
    } else {
        throw new Error("invalid decorator invocation");
    }
}

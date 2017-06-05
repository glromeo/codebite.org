import {dashCase} from "calvin/utility";

export function CustomElement(what, options) {
    if (typeof what === "string") {
        return function (target) {
            window.customElements.define(what, target, options);
            redefineToStringTag(target);
        }
    } else if (what instanceof Function) {
        window.customElements.define(dashCase(what.name).substring(1), what, options);
        redefineToStringTag(what);
    } else {
        throw new Error("invalid decorator invocation");
    }
}

function redefineToStringTag(target) {
    if (target.prototype[Symbol.toStringTag] !== target.name) {
        Object.defineProperty(target.prototype, Symbol.toStringTag, {value: target.name});
        redefineToStringTag(target.__proto__);
    }
}
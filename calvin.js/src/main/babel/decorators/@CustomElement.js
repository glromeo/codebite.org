import {dashCase} from "calvin/utility";

export function CustomElement(what, options) {
    if (typeof what === "string") {
        return function (target) {
            window.customElements.define(what, target, options);
        }
    } else {
        window.customElements.define(dashCase(what.name).substring(1), what, options);
    }
}


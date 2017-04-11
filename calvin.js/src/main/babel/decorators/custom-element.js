import {dashCase} from "./utility";

export function CustomElement(name) {
    if (typeof name === "string") {
        return function (target) {
            window.customElements.define(name, target);
        }
    } else {
        window.customElements.define(dashCase(name.name).substring(1), name);
    }
}


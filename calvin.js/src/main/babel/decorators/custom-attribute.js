import {dashCase} from "./utility";

export function CustomAttribute(name) {
    if (typeof name === "string") {
        return function (target) {
            window.customAttributes.define(name, target);
        }
    } else {
        window.customAttributes.define(dashCase(name.name).substring(1), name);
    }
}


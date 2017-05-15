import customAttributes from 'custom-attributes/custom-attributes';
import {dashCase} from "calvin/utility";

export function CustomAttribute(what, options) {
    if (typeof what === "string") {
        return function (target) {
            customAttributes.define(what, target, options);
        }
    } else {
        customAttributes.define(dashCase(what.name).substring(1), what, options);
    }
}


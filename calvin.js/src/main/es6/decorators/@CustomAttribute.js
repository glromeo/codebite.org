import customAttributes from 'custom-attributes/custom-attributes';
import {dashCase} from "calvin/utility";

export default function (what, options) {
    if (typeof what === "string") {
        return function (target) {
            customAttributes.define(what, target, options);
        }
    } else if (what instanceof Function) {
        customAttributes.define(dashCase(what.name).substring(1), what);
    } else {
        throw new Error("invalid decorator invocation");
    }
}


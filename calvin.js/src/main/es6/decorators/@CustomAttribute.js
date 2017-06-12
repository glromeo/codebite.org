import customAttributes from 'custom-attributes/polyfill';
import {dashCase} from "calvin/utility";

export default function CustomAttribute(definition) {
    if (typeof definition === "string") {
        const name = definition;
        return function (definition) {
            console.log("defining custom attribute:", name, definition.name);
            customAttributes.define(name, definition);
        }
    } else if (definition instanceof Function) {
        const name = dashCase(definition.name).substring(1);
        console.log("defining custom attribute:", name, definition.name);
        customAttributes.define(name, definition);
    } else {
        throw new Error("invalid decorator invocation");
    }
}


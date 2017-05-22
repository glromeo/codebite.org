import {CUSTOM_ATTRIBUTES} from "../symbols";
import {log, patchPrototypeMethod} from "./utility";

export default function patchNode(registry) {

    const definitions = registry.definitions;

    patchPrototypeMethod(Node, 'cloneNode', nativeCloneNode => function (deep) {
        const clone = nativeCloneNode.call(this, deep);
        if (this[CUSTOM_ATTRIBUTES]) {
            log.call(this, "cloneNode", deep);
            copyCustomAttributes.call(this, clone);
        }
        return clone;
    });

    function copyCustomAttributes(clone) {

    }
}

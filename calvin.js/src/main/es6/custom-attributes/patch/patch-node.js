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

    patchPrototypeMethod(Node, 'insertBefore', nativeInsertBefore => function (node, refNode) {
        const nativeResult = nativeInsertBefore.call(this, node, refNode);
        if (this.isConnected) {
            log.call(this, "insertBefore", node, refNode);
            // registry.connectTree(node);
        }
        return nativeResult;
    });
}

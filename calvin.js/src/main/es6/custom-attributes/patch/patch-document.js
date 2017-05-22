import {CUSTOM_ATTRIBUTES} from "../symbols";
import {log, patchPrototypeMethod} from "./utility";

export default function patchDocument(registry) {

    const definitions = registry.definitions;

    patchPrototypeMethod(Node, 'importNode', nativeImportNode => function (node, deep) {

        log.call(this, "importNode", node, deep);

        const clone = nativeImportNode.call(this, node, deep);

        // Only create custom elements if this document is associated with the registry.
        if (!this.__CA_hasRegistry) {
            internals.patchTree(clone);
        } else {
            internals.patchAndUpgradeTree(clone);
        }
        return clone;
    });

    function copyCustomAttributes(clone) {

    }
}

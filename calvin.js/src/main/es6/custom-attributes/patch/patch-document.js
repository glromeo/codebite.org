import {log, patchPrototypeMethod} from "./utility";

export default function patchDocument(registry) {

    const definitions = registry.definitions;

    patchPrototypeMethod(Node, 'importNode', nativeImportNode => function (node, deep) {

        log.call(this, "importNode", node, deep);

        const clone = nativeImportNode.call(this, node, deep);

        if (clone.firstChild) {
            internals.patchTree(clone);
        } else {
            internals.patchAndUpgradeTree(clone);
        }
        return clone;
    });
}

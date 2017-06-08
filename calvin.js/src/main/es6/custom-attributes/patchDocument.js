import {log, patchPrototypeMethod} from "./utility";
import patchParentNode from "./patchParentNode";

export default function patchDocument(registry) {

    patchPrototypeMethod(Document, 'importNode', nativeImportNode => function (node, deep) {
        const clone = nativeImportNode.call(this, node, deep);
        registry.upgradeTree(clone);
        return clone;
    });

    patchParentNode(registry, Document);
}

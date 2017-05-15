import PatchParentNode from "./Interface/ParentNode.js";
import Native from "./Native.js";

export default function (internals) {

    Document.prototype['importNode'] = function (node, deep) {

        console.log("importNode", node);

        const clone = Native.Document.importNode.call(this, node, deep);

        // Only create custom elements if this document is associated with the registry.
        if (!this.__CA_hasRegistry) {
            internals.patchTree(clone);
        } else {
            internals.patchAndUpgradeTree(clone);
        }
        return clone;
    };

    PatchParentNode(internals, Document.prototype, {
        prepend: Native.Document.prepend,
        append: Native.Document.append,
    });
};

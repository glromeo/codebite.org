import Native from "./Native.js";
import * as ca from "../Utilities.js";
import {CUSTOM_ATTRIBUTES} from "custom-attributes/custom-attributes";

export default function (internals) {

    // `Node#nodeValue` is implemented on `Attr`.
    // `Node#textContent` is implemented on `Attr`, `Element`.

    Node.prototype['insertBefore'] = function (node, refNode) {

        ca.log.call(this, "insertBefore", node, refNode);

        if (node instanceof DocumentFragment) {
            const insertedNodes = Array.prototype.slice.apply(node.childNodes);
            const nativeResult = Native.Node.insertBefore.call(this, node, refNode);
            // DocumentFragments can't be connected, so `disconnectTree` will never
            // need to be called on a DocumentFragment's children after inserting it.
            if (ca.isConnected(this)) {
                for (let i = 0; i < insertedNodes.length; i++) {
                    internals.connectTree(insertedNodes[i]);
                }
            }
            return nativeResult;
        }
        const nodeWasConnected = ca.isConnected(node);
        const nativeResult = Native.Node.insertBefore.call(this, node, refNode);
        if (nodeWasConnected) {
            internals.disconnectTree(node);
        }
        if (ca.isConnected(this)) {
            internals.connectTree(node);
        }
        return nativeResult;
    };

    Node.prototype['appendChild'] = function (node) {

        ca.log.call(this, "appendChild", node);

        // if (node instanceof DocumentFragment) {
        //     const insertedNodes = Array.prototype.slice.apply(node.childNodes);
        //     const nativeResult = Native.Node.appendChild.call(this, node);
        //     // DocumentFragments can't be connected, so `disconnectTree` will never
        //     // need to be called on a DocumentFragment's children after inserting it.
        //     if (ca.isConnected(this)) {
        //         for (let i = 0; i < insertedNodes.length; i++) {
        //             internals.connectTree(insertedNodes[i]);
        //         }
        //     }
        //     return nativeResult;
        // }
        //
        // const nodeWasConnected = ca.isConnected(node);

        let customAttributes = node[CUSTOM_ATTRIBUTES];
        if (customAttributes) {
            let target = this;
            for (let [name, customAttribute] of customAttributes) {
                let template = customAttribute.template;
                if (template) {
                    Native.Node.appendChild.call(target, template);
                    target = template.content;
                }
            }
            return Native.Node.appendChild.call(target, node);
        }
        return Native.Node.appendChild.call(this, node);
    };

    Node.prototype['cloneNode'] = function (deep) {

        ca.log.call(this, "cloneNode", deep);

        const clone = Native.Node.cloneNode.call(this, deep);
        // Only create custom elements if this element's owner document is
        // associated with the registry.
        if (!this.ownerDocument.__CA_hasRegistry) {
            internals.patchTree(clone);
        } else {
            internals.patchAndUpgradeTree(clone);
        }
        return clone;
    };

    Node.prototype['removeChild'] = function (node) {

        ca.log.call(this, "removeChild", node);

        const nodeWasConnected = ca.isConnected(node);
        const nativeResult = Native.Node.removeChild.call(this, node);
        if (nodeWasConnected) {
            internals.disconnectTree(node);
        }
        return nativeResult;
    };

    Node.prototype['replaceChild'] = function (nodeToInsert, nodeToRemove) {

        ca.log.call(this, "replaceChild", nodeToInsert, nodeToRemove);

        if (nodeToInsert instanceof DocumentFragment) {
            const insertedNodes = Array.prototype.slice.apply(nodeToInsert.childNodes);
            const nativeResult = Native.Node.replaceChild.call(this, nodeToInsert, nodeToRemove);
            // DocumentFragments can't be connected, so `disconnectTree` will never
            // need to be called on a DocumentFragment's children after inserting it.
            if (ca.isConnected(this)) {
                internals.disconnectTree(nodeToRemove);
                for (let i = 0; i < insertedNodes.length; i++) {
                    internals.connectTree(insertedNodes[i]);
                }
            }
            return nativeResult;
        }
        const nodeToInsertWasConnected = ca.isConnected(nodeToInsert);
        const nativeResult = Native.Node.replaceChild.call(this, nodeToInsert, nodeToRemove);
        const thisIsConnected = ca.isConnected(this);
        if (thisIsConnected) {
            internals.disconnectTree(nodeToRemove);
        }
        if (nodeToInsertWasConnected) {
            internals.disconnectTree(nodeToInsert);
        }
        if (thisIsConnected) {
            internals.connectTree(nodeToInsert);
        }
        return nativeResult;
    };

    Object.defineProperty(Node.prototype, 'textContent', {
        enumerable: Native.Node.textContent.enumerable,
        configurable: true,
        get: Native.Node.textContent.get,
        set: function (assignedValue) {

            ca.log.call(this, "set textContent", assignedValue);

            // If this is a text node then there are no nodes to disconnect.
            if (this.nodeType === Node.TEXT_NODE) {
                Native.Node.textContent.set.call(this, assignedValue);
            }
            let removedNodes = undefined;
            // Checking for `firstChild` is faster than reading `childNodes.length`
            // to compare with 0.
            if (this.firstChild) {
                // Using `childNodes` is faster than `children`, even though we only
                // care about elements.
                const childNodes = this.childNodes;
                const childNodesLength = childNodes.length;
                if (childNodesLength > 0 && ca.isConnected(this)) {
                    // Copying an array by iterating is faster than using slice.
                    removedNodes = new Array(childNodesLength);
                    for (let i = 0; i < childNodesLength; i++) {
                        removedNodes[i] = childNodes[i];
                    }
                }
            }
            Native.Node.textContent.set.call(this, assignedValue);
            if (removedNodes) {
                for (let i = 0; i < removedNodes.length; i++) {
                    internals.disconnectTree(removedNodes[i]);
                }
            }
        },
    });
};

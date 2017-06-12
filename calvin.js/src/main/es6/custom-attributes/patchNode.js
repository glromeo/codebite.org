import {log, patchPrototypeMethod} from "./utility";
import {CUSTOM_ATTRIBUTES} from "./symbols";

const arraySlice = Array.prototype.slice;

export default function patchNode(registry) {

    patchPrototypeMethod(Node, 'insertBefore', nativeInsertBefore => function (node, refNode) {
        log.call(this, "insertBefore", node, refNode);
        if (node.isConnected) {
            registry.disconnectTree(node);
        }
        const insertedNodes = node instanceof DocumentFragment && arraySlice.apply(node.childNodes);
        const nativeResult = nativeInsertBefore.call(this, node, refNode);
        if (this.isConnected) {
            if (insertedNodes) {
                for (let i = 0; i < insertedNodes.length; i++) registry.connectTree(insertedNodes[i]);
            } else {
                registry.connectTree(node);
            }
        }
        return nativeResult;

    });

    patchPrototypeMethod(Node, 'appendChild', nativeAppendChild => function (node) {
        log.call(this, "appendChild", node);
        if (node.isConnected) {
            registry.disconnectTree(node);
        }
        const insertedNodes = node instanceof DocumentFragment && arraySlice.apply(node.childNodes);
        const nativeResult = nativeAppendChild.call(this, node);
        if (this.isConnected) {
            if (insertedNodes) {
                for (let i = 0; i < insertedNodes.length; i++) registry.connectTree(insertedNodes[i]);
            } else {
                registry.connectTree(node);
            }
        }
        return nativeResult;
    });

    patchPrototypeMethod(Node, 'cloneNode', nativeCloneNode => function (deep) {

        log.call(this, "cloneNode", deep);

        if (deep) {
            const clone = nativeCloneNode.call(this, deep);

            const sourceTreeWalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT);
            const targetTreeWalker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);

            let sourceNode = sourceTreeWalker.currentNode,
                targetNode = targetTreeWalker.currentNode;

            while (targetNode) {
                const customAttributes = sourceNode[CUSTOM_ATTRIBUTES];
                if (customAttributes) Object.defineProperty(targetNode, CUSTOM_ATTRIBUTES, {
                    value: customAttributes
                });
                sourceNode = sourceTreeWalker.nextNode();
                targetNode = targetTreeWalker.nextNode();
            }
            return clone;
        } else {
            const clone = nativeCloneNode.call(this);
            const customAttributes = clone[CUSTOM_ATTRIBUTES];
            if (customAttributes) {
                Object.defineProperty(targetNode, CUSTOM_ATTRIBUTES, {
                    value: customAttributes
                });
            }
            return clone;
        }
    });

    patchPrototypeMethod(Node, 'removeChild', nativeRemoveChild => function (node) {
        log.call(this, "removeChild", node);
        if (node.isConnected) {
            registry.disconnectTree(node)
        }
        return nativeRemoveChild.call(this, node);
    });

    patchPrototypeMethod(Node, 'replaceChild', nativeReplaceChild => function (nodeToInsert, nodeToRemove) {
        log.call(this, "replaceChild", nodeToInsert, nodeToRemove);
        if (nodeToRemove.isConnected) {
            registry.disconnectTree(nodeToRemove)
        }
        const insertedNodes = nodeToInsert instanceof DocumentFragment && arraySlice.apply(nodeToInsert.childNodes);
        const nativeResult = nativeReplaceChild.call(this, nodeToInsert, nodeToRemove);
        if (this.isConnected) {
            if (insertedNodes) {
                for (let i = 0; i < insertedNodes.length; i++) registry.connectTree(insertedNodes[i]);
            } else {
                registry.connectTree(node);
            }
        }
        return nativeResult;
    });
}

import {log, patchPrototypeMethod} from "./utility";
import {CUSTOM_ATTRIBUTE} from "./symbols";

export default function patchNode(registry) {

    patchPrototypeMethod(Node, 'cloneNode', nativeCloneNode => function (deep) {

        log.call(this, "cloneNode", deep);

        const clone = nativeCloneNode.call(this, deep);

        const sourceTreeWalker = document.createTreeWalker(this, NodeFilter.SHOW_PROCESSING_INSTRUCTION);
        const targetTreeWalker = document.createTreeWalker(clone, NodeFilter.SHOW_PROCESSING_INSTRUCTION);

        let sourceNode = sourceTreeWalker.currentNode,
            targetNode = targetTreeWalker.currentNode;

        while (targetNode) {
            const customAttribute = sourceNode[CUSTOM_ATTRIBUTE];
            if (customAttribute) {
                Object.defineProperty(targetNode, CUSTOM_ATTRIBUTE, {
                    value: customAttribute
                });
                targetNode[CUSTOM_ATTRIBUTE].targetNode = targetNode;
            }
            sourceNode = sourceTreeWalker.nextNode();
            targetNode = targetTreeWalker.nextNode();
        }
        return clone;
    });

    patchPrototypeMethod(Node, 'insertBefore', nativeInsertBefore => function (node, refNode) {
        log.call(this, "insertBefore", node, refNode);
        const nativeResult = nativeInsertBefore.call(this, node, refNode);
        if (this.isConnected) {
            registry.connectTree(node);
        }
        return nativeResult;
    });
}

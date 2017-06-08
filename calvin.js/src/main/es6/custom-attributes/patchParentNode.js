import {patchPrototypeMethod} from "./utility";

/**
 *
 * @param registry
 * @param target
 */
export default function patchParentNode(registry, target) {

    patchPrototypeMethod(target, "prepend", nativePrepend => function (...nodes) {

        ca.log.call(this, "prepend", ...nodes);

        const connected = nodes.filter(node => node.isConnected);

        nativePrepend.apply(this, nodes);

        for (let i = 0; i < connected.length; i++) {
            registry.disconnectTree(connected[i]);
        }

        if (this.isConnected) for (let node, i = 0; undefined !== (node = nodes[i]); i++) {
            if (node[CUSTOM_ATTRIBUTE]) {
                node[CUSTOM_ATTRIBUTE].connectedCallback(this);
            } else if (node instanceof Element) {
                internals.connectTree(node);
            }
        }
    });

    patchPrototypeMethod(target, "append", nativePrepend => function (...nodes) {

        ca.log.call(this, "append", ...nodes);

        // TODO: Fix this for when one of `nodes` is a DocumentFragment!
        const connectedBefore = (nodes.filter(node => {
            // DocumentFragments are not connected and will not be added to the list.
            return node instanceof Node && ca.isConnected(node);
        }));

        builtIn.append.apply(this, nodes);

        for (let i = 0; i < connectedBefore.length; i++) {
            internals.disconnectTree(connectedBefore[i]);
        }

        if (ca.isConnected(this)) {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node instanceof Element) {
                    internals.connectTree(node);
                }
            }
        }
    });
}
import * as ca from "../../Utilities.js";

export default function (internals, destination, builtIn) {

    destination['prepend'] = function (...nodes) {

        ca.log.call(this, "prepend", ...nodes);

        // TODO: Fix this for when one of `nodes` is a DocumentFragment!
        const connectedBefore = (nodes.filter(node => {
            // DocumentFragments are not connected and will not be added to the list.
            return node instanceof Node && ca.isConnected(node);
        }));

        builtIn.prepend.apply(this, nodes);

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
    };

    destination['append'] = function (...nodes) {

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
    };
};

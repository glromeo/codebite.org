import * as ca from "../../Utilities.js";

export default function (internals, destination, builtIn) {

    destination['before'] = function (...nodes) {

        ca.log.call(this, "before", ...nodes);

        // TODO: Fix this for when one of `nodes` is a DocumentFragment!
        const connectedBefore = (nodes.filter(node => {
            // DocumentFragments are not connected and will not be added to the list.
            return node instanceof Node && ca.isConnected(node);
        }));

        builtIn.before.apply(this, nodes);

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

    destination['after'] = function (...nodes) {

        ca.log.call(this, "after", ...nodes);

        // TODO: Fix this for when one of `nodes` is a DocumentFragment!
        const connectedBefore = (nodes.filter(node => {
            // DocumentFragments are not connected and will not be added to the list.
            return node instanceof Node && ca.isConnected(node);
        }));

        builtIn.after.apply(this, nodes);

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

    destination['replaceWith'] = function (...nodes) {

        ca.log.call(this, "replaceWith", ...nodes);

        // TODO: Fix this for when one of `nodes` is a DocumentFragment!
        const connectedBefore = (nodes.filter(node => {
            // DocumentFragments are not connected and will not be added to the list.
            return node instanceof Node && ca.isConnected(node);
        }));

        const wasConnected = ca.isConnected(this);

        builtIn.replaceWith.apply(this, nodes);

        for (let i = 0; i < connectedBefore.length; i++) {
            internals.disconnectTree(connectedBefore[i]);
        }

        if (wasConnected) {
            internals.disconnectTree(this);
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node instanceof Element) {
                    internals.connectTree(node);
                }
            }
        }
    };

    destination['remove'] = function () {

        ca.log.call(this, "remove");

        const wasConnected = ca.isConnected(this);

        builtIn.remove.call(this);

        if (wasConnected) {
            internals.disconnectTree(this);
        }
    };
};

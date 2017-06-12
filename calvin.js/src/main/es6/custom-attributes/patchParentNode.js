import {log, patchPrototypeMethod} from "./utility";

const debug = false;

export default function patchParentNode(registry, target) {

    let patcher = nativeMethod => function (...nodes) {

        if (debug) log.call(this, nativeMethod.name, ...nodes);

        const connected = nodes.filter(node => node.isConnected);

        nativeMethod.apply(this, nodes);

        for (let i = 0; i < connected.length; i++) {
            registry.disconnectTree(connected[i]);
        }

        if (this.isConnected) {
            let node, i = 0;
            while (node = nodes[i++]) if (node instanceof Element) registry.connectTree(node);
        }
    };

    patchPrototypeMethod(target, "prepend", patcher);
    patchPrototypeMethod(target, "append", patcher);
}
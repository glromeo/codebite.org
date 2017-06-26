// import "calvin/custom-attributes";
import "calvin/custom-elements";

import {Scope} from "./scope";

const debug = true;

export function bootstrap(rootElement) {

    rootElement.$scope = new Scope({});

    const cleanUpObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            let nodesToCleanUp = [];
            for (const removed of mutation.removedNodes) if (removed.nodeType === Node.ELEMENT_NODE) {
                const treeWalker = document.createTreeWalker(removed, NodeFilter.SHOW_ELEMENT);
                do {
                    const node = treeWalker.currentNode;
                    if (node.cleanUpCallback) {
                        nodesToCleanUp.push(node);
                    }
                } while (treeWalker.nextNode());
            }
            setTimeout(() => {
                nodesToCleanUp.forEach(node => node.cleanUpCallback());
            });
        });
    });

    cleanUpObserver.observe(document.querySelector('body'), {childList: true, subtree: true});

    document.dispatchEvent(new CustomEvent("paper-plane:ready"));

    if (debug) console.log("bootstrap completed");
}

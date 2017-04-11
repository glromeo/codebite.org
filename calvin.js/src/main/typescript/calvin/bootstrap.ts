import {Compile, Linkable} from "calvin/compile";

export interface RootNode {
    $observer: MutationObserver;
}

export interface Context {
}

export function bootstrap(rootElement:Element = document.body):void {

    const rootScope = {
        "message": "Hello World!",
        "console": console
    };

    function registerMutationObserver(root: Node&Linkable&RootNode):MutationObserver {
        let $observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                console.log("mutation", mutation);
            });
        });
        $observer.observe(root, {attributes: true, childList: true, characterData: false, subtree: true});
        console.debug("registered mutation observer");
        return $observer;
    }

    Compile(rootElement).then(function (root: Node & Linkable & RootNode) {

        root.$link(rootScope);
        console.debug("root element", root);

        root.$observer = registerMutationObserver(root);

        // document.querySelector("#stop").addEventListener("click", function () {
        //     observer.disconnect();
        // });
    })
}

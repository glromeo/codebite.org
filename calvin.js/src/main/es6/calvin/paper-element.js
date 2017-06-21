import {appendCallback, closest} from "./utility";
import {Linker} from "./linker";

const debug = true;

export class PaperElement extends HTMLElement {

    constructor() {
        super();
        debug && console.debug("created new PaperElement:", this.tagName);

        for (let key of Object.keys(this.constructor)) {
            const decorator = this.constructor[key];
            if (decorator instanceof Function) {
                decorator.apply(this, arguments);
            }
        }
    }

    connectedCallback() {
        debug && console.debug("connected:", this.tagName);

        return new Linker(this.findProperty("$scope")).link(this).then($scope => {

            debug && console.debug("linked:", this.tagName);

            if (this.childrenReadyCallback) {
                let barrier = 0;
                let parent = this;

                function descendantReadyCallback() {
                    console.log("child ready:", this);
                    if (!--barrier) {
                        parent.childrenReadyCallback();
                    }
                }

                const treeWalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT);
                let element = treeWalker.nextNode();
                while (element) if (element.render) {
                    barrier++;
                    debug && console.debug("waiting for node:", element);
                    appendCallback(element, "readyCallback", descendantReadyCallback);
                    element = treeWalker.nextSibling();
                } else {
                    element = treeWalker.nextNode();
                }
            }

            if (this.render) {
                let promise = this.render($scope);
                if (promise) {
                    return promise.then(() => this.readyCallback());
                }
            }
            this.readyCallback();
        });
    }

    readyCallback() {
        debug && console.debug("ready:", this.tagName);
    }

    disconnectedCallback() {
        debug && console.debug("disconnected:", this.tagName);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        debug && console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}

Object.defineProperty(PaperElement.prototype, Symbol.toStringTag, {value: PaperElement.name});

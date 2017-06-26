import {compile} from "./compiler";
import {ScopeHandler} from "./observe-notify";

const debug = false;

export class PaperElement extends window.HTMLElement {

    constructor() {
        super();

        if (this.firstChild) {
            this.normalize();
            this.compile();
        }

        debug && console.debug("created new PaperElement:", this.tagName);
    }

    compile() {
        debug && console.debug("compile:", this.tagName);
        this.innerLink = compile(this);
    }

    innerLink($scope) {
        this.normalize();
        this.compile();
        return this.innerLink($scope);
    }

    assignScope() {
        this.$scope = this.findProperty("$scope");
    }

    link($scope) {
        this.ready = this.innerLink($scope);
    }

    connectedCallback() {

        debug && console.debug("connected:", this.tagName);

        this.assignScope();

        this.link(this.$scope);

        this.ready.then(() => {

            debug && console.debug("linked:", this.tagName);

            if (this.render) {
                let promise = this.render(this.$scope);
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
        delete this.$scope;
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        debug && console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}

Object.defineProperty(PaperElement.prototype, Symbol.toStringTag, {value: PaperElement.name});

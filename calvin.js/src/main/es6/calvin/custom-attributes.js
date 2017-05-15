import {CustomAttribute} from "decorators/@CustomAttribute";

const debug = true;

class PaperAttribute {

    constructor() {
        if (debug) console.debug("created new PaperAttr:", this.constructor.name);
    }

    connectedCallback() {
        if (debug) console.debug("connected:", this.constructor.name, this.ownerElement.tagName);
    }

    disconnectedCallback() {
        if (debug) console.debug("disconnected:", this.constructor.name, this.ownerElement.tagName);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (debug) console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomAttribute
class ForEach extends PaperAttribute {

    constructor() {
        super();
    }
}
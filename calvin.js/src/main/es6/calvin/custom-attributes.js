import CustomAttribute from "decorators/@CustomAttribute";
import Template from "decorators/@Template";

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

    changedCallback(attrName, oldVal, newVal) {
        if (debug) console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomAttribute
@Template(function(ownerElement) { return ownerElement; })
class ForEach extends PaperAttribute {

    constructor() {
        super();
    }

    connectedCallback() {
        for (let i=0; i<10; i++) {
            const template = this.template;
            const clone = document.importNode(template.content, true);
            template.parentNode.insertBefore(clone, template.nextSibling);
        }
    }
}

@CustomAttribute
@Template(`<transclude></transclude>`)
class IfTrue {
};


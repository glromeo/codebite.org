import {CustomElement} from "decorators:custom-element";

@CustomElement
class PaperReport extends HTMLElement {
    constructor() {
        super();
        console.log("created new PaperReport", this);
    }

    connectedCallback() {
        let report = this;
        let barrier = this.children.length;
        console.log(this.constructor.name, "connected", "#childrens", barrier);
        this.addEventListener("child-connected", function childAttachedListener(event) {
            let detail = event.detail;
            console.log(detail.title, "connected");
            if (!--barrier) {
                report.childrenCallback();
            }
        })
    }

    childrenCallback() {
        console.log("all children are now connected");
    }

    disconnectedCallback() {
        console.log(this.constructor.name, "disconnected");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        console.log(this.constructor.name, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomElement
class ReportPage extends HTMLElement {
    constructor() {
        super();
        console.log("created new ReportPage", this);
    }

    connectedCallback() {
        console.log(this.constructor.name, "connected");
        this.dispatchEvent(new CustomEvent("child-connected", {"bubbles": true, "detail": {title: this.title}}));
    }

    disconnectedCallback() {
        console.log(this.constructor.name, "disconnected");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        console.log(this.constructor.name, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomElement
class PageHeader extends HTMLElement {
    constructor() {
        super();
        console.log("created new PageHeader", this);
    }

    connectedCallback() {
        console.log(this.constructor.name, "connected");
    }

    disconnectedCallback() {
        console.log(this.constructor.name, "disconnected");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        console.log(this.constructor.name, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomElement
class PageBody extends HTMLElement {
    constructor() {
        super();
        console.log("created new PageBody", this);
    }

    connectedCallback() {
        console.log(this.constructor.name, "connected");
    }

    disconnectedCallback() {
        console.log(this.constructor.name, "disconnected");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        console.log(this.constructor.name, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomElement
class PageFooter extends HTMLElement {
    constructor() {
        super();
        console.log("created new PageFooter", this);
    }

    connectedCallback() {
        console.log(this.constructor.name, "connected");
    }

    disconnectedCallback() {
        console.log(this.constructor.name, "disconnected");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        console.log(this.constructor.name, "attribute changed", attrName, oldVal, newVal);
    }
}

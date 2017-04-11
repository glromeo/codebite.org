import {CustomAttribute} from "decorators:custom-attribute";

@CustomAttribute
class ForEach {

    constructor() {
        console.log("created custom attribute", this);
    }

    connectedCallback() {
        console.log("connectedCallback", this, this.ownerElement);
    }

    disconnectedCallback() {
        console.log("disconnectedCallback", this, this.ownerElement);
    }

    changedCallback() {
        console.log("changedCallback", this, arguments);
    }

}

import CustomAttribute from "decorators/@CustomAttribute";
import Transclude from "decorators/@Transclude";
import {closest} from "./utility";
import {createScope} from "./scope";

const debug = true;

class PaperAttribute {

    /**
     * This is where the attribute value should compiled
     */
    constructor(attr) {
        if (debug) console.debug("created new PaperAttr:", this.constructor.name);
        this.name = attr.name.substring(1);
        this.value = attr.value;
    }

    linkCallback() {

        if (debug) console.debug("linked:", this.constructor.name, this.targetNode.tagName);

        if (this.value) {
            let $scope = closest("$scope", this);
            let promise = this.render($scope);
            if (promise) {
                promise.then(() => this.readyCallback());
            } else if (this.readyCallback) {
                this.readyCallback();
            }
        } else if (this.readyCallback) {
            this.readyCallback();
        }
    }

    unlinkCallback() {
        if (debug) console.debug("disconnected:", this.constructor.name, this.targetNode.tagName);
    }

    changeCallback(attrName, oldVal, newVal) {
        if (debug) console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}


@CustomAttribute
@Transclude
class ForEach extends PaperAttribute {

    constructor(attr) {
        super();

        let match = attr.value.match(/^\s*(.+)\s+in\s+(.*?)\s*$/);
        this.item = match[1];
        this.expression = match[2];
    }

    render($scope) {

        let marker, fragment = document.createDocumentFragment();

        let create = (items) => {

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.renderItem($scope, [item, index]));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.renderItem($scope, [items[key], key]));
                });
            }
            fragment.appendChild(marker = document.createComment(' for-each: end '));

            const target = this.targetNode;
            target.parentNode.insertBefore(fragment, target.nextSibling);

            this.cleanUpCallback = () => {
                console.log("clean up:", this);
            }
        };

        let update = (items) => {

            let parentNode = marker.parentNode;

            while (this.targetNode !== marker.previousSibling) {
                parentNode.removeChild(marker.previousSibling);
            }

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.renderItem($scope, [item, index]));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.renderItem($scope, [items[key], key]));
                });
            }

            const target = this.targetNode;
            //parentNode.insertBefore(fragment, marker);
            target.parentNode.insertBefore(fragment, target.nextSibling);
        };

        return $scope.$watch(this.expression, function (items, {path, to, from}) {
            console.log("changed: (", JSON.stringify(to), "<-", JSON.stringify(from), ")");
            update(items);
        }).then(create).catch(reason => {
            console.error(reason);
        });
    }

    renderItem($scope, [item, index]) {
        const clone = this.sourceNode.cloneNode(true);
        createScope(clone, {
            [this.item]: item,
            "$index": index
        });
        return clone;
    }
}

@CustomAttribute
@Transclude
class IfTrue extends PaperAttribute {

    constructor() {
        super();
    }

    connectedCallback() {
        const target = this.targetNode;
        const clone = this.sourceNode.cloneNode(true);
        target.parentNode.insertBefore(clone, target.nextSibling);
    }
}
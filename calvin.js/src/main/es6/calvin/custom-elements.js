import {appendCallback, closest, visitTree} from "calvin/utility";
import {CustomElement} from "decorators/@CustomElement";
import jexl from "jexl";
import {createScope} from "./main";

const debug = false;

class PaperElement extends HTMLElement {

    constructor() {
        super();
        if (debug) console.debug("created new PaperItem:", this.tagName);
    }

    connectedCallback() {
        if (debug) console.debug("connected:", this.tagName);

        if (this.childrenReadyCallback) {
            let barrier = 0;
            let parent = this;

            function descendantReadyCallback() {
                console.log("child ready:", this);
                if (!--barrier) {
                    parent.childrenReadyCallback();
                }
            }

            visitTree(this, node => {
                if (node.render) {
                    barrier++;
                    if (debug) console.debug("waiting for node:", node);
                    appendCallback(node, "readyCallback", descendantReadyCallback);
                    return false;
                }
            });
        }

        if (this.linkCallback) {
            this.linkCallback();
        }

        if (this.render) {
            let promise = this.render();
            if (promise) {
                promise.then(() => this.readyCallback());
            } else if (this.readyCallback) {
                this.readyCallback();
            }
        } else if (this.readyCallback) {
            this.readyCallback();
        }
    }

    disconnectedCallback() {
        if (debug) console.debug("disconnected:", this.tagName);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (debug) console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomElement
class PaperReport extends PaperElement {
    constructor() {
        super();
    }

    connectedCallback() {

        super.connectedCallback();

        createScope(this, {
            report: {
                chapters: [
                    [{pag: 1}, {pag: 2}, {pag: 3}],
                    [{pag: 4}, {pag: 5}, {pag: 6}],
                    [{pag: 7}, {pag: 8}, {pag: 9}]
                ]
            }
        });
    }

    childrenReadyCallback() {
        console.log("all children are now ready");
    }
}

@CustomElement
class ReportPage extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
class PageHeader extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
class PageBody extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
class PageFooter extends PaperElement {
    constructor() {
        super();
    }
}

class VisitTrail {

    set(target, property, value) {
        return false;
    }

    get(target, property) {
        if (this.hasOwnProperty(property)) {
            if (debug) console.debug("visited:", property);
            return target[property];
        }
        let value = target[property];
        if (value && typeof value === "object") {
            if (debug) console.debug("visiting:", property);
            return new Proxy(value, this[property] = new VisitTrail());
        } else {
            if (debug) console.debug("value:", property, value);
            return value;
        }
    }

    prune(fn) {
        let keys = Object.keys(this);
        for (let key of keys) {
            let node = this[key];
            if (node && typeof node === "object") {
                if (!node.prune(fn)) this[key] = fn;
            } else {
                this[key] = undefined;
            }
        }
        return keys.length;
    }
}

@CustomElement
class ForEach extends PaperElement {

    constructor() {
        super();

        this.template = document.createDocumentFragment();
        for (let child = this.firstChild; child; child = this.firstChild) {
            this.template.appendChild(child);
        }

        this.item = this.getAttribute("item");
    }

    render() {

        let $scope = closest("$scope", this);

        let placeholder = createPlaceholder.call(this, ' begin of: ');
        let marker = createPlaceholder.call(this, ' end of: ');

        let fragment = document.createDocumentFragment();
        fragment.appendChild(placeholder);

        jexl.addBinaryOp('union', 0, function (left, right) {
            return left.concat(right);
        });

        let trail = new VisitTrail();
        let context = new Proxy($scope, trail);

        let expression = this.getAttribute("in");

        return jexl.eval(expression, context).then((items) => {
            trail.prune(function (path, {to, from}) {
                console.log("changed:", path, "(", to, "<-", from, ")");
            });
            console.log("trail:", trail);
            $scope.$watch(trail);
            return items;
        }).then((items) => {

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.renderItem($scope, [item, index]));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.renderItem($scope, [items[key], key]));
                });
            }
            fragment.appendChild(marker);
            this.parentNode.replaceChild(fragment, this);

            placeholder.cleanUpCallback = () => {
                console.log("clean up:", this);
            }
        }).catch(reason => {
            console.error(reason, context);
        });
    }

    renderItem($scope, [item, index]) {
        let clone = this.template.cloneNode(true);
        createScope(clone, {
            [this.item]: item,
            "$index": index
        });
        return clone;
    }
}

function createPlaceholder(prefix = ' ', suffix = ' ') {
    let outerHTML = this.outerHTML;
    let start = outerHTML.indexOf('<') + 1;
    let end = outerHTML.indexOf('>', start);
    return document.createComment(prefix + outerHTML.substring(start, end) + suffix);
}

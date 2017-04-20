import {CustomElement} from "decorators/@CustomElement";
import {Scope} from "decorators/@Scope";
import {connected} from "decorators/@connected";

import {Jexl} from "jexl/Jexl";
import {appendCallback, closest, visitTree} from "../decorators/utility";

class PaperElement extends HTMLElement {

    constructor() {
        super();
        console.debug("created new PaperItem:", this.tagName);
    }

    connectedCallback() {
        console.log("connected:", this.tagName);

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
                    console.debug("waiting for node:", node);
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
        console.log("disconnected:", this.tagName);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        console.log(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}

@CustomElement
class PaperReport extends PaperElement {
    constructor() {
        super();
    }

    connectedCallback() {

        super.connectedCallback();

        this.$scope = closest("$scope", this).$new({
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

let jexl = new Jexl();

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

class VisitingProxyHandler {

    constructor(visited, set) {
        this.visited = visited;
    }

    get(target, property) {
        console.log("visit:", property);
        let value = target[property];
        if (typeof value === 'object') {
            return new Proxy(value, new VisitingProxyHandler(this.visited[property] = this.visited[property] || {}));
        } else {
            return this.visited[property] = value;
        }
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

        let visited = {};

        jexl.addBinaryOp('union', 0, function (left, right) {
            return left.concat(right);
        });


        return jexl.eval(this.getAttribute("in"), new Proxy($scope, new VisitingProxyHandler(visited))).then((items) => {

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

            console.log("visited:", JSON.stringify(visited, undefined, 2));

            placeholder.cleanUpCallback = () => {
                console.log("clean up:", this);
            }
        });
    }

    renderItem($scope, [item, index]) {
        let clone = this.template.cloneNode(true);
        clone.$scope = Object.create($scope);
        clone.$scope[this.item] = item;
        clone.$scope["$index"] = index;
        return clone;
    }
}

function createPlaceholder(prefix = ' ', suffix = ' ') {
    let outerHTML = this.outerHTML;
    let start = outerHTML.indexOf('<') + 1;
    let end = outerHTML.indexOf('>', start);
    return document.createComment(prefix + outerHTML.substring(start, end) + suffix);
}

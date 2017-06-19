import {CustomElement} from "../decorators/@CustomElement";
import {createScope} from "./scope";
import {appendCallback, closest, visitTree} from "./utility";

const debug = true;

export class PaperElement extends HTMLElement {

    constructor() {
        super();
        if (debug) console.debug("created new PaperElement:", this.tagName);
    }

    connectedCallback() {
        if (debug) console.debug("connected:", this.tagName);

        return new Linker(closest("$scope", this)).link(this).then($scope => {

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
                    if (debug) console.debug("waiting for node:", element);
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

    }

    disconnectedCallback() {
        if (debug) console.debug("disconnected:", this.tagName);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (debug) console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
    }
}

export class Linker {

    constructor(scope) {
        this.scope = scope;
        this.ready = Promise.resolve();
    }

    link(root) {
        const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                return (node instanceof PaperElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        let node = treeWalker.currentNode;
        walk: while (node) {
            if (node instanceof HTMLTemplateElement) {
                const is = node.getAttribute("is");
                if (is) {
                    const template = node;
                    template.removeAttribute("is");
                    const customElement = document.createElement(is);
                    customElement.content = template.content;
                    for (const attr of template.attributes) {
                        customElement.setAttribute(attr.name, attr.value);
                    }
                    node = treeWalker.previousNode();
                    template.parentNode.replaceChild(customElement, template);
                    node = treeWalker.nextNode();
                    continue;
                }
            }
            this[node.nodeType](node);
            node = treeWalker.nextNode();
        }
        return this.ready.then(() => this.scope);
    }

    [Node.TEXT_NODE](node) {
        const text = node.nodeValue;
        const begin = text.indexOf('{{') + 2, end = text.indexOf('}}', begin + 2);
        if (begin >= 2 && end >= 0) {
            const expression = text.substring(begin, end);
            console.debug("linking text expression: {{", expression, "}}");
            const setNodeValue = function (value) {
                node.nodeValue = value;
            };
            this.ready = this.ready.then(() => this.scope.$watch(expression, setNodeValue).then(setNodeValue));
        }
    }

    [Node.ELEMENT_NODE](node) {
        for (const attr of node.attributes) if (attr.name[0] === '@') {
            const expression = attr.value;
            console.debug("linking attribute expression: {{", expression, "}}");
            const attrName = attr.name.substring(1);
            const setAttribute = function (value) {
                node.setAttribute(attrName, value);
            };
            this.ready = this.ready.then(() => this.scope.$watch(expression, setAttribute).then(setAttribute));
        }
    }
}

Object.defineProperty(PaperElement.prototype, Symbol.toStringTag, {value: PaperElement.name});

@CustomElement
export class PaperReport extends PaperElement {

    constructor() {
        super();
    }

    connectedCallback() {

        super.connectedCallback();

        const $scope = {
            report: {
                chapters: [
                    [{pag: 1}, {pag: 2}, {pag: 3}],
                    [{pag: 4}, {pag: 5}, {pag: 6}],
                    [{pag: 7}, {pag: 8}, {pag: 9}]
                ]
            }
        };

        for (let script of this.querySelectorAll('script')) {
            console.log("script:", script);
            new Function("window", "$", script.innerText).call($scope, window, $);
        }

        createScope(this, $scope);
    }

    readyCallback() {
        console.log("all children are now ready");
    }
}

@CustomElement
export class ReportPage extends PaperElement {
    constructor() {
        super();
    }

    connectedCallback() {
        if (this.hasOwnProperty('$scope')) {
            Object.assign(this.$scope, {page: {}});
        } else {
            createScope(this, {page: {}});
        }
        super.connectedCallback().then(() => {
            for (const attr of this.attributes) if (attr.name[0] !== '@') {
                this.$scope.page[attr.name] = attr.value;
            }
        });
    }
}

@CustomElement
export class PageHeader extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
export class PageBody extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
export class PageFooter extends PaperElement {
    constructor() {
        super();
    }
}


@CustomElement
export class ForEach extends PaperElement {

    constructor() {
        super();

        console.log("stripping the elements...");

        this.content = document.createDocumentFragment();
        for (let child = this.firstChild; child; child = this.firstChild) {
            this.content.appendChild(child);
        }
    }

    render($scope) {

        let fragment = document.createDocumentFragment();

        let alias = this.getAttribute("item");
        let expression = this.getAttribute("in");

        let create = (items) => {

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.renderItem($scope.$new({
                        [alias]: item,
                        "index": index
                    })));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.renderItem($scope.$new({
                        [alias]: items[key],
                        "index": key
                    })));
                });
            }

            this.appendChild(fragment);
        };

        let update = (items) => {

            while (this.lastChild) this.removeChild(this.lastChild);

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.renderItem($scope.$new({
                        [alias]: item,
                        "index": index
                    })));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.renderItem($scope.$new({
                        [alias]: items[key],
                        "index": key
                    })));
                });
            }

            this.appendChild(fragment);
        };

        return $scope.$watch(expression, function (items, {path, to, from}) {
            console.log("changed: (", JSON.stringify(to), "<-", JSON.stringify(from), ")");
            update(items);
        }).then(create).catch(reason => {
            console.error(reason);
        });
    }

    renderItem($itemScope) {

        const linker = new Linker($itemScope);

        let clone = this.content.cloneNode(true);
        for (const child of clone.childNodes) {
            child.$scope = $itemScope;
            linker.link(child);
        }

        return clone;
    }
}

function createPlaceholder(prefix = ' ', suffix = ' ') {
    let outerHTML = this.outerHTML;
    let start = outerHTML.indexOf('<') + 1;
    let end = outerHTML.indexOf('>', start);
    return document.createComment(prefix + outerHTML.substring(start, end) + suffix);
}
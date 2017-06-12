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

        let $scope;

        const linker = this.compile();
        this.linked;
        if (linker) {
            this.linked = linker.call(this, $scope = closest("$scope", this));
        } else {
            this.linked = Promise.resolve();
        }


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

        return this.linked.then(() => {
            if (this.render) {
                $scope = $scope || closest("$scope", this);
                let promise = this.render($scope);
                if (promise) {
                    return promise.then(() => this.readyCallback());
                } else if (this.readyCallback) {
                    this.readyCallback();
                }
            } else if (this.readyCallback) {
                this.readyCallback();
            }
        });
    }

    compile() {

        const treeWalker = document.createTreeWalker(this, NodeFilter.SHOW_TEXT);

        const linkFunctions = [];

        for (const attr of this.attributes) if (attr.name[0] === '@') {
            const expression = attr.value;
            const attrName = attr.name.substring(1);
            const update = (value) => {
                this.setAttribute(attrName, value);
            }
            linkFunctions.push(function ($scope) {
                return $scope.$watch(expression, update).then(update);
            })
        }

        let node, text, begin, end;
        while (node = treeWalker.nextNode()) if (
            (text = node.nodeValue)
            && (begin = text.indexOf('{{') + 2) >= 2
            && (end = text.indexOf('}}', begin + 2)) >= 0
        ) {
            const expression = text.substring(begin, end);
            const textNode = node;
            const update = function (value) {
                textNode.nodeValue = value ? value : "???";
            };
            linkFunctions.push(function ($scope) {
                return $scope.$watch(expression, update).then(update);
            });
        }


        if (linkFunctions.length) {
            return function ($scope) {
                return Promise.all(linkFunctions.map(fn => fn($scope)));
            };
        }
    }

    disconnectedCallback() {
        if (debug) console.debug("disconnected:", this.tagName);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (debug) console.debug(this.tagName, "attribute changed", attrName, oldVal, newVal);
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

    childrenReadyCallback() {
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

        this.item = this.getAttribute("item");
    }

    render($scope) {

        let fragment = document.createDocumentFragment();

        let expression = this.getAttribute("in");

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

            this.appendChild(fragment);
        };

        let update = (items) => {

            while (this.lastChild) this.removeChild(this.lastChild);

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.renderItem($scope, [item, index]));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.renderItem($scope, [items[key], key]));
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

    renderItem($scope, [item, index]) {
        let clone = this.content.cloneNode(true);
        const $itemScope = $scope.$new({
            [this.item]: item,
            "index": index
        });
        for (const child of clone.children) {
            child.$scope = $itemScope;
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
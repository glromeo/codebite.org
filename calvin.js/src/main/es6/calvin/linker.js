import {PaperElement} from "./paper-element";

const debug = false;

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
        let node = root instanceof DocumentFragment ? treeWalker.nextNode() : treeWalker.currentNode;
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

            if (debug) console.debug("linking text expression: {{", expression, "}}");

            const setNodeValue = function (value) {
                node.nodeValue = value;
            };
            this.ready = this.ready.then(() => this.scope.$watch(expression, setNodeValue).then(setNodeValue));
        }
    }

    [Node.ELEMENT_NODE](node) {
        for (const attr of node.attributes) if (attr.name[0] === '@') {
            const expression = attr.value;

            if (debug) console.debug("linking attribute expression: {{", expression, "}}");

            const attrName = attr.name.substring(1);
            const setAttribute = function (value) {
                node.setAttribute(attrName, value);
            };
            this.ready = this.ready.then(() => this.scope.$watch(expression, setAttribute).then(setAttribute));
        }
    }
}
import {PaperElement} from "./paper-element";

const debug = false;

const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
        return (node instanceof PaperElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
});

export class Compiler {

    compile(root) {

        debug && console.debug("compile:", root.tagName);

        walker.currentNode = root;

        if (root instanceof DocumentFragment) {
            walker.nextNode();
        }

        this.linkers = [];

        let node = walker.currentNode;
        while (node) try {
            this[node.nodeType](node);
            node = walker.nextNode();
        } catch (e) {
            debugger;
        }

        return (linkers => function link($scope) {
            return Promise.all(linkers.map(linker => linker($scope)));
        })(this.linkers);
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

            this.linkers.push(function ($scope) {
                return $scope.$watch(expression, setNodeValue).then(setNodeValue);
            });
        }

    }

    [Node.ELEMENT_NODE](node) {

        if (node instanceof HTMLTemplateElement) {
            const is = node.getAttribute("is");
            if (is) {
                const template = node;
                template.removeAttribute("is");
                const customElement = document.createElement(is);
                for (const attr of template.attributes) {
                    customElement.setAttribute(attr.name, attr.value);
                }
                customElement.appendChild(template.content);
                node = walker.previousNode();
                template.parentNode.replaceChild(customElement, template);
                return;
            }
        }

        for (const attr of node.attributes) if (attr.name[0] === '@') {
            const expression = attr.value;

            if (debug) console.debug("linking attribute expression: {{", expression, "}}");

            const attrName = attr.name.substring(1);
            const setAttribute = function (value) {
                node.setAttribute(attrName, value);
            };

            this.linkers.push(function ($scope) {
                return $scope.$watch(expression, setAttribute).then(setAttribute);
            });
        }
    }
}

export const compiler = new Compiler(document.body);

export function compile(node) {
    return compiler.compile(node);
}


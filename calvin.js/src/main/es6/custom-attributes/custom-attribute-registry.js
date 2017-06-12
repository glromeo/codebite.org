import {CUSTOM_ATTRIBUTE} from "./symbols";

export default class CustomAttributeRegistry {

    constructor() {
        this.definitions = {};
    }

    define(localName, constructor) {

        if (!(constructor instanceof Function)) {
            throw new TypeError("Custom attribute constructors must be functions.");
        }
        if (this.has(localName)) {
            throw new Error(`A custom attribute with name '${localName}' has already been defined.`);
        }

        return this.definitions[localName] = constructor;
    }

    get(localName) {
        return this.definitions[localName];
    }

    has(localName) {
        return this.definitions.hasOwnProperty(localName);
    }

    upgradeTree(root) {

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

        let node, attributes, definition, outer, next = walker.currentNode;

        while (node = next) {

            next = walker.nextNode();

            if (attributes = node.attributes) {

                outer = node;

                for (let attr, lastIndex = attributes.length - 1; attr = attributes[lastIndex]; --lastIndex) {

                    if (definition = this.definitions[attr.name]) {
                        const pi = document.createProcessingInstruction(attr.name, attr.value);
                        const customAttribute = new definition(attr);
                        Object.defineProperty(pi, CUSTOM_ATTRIBUTE, {
                            value: customAttribute
                        });

                        if (definition['@Transclude']) {
                            customAttribute.targetNode = pi;
                            customAttribute.sourceNode = outer;
                            customAttribute.transclude = (node => function (what) {
                                // the idea is that this function might be computed from the template...
                                if (what === undefined || what === "element") {
                                    return node;
                                } else {
                                    return node.querySelector(what);
                                }
                            })(outer);

                            outer.parentNode.replaceChild(pi, outer);
                            outer = pi;

                            node.removeAttributeNode(attr);
                        } else {
                            customAttribute.targetNode = node;
                            node.appendChild(pi);
                        }

                    }
                }
            }
        }
    }

    disconnectTree(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_PROCESSING_INSTRUCTION);
        let node, next = walker.currentNode;
        while (node = next) {
            next = walker.nextNode();
            const ca = node[CUSTOM_ATTRIBUTE];
            if (ca) {
                ca.disconnectedCallback();
            }
        }
    }

    connectTree(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_PROCESSING_INSTRUCTION);
        let node, next = walker.currentNode;
        while (node = next) {
            next = walker.nextNode();
            const ca = node[CUSTOM_ATTRIBUTE];
            if (ca) {
                ca.connectedCallback();
            }
        }
    }
}
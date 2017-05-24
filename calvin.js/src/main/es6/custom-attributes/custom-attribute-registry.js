import {CUSTOM_ATTRIBUTES} from "./symbols";

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
        let node, templateElement;

        next: while (node = walker.nextNode()) {

            let attributes = node.attributes, length = attributes.length;
            if (length) {

                for (let i=0; i<length; i++) {
                    let attr = attributes[i];

                    const definition = this.definitions[attr.name];
                    if (definition) {

                        let template = definition['@Template'];
                        if (template) {
                            if (template instanceof Function) {
                                template = template(node, attr);
                            }
                            let content;
                            if (typeof template === "string") {
                                content = document.createDocumentFragment();
                                let div = document.createElement('div');
                                div.innerHTML = template;
                                for (const child of div.childNodes) {
                                    content.appendChild(child);
                                }
                            } else if (template instanceof DocumentFragment) {
                                content = customAttribute.content = template;
                            } else {
                                content.appendChild(template);
                            }

                            if (!templateElement) {
                                templateElement = document.createElement('template');
                                walker.previousNode();
                                node.parentNode.replaceChild(templateElement, node);
                                walker.nextNode();
                            }

                            let customAttribute = new definition(attr);

                            const $marker = customAttribute.$marker = document.createProcessingInstruction();

                            node.removeAttributeNode(attr);
                            templateElement.setAttributeNode(attr);

                            for (const transclude of content.querySelectorAll('transclude')) {
                                const slot = transclude.getAttribute('slot');
                                if (slot) {
                                    content.replaceChild(node.querySelector(slot), transclude);
                                } else {
                                    content.replaceChild(node, transclude);
                                }
                            }

                            pendingAttributes.length = 0;
                            break next;

                        } else {
                            pendingAttributes.push(attr);
                        }
                    }
                }

                if (pendingAttributes.length) {
                    for (const attr of pendingAttributes) {
                        const customAttribute = new (attr.definition)();
                        customAttribute.attr = attr;
                        customAttribute.ownerElement = node;
                        customAttribute.connectedCallback();
                    }
                    pendingAttributes.length = 0;
                }
            }
        }
    }
}
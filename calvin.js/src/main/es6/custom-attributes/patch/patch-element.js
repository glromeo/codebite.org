import {CUSTOM_ATTRIBUTES} from "../symbols";
import {log, patchPrototypeProperty} from "./utility";

export default function patchElement(registry) {

    patchPrototypeProperty(Element, 'innerHTML', nativeInnerHTML => ({
        set: function (html) {
            const nativeResult = nativeInnerHTML.set.call(this, html);
            if (this.isConnected) try {
                log.call(this, "innerHTML.set", html);
                upgradeTree(this);
            } catch (e) {
                console.error("ugrade failed for node", this, e);
            }
            return nativeResult;
        }
    }));

    const definitions = registry.definitions;

    function upgradeTree(root) {

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        let node, nextNode = walker.nextNode();
        let customAttribute, customAttributes = [], outerTemplate, firstCustomAttribute;

        while (node = nextNode) {

            nextNode = walker.nextNode();

            if (node.hasAttributes()) {

                for (let attr of node.attributes) {
                    const definition = definitions.get(attr.name);
                    if (definition) {
                        customAttribute = new definition(attr);
                        customAttribute.sourceAttribute = attr;
                        customAttributes.push(customAttribute);
                    }
                }

                while (customAttribute = customAttributes.pop()) {

                    let template = customAttribute.constructor['@Template'];
                    if (template) {
                        const templateElement = document.createElement('template');
                        const attr = customAttribute.sourceAttribute;

                        attr.ownerElement.removeAttributeNode(attr);
                        templateElement.setAttributeNode(attr);
                        node.parentNode.replaceChild(templateElement, node);

                        Object.defineProperty(templateElement, CUSTOM_ATTRIBUTES, {
                            value: [customAttribute]
                        })

                        const content = templateElement.content;

                        if (template instanceof Function) {
                            template = template(node, attr);
                        }

                        if (typeof template === "string") {
                            templateElement.innerHTML = template;
                        } else if (template instanceof DocumentFragment) {
                            for (let child of template.children) content.appendChild(child);
                        } else {
                            content.appendChild(template);
                        }

                        for (const transclude of content.querySelectorAll('transclude')) {
                            const slot = transclude.getAttribute('slot');
                            if (slot) {
                                content.replaceChild(node.querySelector(slot), transclude);
                            } else {
                                content.replaceChild(node, transclude);
                            }
                        }

                        customAttribute.template = templateElement;
                        node = templateElement;
                    } else {
                        customAttribute.next = firstCustomAttribute;
                        firstCustomAttribute = customAttribute;
                    }
                }

                if (firstCustomAttribute) {
                    Object.defineProperty(firstCustomAttribute.sourceAttribute.ownerElement, CUSTOM_ATTRIBUTES, {
                        value: {
                            [Symbol.iterator]() {
                                return {
                                    value: firstCustomAttribute,
                                    done: false,
                                    next() {
                                        this.next = next;
                                        return this;
                                    }
                                }
                                function next() {
                                    if (this.value) {
                                        this.done = !(this.value = this.value.next);
                                    }
                                    return this;
                                }
                            }
                        }
                    });
                    firstCustomAttribute = undefined;
                }

                if (node[CUSTOM_ATTRIBUTES]) for (const customAttribute of node[CUSTOM_ATTRIBUTES]) {
                    console.log("> connectedCallback", node);
                    if (customAttribute.connectedCallback) customAttribute.connectedCallback();
                }
            }
        }
    }
}

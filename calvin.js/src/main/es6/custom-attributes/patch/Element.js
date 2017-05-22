import CEState from "../CustomAttributeState.js";
import * as ca from "../Utilities.js";
import PatchChildNode from "./Interface/ChildNode.js";

import PatchParentNode from "./Interface/ParentNode.js";
import Native from "./Native.js";

import {CUSTOM_ATTRIBUTES} from "custom-attributes/custom-attributes";

export default function (internals) {

    Element.prototype['attachShadow'] = function (init) {
        ca.log.call(this, "attachShadow");
        const shadowRoot = Native.Element.attachShadow.call(this, init);
        this.__CA_shadowRoot = shadowRoot;
        return shadowRoot;
    };

    Object.defineProperty(Element.prototype, 'innerHTML', {
        enumerable: Native.Element.innerHTML.enumerable,
        configurable: true,
        get: Native.Element.innerHTML.get,
        set: function (htmlString) {
            ca.log.call(this, "set innerHTML", htmlString);

            // const isConnected = ca.isConnected(this);
            // // NOTE: In IE11, when using the native `innerHTML` setter, all nodes
            // // that were previously descendants of the context element have all of
            // // their children removed as part of the set - the entire subtree is
            // // 'disassembled'. This work around walks the subtree *before* using the
            // // native setter.
            //
            // let removedElements = undefined;
            // if (isConnected) {
            //     removedElements = [];
            //     ca.walkDeepDescendantElements(this, element => {
            //         if (element !== this) {
            //             removedElements.push(element);
            //         }
            //     });
            // }

            const treeWalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT, {
                acceptNode: function (node) {
                    return NodeFilter.FILTER_ACCEPT;
                }
            }, false);

            // while(treeWalker.nextNode()) {
            //     console.log(treeWalker.currentNode);
            // }
            //
            Native.Element.innerHTML.set.call(this, htmlString);

            if (this.closest && this.closest('.test-root')) {

                while (treeWalker.nextNode()) {
                    console.log(treeWalker.currentNode);
                }
            }

            // if (removedElements) {
            //     for (let i = 0; i < removedElements.length; i++) {
            //         const element = removedElements[i];
            //         if (element.__CA_state === CEState.custom) {
            //             internals.disconnectedCallback(element);
            //         }
            //     }
            // }
            // // Only create custom elements if this element's owner document is
            // // associated with the registry.
            // if (!this.ownerDocument.__CA_hasRegistry) {
            //     internals.patchTree(this);
            // } else {
            //     internals.patchAndUpgradeTree(this);
            // }
        },
    });

    function defineCustomAttributes() {
        let attributes = new Map();
        const definition = {
            get(name, create) {
                this.first = this.last = create();
                attributes.set(name, this.first);
                this.get = (name, create) => {
                    let found = attributes.get(name);
                    if (found) {
                        return found;
                    } else {
                        attributes.set(name, found = create());
                        return this.last = this.last.next = found;
                    }
                };
                return this.first;
            }
        };
        Object.defineProperty(this, CUSTOM_ATTRIBUTES, {
            configurable: true,
            get: function () {
                return definition;
            }
        });
        return definition;
    }

    Element.prototype['setAttribute'] = function (name, newValue) {

        ca.log.call(this, "setAttribute", name, newValue);

        let CustomAttributeClass = window['customAttributes'].get(name);
        if (CustomAttributeClass) {

            let customAttributes = this[CUSTOM_ATTRIBUTES] || Object.defineProperty(this, CUSTOM_ATTRIBUTES, {
                    configurable: true,
                    value: new Map()
                })[CUSTOM_ATTRIBUTES];

            let customAttribute = customAttributes.get(name);
            if (customAttribute === undefined) {
                customAttribute = new CustomAttributeClass(name, newValue);
                customAttribute.ownerElement = this;  // this should go to
                customAttribute.template = document.createElement('template');
                Native.Element.setAttribute.call(customAttribute.template, name, newValue);
                customAttribute.template['[[CustomAttribute]]'] = customAttribute;
                customAttributes.set(name, customAttribute);
            }

            const oldValue = Native.Element.getAttribute.call(this, name);
            let nativeResult = Native.Element.setAttribute.call(this, name, newValue);
            if (customAttribute.changedCallback !== undefined) {
                customAttribute.changedCallback(oldValue, newValue);
            }
            return nativeResult;
        } else {
            return Native.Element.setAttribute.call(this, name, newValue);
        }
    };

    Element.prototype['setAttributeNS'] = function (namespace, name, newValue) {

        ca.log.call(this, "setAttributeNS", namespace, name, newValue);
        if (!namespace) {
            return this.setAttribute(name, newValue);
        } else {
            return Native.Element.setAttributeNS.call(this, namespace, name, newValue);
        }
    };

    Element.prototype['removeAttribute'] = function (name) {

        ca.log.call(this, "removeAttribute", name);

        // Fast path for non-custom elements.
        if (this.__CA_state !== CEState.custom) {
            return Native.Element.removeAttribute.call(this, name);
        }
        const oldValue = Native.Element.getAttribute.call(this, name);
        Native.Element.removeAttribute.call(this, name);
        if (oldValue !== null) {
            internals.attributeChangedCallback(this, name, oldValue, null, null);
        }
    };

    Element.prototype['removeAttributeNS'] = function (namespace, name) {

        ca.log.call(this, "removeAttributeNS", namespace, name);

        // Fast path for non-custom elements.
        if (this.__CA_state !== CEState.custom) {
            return Native.Element.removeAttributeNS.call(this, namespace, name);
        }
        const oldValue = Native.Element.getAttributeNS.call(this, namespace, name);
        Native.Element.removeAttributeNS.call(this, namespace, name);
        // In older browsers, `Element#getAttributeNS` may return the empty string
        // instead of null if the attribute does not exist. For details, see;
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNS#Notes
        const newValue = Native.Element.getAttributeNS.call(this, namespace, name);
        if (oldValue !== newValue) {
            internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
        }
    };

    HTMLElement.prototype['insertAdjacentElement'] = function (where, element) {

        ca.log.call(this, "insertAdjacentElement", where, element);

        const wasConnected = ca.isConnected(element);
        const insertedElement = (Native.HTMLElement.insertAdjacentElement.call(this, where, element));
        if (wasConnected) {
            internals.disconnectTree(element);
        }
        if (ca.isConnected(insertedElement)) {
            internals.connectTree(element);
        }
    };

    PatchParentNode(internals, Element.prototype, {
        prepend: Native.Element.prepend,
        append: Native.Element.append,
    });

    PatchChildNode(internals, Element.prototype, {
        before: Native.Element.before,
        after: Native.Element.after,
        replaceWith: Native.Element.replaceWith,
        remove: Native.Element.remove,
    });
};

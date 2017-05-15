import CEState from "../CustomAttributeState.js";
import * as Utilities from "../Utilities.js";
import PatchChildNode from "./Interface/ChildNode.js";

import PatchParentNode from "./Interface/ParentNode.js";
import Native from "./Native.js";

/**
 * @param {!CustomAttributeInternals} internals
 */
export default function (internals) {
    if (Native.Element.attachShadow) {
        Element.prototype['attachShadow'] = /**
         * @this {Element}
         * @param {!{mode: string}} init
         * @return {ShadowRoot}
         */
            function (init) {
            console.log("attachShadow", init);
            const shadowRoot = Native.Element.attachShadow.call(this, init);
            this.__CA_shadowRoot = shadowRoot;
            return shadowRoot;
        };
    } else {
        console.warn('Custom Elements: `Element#attachShadow` was not patched.');
    }


    function patch_innerHTML(destination, baseDescriptor) {
        Object.defineProperty(destination, 'innerHTML', {
            enumerable: baseDescriptor.enumerable,
            configurable: true,
            get: baseDescriptor.get,
            set: /** @this {Element} */ function (htmlString) {

                console.log("set innerHTML", htmlString);

                const isConnected = Utilities.isConnected(this);

                // NOTE: In IE11, when using the native `innerHTML` setter, all nodes
                // that were previously descendants of the context element have all of
                // their children removed as part of the set - the entire subtree is
                // 'disassembled'. This work around walks the subtree *before* using the
                // native setter.
                /** @type {!Array<!Element>|undefined} */
                let removedElements = undefined;
                if (isConnected) {
                    removedElements = [];
                    Utilities.walkDeepDescendantElements(this, element => {
                        if (element !== this) {
                            removedElements.push(element);
                        }
                    });
                }

                baseDescriptor.set.call(this, htmlString);

                if (removedElements) {
                    for (let i = 0; i < removedElements.length; i++) {
                        const element = removedElements[i];
                        if (element.__CA_state === CEState.custom) {
                            internals.disconnectedCallback(element);
                        }
                    }
                }

                // Only create custom elements if this element's owner document is
                // associated with the registry.
                if (!this.ownerDocument.__CA_hasRegistry) {
                    internals.patchTree(this);
                } else {
                    internals.patchAndUpgradeTree(this);
                }
                return htmlString;
            },
        });
    }

    if (Native.Element.innerHTML && Native.Element.innerHTML.get) {
        patch_innerHTML(Element.prototype, Native.Element.innerHTML);
    } else if (Native.HTMLElement.innerHTML && Native.HTMLElement.innerHTML.get) {
        patch_innerHTML(HTMLElement.prototype, Native.HTMLElement.innerHTML);
    } else {

        /** @type {HTMLDivElement} */
        const rawDiv = Native.Document.createElement.call(document, 'div');

        internals.addPatch(function (element) {
            patch_innerHTML(element, {
                enumerable: true,
                configurable: true,
                // Implements getting `innerHTML` by performing an unpatched `cloneNode`
                // of the element and returning the resulting element's `innerHTML`.
                // TODO: Is this too expensive?
                get: /** @this {Element} */ function () {
                    return Native.Node.cloneNode.call(this, true).innerHTML;
                },
                // Implements setting `innerHTML` by creating an unpatched element,
                // setting `innerHTML` of that element and replacing the target
                // element's children with those of the unpatched element.
                set: /** @this {Element} */ function (assignedValue) {

                    console.log("set innerHTML", htmlString);

                    // NOTE: re-route to `content` for `template` elements.
                    // We need to do this because `template.appendChild` does not
                    // route into `template.content`.
                    /** @type {!Node} */
                    const content = this.localName === 'template' ? (/** @type {!HTMLTemplateElement} */ (this)).content : this;
                    rawDiv.innerHTML = assignedValue;

                    while (content.childNodes.length > 0) {
                        Native.Node.removeChild.call(content, content.childNodes[0]);
                    }
                    while (rawDiv.childNodes.length > 0) {
                        Native.Node.appendChild.call(content, rawDiv.childNodes[0]);
                    }
                },
            });
        });
    }


    Element.prototype['setAttribute'] = /**
     * @this {Element}
     * @param {string} name
     * @param {string} newValue
     */
        function (name, newValue) {
        // Fast path for non-custom elements.
        if (this.__CA_state !== CEState.custom) {
            return Native.Element.setAttribute.call(this, name, newValue);
        }
        const oldValue = Native.Element.getAttribute.call(this, name);
        Native.Element.setAttribute.call(this, name, newValue);
        newValue = Native.Element.getAttribute.call(this, name);
        internals.attributeChangedCallback(this, name, oldValue, newValue, null);
    };
    Element.prototype['setAttributeNS'] = /**
     * @this {Element}
     * @param {?string} namespace
     * @param {string} name
     * @param {string} newValue
     */
        function (namespace, name, newValue) {
        // Fast path for non-custom elements.
        if (this.__CA_state !== CEState.custom) {
            return Native.Element.setAttributeNS.call(this, namespace, name, newValue);
        }
        const oldValue = Native.Element.getAttributeNS.call(this, namespace, name);
        Native.Element.setAttributeNS.call(this, namespace, name, newValue);
        newValue = Native.Element.getAttributeNS.call(this, namespace, name);
        internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
    };
    Element.prototype['removeAttribute'] = /**
     * @this {Element}
     * @param {string} name
     */
        function (name) {
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
    Element.prototype['removeAttributeNS'] = /**
     * @this {Element}
     * @param {?string} namespace
     * @param {string} name
     */
        function (namespace, name) {
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
    function patch_insertAdjacentElement(destination, baseMethod) {
        destination['insertAdjacentElement'] = /**
         * @this {Element}
         * @param {string} where
         * @param {!Element} element
         * @return {?Element}
         */
            function (where, element) {
            const wasConnected = Utilities.isConnected(element);
            const insertedElement = /** @type {!Element} */
                (baseMethod.call(this, where, element));
            if (wasConnected) {
                internals.disconnectTree(element);
            }
            if (Utilities.isConnected(insertedElement)) {
                internals.connectTree(element);
            }
            return insertedElement;
        };
    }

    if (Native.HTMLElement.insertAdjacentElement) {
        patch_insertAdjacentElement(HTMLElement.prototype, Native.HTMLElement.insertAdjacentElement);
    } else if (Native.Element.insertAdjacentElement) {
        patch_insertAdjacentElement(Element.prototype, Native.Element.insertAdjacentElement);
    } else {
        console.warn('Custom Elements: `Element#insertAdjacentElement` was not patched.');
    }


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

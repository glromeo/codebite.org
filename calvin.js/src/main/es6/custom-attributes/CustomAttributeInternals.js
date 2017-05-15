import CEState from "./CustomAttributeState.js";
import * as Utilities from "./Utilities.js";

export default class CustomAttributeInternals {
    constructor() {
        /** @type {!Map<string, !CustomAttributeDefinition>} */
        this._localNameToDefinition = new Map();

        /** @type {!Map<!Function, !CustomAttributeDefinition>} */
        this._constructorToDefinition = new Map();

        /** @type {!Array<!function(!Node)>} */
        this._patches = [];

        /** @type {boolean} */
        this._hasPatches = false;
    }

    /**
     * @param {string} localName
     * @param {!CustomAttributeDefinition} definition
     */
    setDefinition(localName, definition) {
        this._localNameToDefinition.set(localName, definition);
        this._constructorToDefinition.set(definition.constructor, definition);
    }

    /**
     * @param {string} localName
     * @return {!CustomAttributeDefinition|undefined}
     */
    localNameToDefinition(localName) {
        return this._localNameToDefinition.get(localName);
    }

    /**
     * @param {!Function} constructor
     * @return {!CustomAttributeDefinition|undefined}
     */
    constructorToDefinition(constructor) {
        return this._constructorToDefinition.get(constructor);
    }

    /**
     * @param {!function(!Node)} listener
     */
    addPatch(listener) {
        this._hasPatches = true;
        this._patches.push(listener);
    }

    /**
     * @param {!Node} node
     */
    patchTree(node) {
        if (!this._hasPatches) return;

        Utilities.walkDeepDescendantElements(node, element => this.patch(element));
    }

    /**
     * @param {!Node} node
     */
    patch(node) {
        if (!this._hasPatches) return;

        if (node.__CA_patched) return;
        node.__CA_patched = true;

        for (let i = 0; i < this._patches.length; i++) {
            this._patches[i](node);
        }
    }

    /**
     * @param {!Node} root
     */
    connectTree(root) {
        const elements = [];

        Utilities.walkDeepDescendantElements(root, element => elements.push(element));

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element.__CA_state === CEState.custom) {
                this.connectedCallback(element);
            } else {
                this.upgradeElement(element);
            }
        }
    }

    /**
     * @param {!Node} root
     */
    disconnectTree(root) {
        const elements = [];

        Utilities.walkDeepDescendantElements(root, element => elements.push(element));

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element.__CA_state === CEState.custom) {
                this.disconnectedCallback(element);
            }
        }
    }

    /**
     * Upgrades all uncustomized custom elements at and below a root node for
     * which there is a definition. When custom element reaction callbacks are
     * assumed to be called synchronously (which, by the current DOM / HTML spec
     * definitions, they are *not*), callbacks for both elements customized
     * synchronously by the parser and elements being upgraded occur in the same
     * relative order.
     *
     * NOTE: This function, when used to simulate the construction of a tree that
     * is already created but not customized (i.e. by the parser), does *not*
     * prevent the element from reading the 'final' (true) state of the tree. For
     * example, the element, during truly synchronous parsing / construction would
     * see that it contains no children as they have not yet been inserted.
     * However, this function does not modify the tree, the element will
     * (incorrectly) have children. Additionally, self-modification restrictions
     * for custom element constructors imposed by the DOM spec are *not* enforced.
     *
     *
     * The following nested list shows the steps extending down from the HTML
     * spec's parsing section that cause elements to be synchronously created and
     * upgraded:
     *
     * The "in body" insertion mode:
     * https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
     * - Switch on token:
     *   .. other cases ..
     *   -> Any other start tag
     *      - [Insert an HTML element](below) for the token.
     *
     * Insert an HTML element:
     * https://html.spec.whatwg.org/multipage/syntax.html#insert-an-html-element
     * - Insert a foreign element for the token in the HTML namespace:
     *   https://html.spec.whatwg.org/multipage/syntax.html#insert-a-foreign-element
     *   - Create an element for a token:
     *     https://html.spec.whatwg.org/multipage/syntax.html#create-an-element-for-the-token
     *     - Will execute script flag is true?
     *       - (Element queue pushed to the custom element reactions stack.)
     *     - Create an element:
     *       https://dom.spec.whatwg.org/#concept-create-element
     *       - Sync CE flag is true?
     *         - Constructor called.
     *         - Self-modification restrictions enforced.
     *       - Sync CE flag is false?
     *         - (Upgrade reaction enqueued.)
     *     - Attributes appended to element.
     *       (`attributeChangedCallback` reactions enqueued.)
     *     - Will execute script flag is true?
     *       - (Element queue popped from the custom element reactions stack.
     *         Reactions in the popped stack are invoked.)
     *   - (Element queue pushed to the custom element reactions stack.)
     *   - Insert the element:
     *     https://dom.spec.whatwg.org/#concept-node-insert
     *     - Shadow-including descendants are connected. During parsing
     *       construction, there are no shadow-*excluding* descendants.
     *       However, the constructor may have validly attached a shadow
     *       tree to itself and added descendants to that shadow tree.
     *       (`connectedCallback` reactions enqueued.)
     *   - (Element queue popped from the custom element reactions stack.
     *     Reactions in the popped stack are invoked.)
     *
     * @param {!Node} root
     * @param {!Set<Node>=} visitedImports
     */
    patchAndUpgradeTree(root, visitedImports = new Set()) {
        const elements = [];

        const gatherElements = element => {
            if (element.localName === 'link' && element.getAttribute('rel') === 'import') {
                // The HTML Imports polyfill sets a descendant element of the link to
                // the `import` property, specifically this is *not* a Document.
                const importNode = /** @type {?Node} */ (element.import);

                if (importNode instanceof Node && importNode.readyState === 'complete') {
                    importNode.__CA_isImportDocument = true;

                    // Connected links are associated with the registry.
                    importNode.__CA_hasRegistry = true;
                } else {
                    // If this link's import root is not available, its contents can't be
                    // walked. Wait for 'load' and walk it when it's ready.
                    element.addEventListener('load', () => {
                        const importNode = /** @type {!Node} */ (element.import);

                        if (importNode.__CA_documentLoadHandled) return;
                        importNode.__CA_documentLoadHandled = true;

                        importNode.__CA_isImportDocument = true;

                        // Connected links are associated with the registry.
                        importNode.__CA_hasRegistry = true;

                        // Clone the `visitedImports` set that was populated sync during
                        // the `patchAndUpgradeTree` call that caused this 'load' handler to
                        // be added. Then, remove *this* link's import node so that we can
                        // walk that import again, even if it was partially walked later
                        // during the same `patchAndUpgradeTree` call.
                        const clonedVisitedImports = new Set(visitedImports);
                        visitedImports.delete(importNode);

                        this.patchAndUpgradeTree(importNode, visitedImports);
                    });
                }
            } else {
                elements.push(element);
            }
        };

        // `walkDeepDescendantElements` populates (and internally checks against)
        // `visitedImports` when traversing a loaded import.
        Utilities.walkDeepDescendantElements(root, gatherElements, visitedImports);

        if (this._hasPatches) {
            for (let i = 0; i < elements.length; i++) {
                this.patch(elements[i]);
            }
        }

        for (let i = 0; i < elements.length; i++) {
            this.upgradeElement(elements[i]);
        }
    }

    /**
     * @param {!Element} element
     */
    upgradeElement(element) {
        const currentState = element.__CA_state;
        if (currentState !== undefined) return;

        if (true) {
            if (element.tagName === 'DIV') {
                console.log("upgradeElement", element);
                
            }
            return;
        }

        const definition = this.localNameToDefinition(element.localName);
        if (!definition) return;

        definition.constructionStack.push(element);

        const constructor = definition.constructor;
        try {
            try {
                let result = new (constructor)();
                if (result !== element) {
                    throw new Error('The custom element constructor did not produce the element being upgraded.');
                }
            } finally {
                definition.constructionStack.pop();
            }
        } catch (e) {
            element.__CA_state = CEState.failed;
            throw e;
        }

        element.__CA_state = CEState.custom;
        element.__CA_definition = definition;

        if (definition.attributeChangedCallback) {
            const observedAttributes = definition.observedAttributes;
            for (let i = 0; i < observedAttributes.length; i++) {
                const name = observedAttributes[i];
                const value = element.getAttribute(name);
                if (value !== null) {
                    this.attributeChangedCallback(element, name, null, value, null);
                }
            }
        }

        if (Utilities.isConnected(element)) {
            this.connectedCallback(element);
        }
    }

    /**
     * @param {!Element} element
     */
    connectedCallback(element) {
        const definition = element.__CA_definition;
        if (definition.connectedCallback) {
            definition.connectedCallback.call(element);
        }
    }

    /**
     * @param {!Element} element
     */
    disconnectedCallback(element) {
        const definition = element.__CA_definition;
        if (definition.disconnectedCallback) {
            definition.disconnectedCallback.call(element);
        }
    }

    /**
     * @param {!Element} element
     * @param {string} name
     * @param {?string} oldValue
     * @param {?string} newValue
     * @param {?string} namespace
     */
    attributeChangedCallback(element, name, oldValue, newValue, namespace) {
        const definition = element.__CA_definition;
        if (
            definition.attributeChangedCallback &&
            definition.observedAttributes.indexOf(name) > -1
        ) {
            definition.attributeChangedCallback.call(element, name, oldValue, newValue, namespace);
        }
    }
}

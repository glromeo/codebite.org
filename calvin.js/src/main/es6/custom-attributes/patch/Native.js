export default {
    Document: {
        createElement: window.Document.prototype.createElement,
        createElementNS: window.Document.prototype.createElementNS,
        importNode: window.Document.prototype.importNode,
        prepend: window.Document.prototype.prepend,
        append: window.Document.prototype.append,
    },
    Node: {
        cloneNode: window.Node.prototype.cloneNode,
        appendChild: window.Node.prototype.appendChild,
        insertBefore: window.Node.prototype.insertBefore,
        removeChild: window.Node.prototype.removeChild,
        replaceChild: window.Node.prototype.replaceChild,
        textContent: Object.getOwnPropertyDescriptor(window.Node.prototype, 'textContent'),
    },
    Element: {
        attachShadow: window.Element.prototype.attachShadow,
        innerHTML: Object.getOwnPropertyDescriptor(window.Element.prototype, 'innerHTML'),
        getAttribute: window.Element.prototype.getAttribute,
        setAttribute: window.Element.prototype.setAttribute,
        removeAttribute: window.Element.prototype.removeAttribute,
        getAttributeNS: window.Element.prototype.getAttributeNS,
        setAttributeNS: window.Element.prototype.setAttributeNS,
        removeAttributeNS: window.Element.prototype.removeAttributeNS,
        insertAdjacentElement: window.Element.prototype.insertAdjacentElement,
        prepend: window.Element.prototype.prepend,
        append: window.Element.prototype.append,
        before: window.Element.prototype.before,
        after: window.Element.prototype.after,
        replaceWith: window.Element.prototype.replaceWith,
        remove: window.Element.prototype.remove
    },
    HTMLElement: {
        innerHTML: Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'innerHTML'),
        insertAdjacentElement: window.HTMLElement.prototype.insertAdjacentElement
    }
};

export default {

    Document: {
        createElement:          Document.prototype.createElement,
        createElementNS:        Document.prototype.createElementNS,
        importNode:             Document.prototype.importNode,
        prepend:                Document.prototype.prepend,
        append:                 Document.prototype.append,
    },

    Node: {
        cloneNode:              Node.prototype.cloneNode,
        appendChild:            Node.prototype.appendChild,
        insertBefore:           Node.prototype.insertBefore,
        removeChild:            Node.prototype.removeChild,
        replaceChild:           Node.prototype.replaceChild,
        textContent:            Object.getOwnPropertyDescriptor(Node.prototype, 'textContent'),
    },

    Element: {
        attachShadow:           Element.prototype.attachShadow,
        innerHTML:              Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'),
        getAttribute:           Element.prototype.getAttribute,
        setAttribute:           Element.prototype.setAttribute,
        removeAttribute:        Element.prototype.removeAttribute,
        getAttributeNS:         Element.prototype.getAttributeNS,
        setAttributeNS:         Element.prototype.setAttributeNS,
        removeAttributeNS:      Element.prototype.removeAttributeNS,
        insertAdjacentElement:  Element.prototype.insertAdjacentElement,
        prepend:                Element.prototype.prepend,
        append:                 Element.prototype.append,
        before:                 Element.prototype.before,
        after:                  Element.prototype.after,
        replaceWith:            Element.prototype.replaceWith,
        remove:                 Element.prototype.remove
    },

    HTMLElement: {
        innerHTML:              Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML'),
        insertAdjacentElement:  HTMLElement.prototype.insertAdjacentElement
    }
};

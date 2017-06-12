import {log, patchPrototypeProperty, patchPrototypeMethod} from "./utility";

export default function patchElement(registry) {

    patchPrototypeProperty(Element, 'innerHTML', (nativeGetter, nativeSetter) => ({
        set: function (html) {
            if (this.isConnected) {
                for (let node = this.firstChild; node; node = node.nextSibling) {
                    registry.disconnectTree(node);
                }
                nativeSetter.call(this, html);
                for (let node = this.firstChild; node; node = node.nextSibling) {
                    registry.connectTree(node);
                }
            } else {
                nativeSetter.call(this, html);
            }
        }
    }));

    patchPrototypeMethod(Element, 'setAttribute', nativeSetAttribute => function (name, newValue) {
        if (name.charCodeAt(0) === 64) {
            let customAttributes = this[CUSTOM_ATTRIBUTES] || (this[CUSTOM_ATTRIBUTES] = {});
            let customAttribute = customAttributes[name] || customAttributes[name]
        } else {
            return nativeSetAttribute.call(this, name, newValue);
        }
    });
}

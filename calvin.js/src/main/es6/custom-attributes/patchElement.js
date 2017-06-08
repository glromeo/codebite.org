import {log, patchPrototypeProperty, patchPrototypeMethod} from "./utility";

export default function patchElement(registry) {

    patchPrototypeProperty(Element, 'innerHTML', (nativeGetter, nativeSetter) => ({
        set: function (html) {
            if (this.isConnected) {
                registry.disconnectTree(this);
                nativeSetter.call(this, html);
                registry.connectTree(this);
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

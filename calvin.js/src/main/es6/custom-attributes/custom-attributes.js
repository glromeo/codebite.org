import CustomAttributeRegistry from './custom-attribute-registry';

import patchDocument from './patch/patch-document';
import patchNode from './patch/patch-node';
import patchElement from './patch/patch-element';

if (!window['customAttributes']) {

    const registry = new CustomAttributeRegistry();

    Object.defineProperty(window, 'customAttributes', {
        configurable: true,
        enumerable: true,
        value: registry,
    });

    patchDocument(registry);
    patchNode(registry);
    patchElement(registry);
}

export default window['customAttributes'];

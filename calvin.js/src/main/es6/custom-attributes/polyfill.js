import CustomAttributeRegistry from './custom-attribute-registry';

import patchDocument from './patchDocument';
import patchNode from './patchNode';
import patchElement from './patchElement';

export const customAttributes = 'customAttributes';

if (!window.hasOwnProperty(customAttributes)) {

    const registry = new CustomAttributeRegistry();

    Object.defineProperty(window, customAttributes, {
        configurable: false,
        enumerable: true,
        value: registry,
    });

    patchDocument(registry);
    patchNode(registry);
    patchElement(registry);

    const body = document.querySelector('body');

    if (document.readyState === "interactive") {
        registry.upgradeTree(body);
        registry.connectTree(body);
    } else {
        const onreadystatechange = document.onreadystatechange;
        document.onreadystatechange = function () {
            if (document.readyState === "interactive") try {
                registry.upgradeTree(body);
                registry.connectTree(body);
            } catch (error) {
                throw new Error("unable to apply upgrade and connect to existing html content", error);
            } finally {
                document.onreadystatechange = onreadystatechange;
                document.onreadystatechange();
            }
        }
    }
}

export default window[customAttributes];

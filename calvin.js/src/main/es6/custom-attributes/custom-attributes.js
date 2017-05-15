import CustomAttributeInternals from './CustomAttributeInternals.js';
import CustomAttributeRegistry from './CustomAttributeRegistry.js';

import patchDocument from './patch/Document.js';
import patchNode from './patch/Node.js';
import patchElement from './patch/Element.js';

if (!window['customAttributes']) {

  const internals = new CustomAttributeInternals();

  patchDocument(internals);
  patchNode(internals);
  patchElement(internals);

  Object.defineProperty(window, 'customAttributes', {
    configurable: true,
    enumerable: true,
    value: new CustomAttributeRegistry(internals),
  });
}

export default window['customAttributes'];
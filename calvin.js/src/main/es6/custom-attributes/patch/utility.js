import {NATIVE_PROPERTIES, NATIVE_METHODS} from "../symbols";

export function patchPrototypeProperty(target, name, definitionFn) {

    const prototype = target.prototype;

    if (!prototype.hasOwnProperty(NATIVE_PROPERTIES)) {
        Object.defineProperty(prototype, NATIVE_PROPERTIES, {value: {}});
    }

    if (!prototype[NATIVE_PROPERTIES].hasOwnProperty(name)) {
        const native = prototype[NATIVE_PROPERTIES][name] = Object.getOwnPropertyDescriptor(prototype, name);
        return Object.defineProperty(prototype, name, Object.assign({}, native, definitionFn(native)));
    } else {
        console.warn(target.name || target, "is already patched");
    }
}

export function patchPrototypeMethod(target, name, definitionFn) {

    const prototype = target.prototype;

    if (!prototype.hasOwnProperty(NATIVE_METHODS)) {
        Object.defineProperty(prototype, NATIVE_METHODS, {value: {}});
    }

    if (!prototype[NATIVE_METHODS].hasOwnProperty(name)) {
        const native = prototype[NATIVE_METHODS][name] = prototype[name];
        return prototype[name] = definitionFn(native);
    } else {
        console.warn(target.name || target, "is already patched");
    }
}

export function log(name, ...extras) {
    if (this.closest && this.closest('.loggable')) {
        console.log("intercepted", name, this, ...extras);
    }
}

export function cloneTree(root, predicate) {
    const clone = root.cloneNode(true);
    const source = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
    const target = document.createTreeWalker(clone, NodeFilter.SHOW_ALL);
    while (source.nextNode()) {
        predicate(target.nextNode(), source.currentNode);
    }
    return clone;
}

/**
 -------------------------------------------------------
 Comparing {}, to new Object(), to new Proxy({}) in node
 -------------------------------------------------------
 programmatic clone with predicate callback	        x 278 ops/sec ±5.54% (43 runs sampled)
 cloneNode(true) then 2x threewalker visit	        x 377 ops/sec ±5.66% (42 runs sampled)
 cloneNode(true) then 2x threewalker visit (inline) x 367 ops/sec ±6.29% (43 runs sampled)
 --------------------------------------------------
 cloneNode(true) then 2x threewalker visit	 by 1x
 */
export function programmaticCloneTree(root, predicate) {

    let r = root;
    let c = r.cloneNode();
    let l = c;

    predicate(c, r);

    let x, t;
    do {
        if (x = r.firstChild) {
            r = x;
            do {
                t = x.cloneNode();
                predicate(t, x);
                l.appendChild(t);
            } while (x = x.nextSibling);
            l = l.firstChild;
        } else if (x = r.nextSibling) {
            r = x;
            l = l.nextSibling;
        } else while ((r = r.parentNode) && (l = l.parentNode)) if (x = r.nextSibling) {
            r = x;
            l = l.nextSibling;
            break;
        }

    } while (l);

    return c;
}
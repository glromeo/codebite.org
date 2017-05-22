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
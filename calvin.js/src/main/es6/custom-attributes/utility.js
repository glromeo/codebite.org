import {NATIVE} from "./symbols";

export function patchPrototypeProperty(target, name, patchFactory) {

    const prototype = target.prototype;

    if (!prototype.hasOwnProperty(NATIVE)) {
        Object.defineProperty(prototype, NATIVE, {value: {}});
    }

    if (!prototype[NATIVE].hasOwnProperty(name)) {
        const native = prototype[NATIVE][name] = Object.getOwnPropertyDescriptor(prototype, name);
        console.debug("%cpatched property: %c" + prototype.constructor.name + " %c" + name, "color: red", "color: green", "color: blue");
        return Object.defineProperty(prototype, name, Object.assign({}, native, patchFactory(native.get, native.set)));
    } else {
        console.warn(target.name || target, "is already patched");
    }
}

export function patchPrototypeMethod(target, name, patchFactory) {

    const prototype = target.prototype;

    if (!prototype.hasOwnProperty(NATIVE)) {
        Object.defineProperty(prototype, NATIVE, {value: {}});
    }

    if (!prototype[NATIVE].hasOwnProperty(name)) {
        const native = prototype[NATIVE][name] = prototype[name];
        console.debug("%cpatched method: %c" + prototype.constructor.name + " %c" + name, "color: red", "color: green", "color: blue");
        return prototype[name] = patchFactory(native);
    } else {
        console.warn(target.name || target, "is already patched");
    }
}

export function log(name, ...extras) {
    if (this.closest && this.closest('.loggable')) {
        console.log("intercepted", name, this, ...extras);
    }
}

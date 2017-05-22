export default class CustomAttributeRegistry {

    constructor() {
        this.definitions = new Map();
    }

    define(localName, constructor) {

        if (!(constructor instanceof Function)) {
            throw new TypeError("Custom attribute constructors must be functions.");
        }
        if (this.has(localName)) {
            throw new Error(`A custom attribute with name '${localName}' has already been defined.`);
        }

        return this.definitions.set(localName, constructor);
    }

    get(localName) {
        return this.definitions.get(localName);
    }

    has(localName) {
        return this.definitions.has(localName);
    }
}
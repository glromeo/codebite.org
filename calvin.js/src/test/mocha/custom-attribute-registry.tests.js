import CustomAttributeRegistry from "custom-attributes/custom-attribute-registry.js"

const {assert, expect} = chai;

describe('Custom Attribute Registry', function () {

    let registry = window.customAttributes;

    it('Global customAttributes', function () {
        assert.ok(registry, "customAttributes is defined");
        assert.ok(registry instanceof CustomAttributeRegistry, "customAttributes is an instance of the registry");
    });

    it('Custom Attribute Registry handling of definitions', function () {

        assert.ok(typeof registry.define === "function", "Custom Attribute Registry has define method");
        assert.ok(typeof registry.get === "function", "Custom Attribute Registry has get method");

        expect(() => registry.define("#1", null), "null fails type check").to.throw(TypeError);
        expect(() => registry.define("#2"), "undefined fails type check").to.throw(TypeError);
        expect(() => registry.define("#3", {}), "An object fails type check").to.throw(TypeError);

        let AttributeClass = class {};
        expect(() => registry.define("#4", AttributeClass), "A class pass type check").to.not.throw(TypeError);

        assert.ok(registry.has("#4"));
        assert.equal(registry.get("#4"), AttributeClass);

        expect(() => registry.define("#4", class {}), "Registry doesn't allow re-definitions").to.throw(Error);
    });
});
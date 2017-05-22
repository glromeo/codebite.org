import CustomAttributeRegistry from "custom-attributes/custom-attribute-registry.js"

const {assert, expect} = chai;

describe('Array', function () {
    it('should return -1 when the value is not present', function () {
        expect(1).to.equal(1);
    });
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1, 2, 3].indexOf(4));
        });
    });
});

describe('Custom Attributes', function () {

    const TEST_ATTR = 'test-attr';
    let testRootElement, elementWithCustomAttr;

    before(function () {

        console.log("before...");

        window.customAttributes.define(TEST_ATTR, class TestAttributeClass {

            constructor() {
                this.constructorInvoked = true;
            }

            connectedCallback() {
                this.connectedCallbackInvoked = true;
            }
        });

        elementWithCustomAttr = document.createElement('div');
        elementWithCustomAttr.setAttribute(TEST_ATTR, 'expression');
    });

    beforeEach(function () {
        console.log("before each...");
        testRootElement = document.createElement('div');
        testRootElement.setAttribute('class', 'test-root');
        document.querySelector('body').appendChild(testRootElement);
    });

    afterEach(function () {
        console.log("after each...");
        testRootElement.remove();
    });

    it('global customAttributes property', function () {
        assert.ok(window.customAttributes, "customAttributes is defined");
        assert.ok(window.customAttributes instanceof CustomAttributeRegistry, "customAttributes is an instance of the registry");
    });

    it('can access test root element', function () {
        assert.equal(document.querySelector('.test-root'), testRootElement);
    });

    it('element with custom attribute set on it has a instance of the class associated to it', function () {
        let elementAttributes = elementWithCustomAttr['[[CustomAttributes]]'];
        assert.ok(elementAttributes, 'element has custom attributes');
        let testAttr = elementAttributes.get(TEST_ATTR);
        assert.ok(testAttr instanceof window.customAttributes.get(TEST_ATTR), 'element has instance associated with it');
        assert.ok(testAttr.constructorInvoked, 'constructor has been invoked');
    });

    it('appending a child element with a customAttribute on it triggers its connectedCallback', function () {
        let testAttr = elementWithCustomAttr['[[CustomAttributes]]'].get(TEST_ATTR);
        assert.ok(testAttr.ownerElement === elementWithCustomAttr, 'attribute owner has been set by setAttribute');
        testRootElement.appendChild(elementWithCustomAttr);
        assert.ok(testAttr.connectedCallbackInvoked, 'connectedCallback has been invoked');
    });

});
import {CUSTOM_ATTRIBUTE, NATIVE_PROPERTIES} from "custom-attributes/symbols";
import CustomAttribute from "decorators/@CustomAttribute";
import Template from "decorators/@Template";

const {assert, expect} = chai;

describe('Custom Attribute Registry', function () {

    let registry = window.customAttributes;

    before(function () {
        registry.define("a-ca", class {});
    });

    function appendNewTestRootElement() {
        let testRootElement = document.createElement('div');
        testRootElement.setAttribute('class', 'test-root');
        testRootElement.style.cssText = "background-color: red; width: 100%; height: 50px;";
        document.querySelector('body').appendChild(testRootElement);
        return testRootElement;
    }

    it('Element patched', function () {
        assert.ok('innerHTML' in Element.prototype[NATIVE_PROPERTIES], 'innerHTML patched');
    });

    it('Element.innerHTML', function () {

        let testRootElement = appendNewTestRootElement();

        console.log("set");

        testRootElement.innerHTML = '<div><div for-each="item in items" if-true="item.accepted" a-ca="xyz"></div></div>';

        let outer = testRootElement.querySelector('div');
        let inner = outer.querySelector('div');

        assert.ok(false);

        testRootElement.remove();
    });

    it('when a node is cloned the custom attribute chain is cloned as well', function () {
        assert.ok(false);
    });

});
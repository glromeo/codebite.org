import {CustomElement} from "decorators/@CustomElement";
import {PaperElement} from "calvin/custom-elements";
const {assert, expect} = chai;

describe('Nested Custom Elements', function () {

    @CustomElement
    class OuterElement extends PaperElement {

        constructor() {
            super();
            this.transcluded = document.createDocumentFragment();
        }

        connectedCallback() {

            console.log("outer", "connectedCallback begin");

            for (const child of this.children) {
                this.removeChild(child);
                this.transcluded.appendChild(child);
            }

            console.log("outer", "connectedCallback end");
        }
    }

    @CustomElement
    class InnerElement extends PaperElement {

        constructor() {
            super();
            this.transcluded = document.createDocumentFragment();
        }

        connectedCallback() {

            console.log("inner", "connectedCallback begin");

            for (const child of this.children) {
                this.removeChild(child);
                this.transcluded.appendChild(child);
            }

            console.log("inner", "connectedCallback end");
        }
    }

    @CustomElement
    class LeafElement extends PaperElement {

        constructor() {
            super();
        }
    }

    function appendNewTestRootElement() {
        let testRootElement = document.createElement('div');
        testRootElement.setAttribute('class', 'test-root');
        testRootElement.style.cssText = "background-color: red; width: 100%; height: 50px;";
        document.querySelector('body').appendChild(testRootElement);
        return testRootElement;
    }

    it('calls the connectedCallback of the outer only', function () {

        let testRootElement = appendNewTestRootElement();

        testRootElement.innerHTML = `
<div>
    <outer-element>
        <div>
            <inner-element>
                <leaf-element></leaf-element>
            </inner-element>
        </div>
    </outer-element>
</div>`;

        assert.ok(testRootElement.querySelector('outer-element'), "has outer");
        assert.ok(!testRootElement.querySelector('inner-element'), "but not inner");

        testRootElement.remove();
    });

});
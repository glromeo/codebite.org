import {CustomElement} from "../decorators/@CustomElement";
import {Linker} from "./linker";
import {PaperElement} from "./paper-element";
import {createScope} from "./scope";
import {Transclude} from "../decorators/@Transclude";

const debug = true;

@CustomElement
export class PaperReport extends PaperElement {

    constructor() {
        super();
    }

    connectedCallback() {

        super.connectedCallback();

        const $scope = {
            report: {
                chapters: [
                    [{pag: 1}, {pag: 2}, {pag: 3}],
                    [{pag: 4}, {pag: 5}, {pag: 6}],
                    [{pag: 7}, {pag: 8}, {pag: 9}]
                ]
            }
        };

        for (let script of this.querySelectorAll('script')) {
            console.log("script:", script);
            new Function("window", "$", script.innerText).call($scope, window, $);
        }

        createScope(this, $scope);
    }

    readyCallback() {
        console.log("all children are now ready");
    }
}

@CustomElement
export class ReportPage extends PaperElement {
    constructor() {
        super();
    }

    connectedCallback() {
        if (this.hasOwnProperty('$scope')) {
            Object.assign(this.$scope, {page: {}});
        } else {
            createScope(this, {page: {}});
        }
        super.connectedCallback().then(() => {
            for (const attr of this.attributes) if (attr.name[0] !== '@') {
                this.$scope.page[attr.name] = attr.value;
            }
        });
    }
}

@CustomElement
export class PageHeader extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
export class PageBody extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
export class PageFooter extends PaperElement {
    constructor() {
        super();
    }
}

@CustomElement
@Transclude
export class ForEach extends PaperElement {

    constructor() {
        super();

        console.log("stripping the elements...");

    }

    render($scope) {

        let fragment = document.createDocumentFragment();

        let alias = this.getAttribute("item");
        let expression = this.getAttribute("in");

        let create = (items) => {

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.transclude($scope.$new({
                        [alias]: item,
                        "index": index
                    })));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.transclude($scope.$new({
                        [alias]: items[key],
                        "index": key
                    })));
                });
            }

            this.appendChild(fragment);
        };

        let update = (items) => {

            while (this.lastChild) this.removeChild(this.lastChild);

            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    fragment.appendChild(this.transclude($scope.$new({
                        [alias]: item,
                        "index": index
                    })));
                });
            } else if (items) {
                Object.keys(items).forEach((key) => {
                    fragment.appendChild(this.transclude($scope.$new({
                        [alias]: items[key],
                        "index": key
                    })));
                });
            }

            this.appendChild(fragment);
        };

        return $scope.$watch(expression, function (items, {path, to, from}) {
            console.log("changed: (", JSON.stringify(to), "<-", JSON.stringify(from), ")");
            update(items);
        }).then(create).catch(reason => {
            console.error(reason);
        });
    }
}

function createPlaceholder(prefix = ' ', suffix = ' ') {
    let outerHTML = this.outerHTML;
    let start = outerHTML.indexOf('<') + 1;
    let end = outerHTML.indexOf('>', start);
    return document.createComment(prefix + outerHTML.substring(start, end) + suffix);
}
import {before} from "../decorators/@before";
import {after} from "../decorators/@after";
import {CustomElement} from "../decorators/@CustomElement";
import {Scope} from "../decorators/@Scope";
import {Transclude} from "../decorators/@Transclude";
import {PaperElement} from "./paper-element";

const debug = true;

@CustomElement
@Scope({
    report: {
        chapters: [
            [{pag: 1}, {pag: 2}, {pag: 3}],
            [{pag: 4}, {pag: 5}, {pag: 6}],
            [{pag: 7}, {pag: 8}, {pag: 9}]
        ]
    }
})
export class PaperReport extends PaperElement {

    constructor() {
        super();
    }

    @before("link")
    executeScripts($scope) {
        for (let script of this.querySelectorAll('script')) {
            console.log("script:", script);
            new Function("window", "$", script.innerText).call($scope, window, $);
        }
    }

    readyCallback() {
        console.log("all children are now ready");
    }
}

@CustomElement
@Scope({page: {}})
export class ReportPage extends PaperElement {
    constructor() {
        super();
    }

    @after("link")
    assignAttributes($scope) {
        this.ready.then(() => {
            for (const attr of this.attributes) if (attr.name[0] !== '@') {
                $scope.page[attr.name] = attr.value;
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
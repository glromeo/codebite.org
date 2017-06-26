import {compile} from "../calvin/compiler";

export function Transclude(options) {

    if (options instanceof Function) {

        const prototype = options.prototype;

        prototype.compile = (compile => function transclude() {

            this.content = document.createDocumentFragment();

            while (this.firstChild) this.content.appendChild(this.firstChild);

            compile.apply(this);

        })(prototype.compile);

        prototype.transclude = function ($scope) {

            let clone = this.content.cloneNode(true);
            for (let child = clone.firstChild; child; child = child.nextSibling) child.$scope = $scope;

            const link = compile(clone);

            link($scope);

            return clone;
        };

    } else {

        const slots = Object.create(options);

        return function (target) {

            const prototype = target.prototype;

            prototype.compile = (compile => function transclude() {

                this.content = document.createDocumentFragment();

                for (let key of Object.keys(slots)) {
                    this.content.appendChild(slots[key] = this.querySelector(slots[key]));
                }
                for (let child = this.firstChild; child; child = this.firstChild) this.removeChild(child);

                compile.apply(this);

            })(prototype.compile);

            prototype.transclude = function ($scope, slot) {

                let clone;
                if (slot) {
                    clone = slots[slot].cloneNode(true);
                    clone.$scope = $scope;
                } else {
                    clone = this.content.cloneNode(true);
                    for (let child = clone.firstChild; child; child = child.nextSibling) child.$scope = $scope;
                }

                const link = compile(clone);

                link($scope);

                return clone;
            };
        }
    }
}
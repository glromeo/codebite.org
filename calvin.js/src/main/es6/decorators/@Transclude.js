import {Linker} from "calvin/linker";

const ALL_WHITESPACES = /^\s+$/g;

export function Transclude(options) {

    if (options instanceof Function) {
        const target = options;

        target['@Transclude'] = function () {
            let child;
            if (this.firstChild) {
                this.content = document.createDocumentFragment();
                while (child = this.firstChild) {
                    this.content.appendChild(child);
                }
            }
        };

        target.prototype.transclude = function ($scope) {

            const linker = new Linker($scope);

            let clone = this.content.cloneNode(true);
            for (let child = clone.firstChild; child; child = child.nextSibling) child.$scope = $scope;

            linker.link(clone);

            return clone;
        };

    } else {
        const slots = Object.create(options);

        return function (target) {

            target['@Transclude'] = function () {
                this.content = document.createDocumentFragment();
                for (let key of Object.keys(slots)) {
                    this.content.appendChild(slots[key] = this.querySelector(slots[key]));
                }
                for (let child = this.firstChild; child; child = this.firstChild) this.removeChild(child);
            };

            target.prototype.transclude = function ($scope, slot) {

                const linker = new Linker($scope);

                let clone;
                if (slot) {
                    clone = slots[slot].cloneNode(true);
                    clone.$scope = $scope;
                } else {
                    clone = this.content.cloneNode(true);
                    for (let child = clone.firstChild; child; child = child.nextSibling) child.$scope = $scope;
                }

                linker.link(clone);

                return clone;
            };
        }
    }
}
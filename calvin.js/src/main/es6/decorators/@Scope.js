export function Scope(initial, isolated) {

    return function (target) {

        target.prototype.assignScope = function () {
            const parent = this.findProperty("$scope");
            this.$scope = parent.$new(initial, isolated);
        };
    }
}
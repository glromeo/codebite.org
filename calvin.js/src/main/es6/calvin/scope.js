import {ObservableRootHandler} from "./observe-notify";
import {closest} from "./utility";

let scopeIdSequence = 0;

export function createScope(element, assign, isolated) {
    if (element.$scope) {
        throw new Error("element has already a $scope associated with it");
    }
    let parent = closest("$scope", element, closest => closest.$scope.$self);

    let scope = isolated || !parent ? {} : Object.create(parent);
    Object.assign(scope, assign, {
        $id: scopeIdSequence++,
        $self: scope,
        $parent: parent,
        $element: element
    });

    function path(scope) {
        if (scope.$parent) {
            return path(scope.$parent) + ">" + scope.$element.tagName;
        } else {
            return scope.$element.tagName;
        }
    }

    element.$scope = new Proxy(scope, new ObservableRootHandler(path(scope) + "[$scope:" + scope.$id + "]"));

    return function destroyScope() {
        throw "Not implemented yet!";
    }
}
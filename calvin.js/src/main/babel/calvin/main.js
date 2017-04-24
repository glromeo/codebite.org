import "calvin/custom-elements";
import {ObservableRootHandler} from "./observe-notify";
import {closest, visitTree} from "./utility";

const debug = false;

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

export function bootstrap(rootElement) {

    createScope(rootElement, {}, true);

    const cleanUpObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            let nodesToCleanUp = [];
            mutation.removedNodes.forEach(root => visitTree(root, node => {
                if (node.cleanUpCallback) {
                    nodesToCleanUp.push(node);
                }
            }));
            setTimeout(() => {
                nodesToCleanUp.forEach(node => node.cleanUpCallback());
            });
        });
    });

    cleanUpObserver.observe(document.querySelector('body'), {childList: true, subtree: true});

    console.log("bootstrap completed");
}

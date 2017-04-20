import {closest} from "./utility";

export function Scope($scope) {
    return function (target) {
        target.$scope = $scope;
    }
}


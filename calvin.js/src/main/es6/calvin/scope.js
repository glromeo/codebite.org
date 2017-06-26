import {ObservableHandler, Watcher} from "./observe-notify";
let scopeIdSequence = 0;

window.$scope = function(selector) {
    "use strict";
    return document.querySelector(selector).findProperty("$scope");
}

export const WATCHED_EXPRESSIONS = '[[WatchedExpressions]]';

class Handler extends ObservableHandler {

    constructor(label) {
        super();
        this.path = () => {
            return label;
        }
    }

    $eval(expression) {
        return jexl.eval(expression, this);
    }

    $watch(expression, callback) {
        const watcher = this.getWatcher(expression);
        watcher.addIfNotPresent(callback);
        return watcher.promise;
    }

    getWatcher(expression) {
        const watchers = this.watchers;
        let watcher = watchers.get(expression);
        if (watcher === undefined) {
            watchers.set(expression, watcher = new Watcher(this, expression));
        }
        return watcher;
    }

    get watchers() {
        return this[WATCHED_EXPRESSIONS] || (this[WATCHED_EXPRESSIONS] = new Map());
    }
}

let lastScopeId = 0;

export class Scope {

    constructor(initial, parent, isolated) {

        let scope = !parent ? initial : Object.assign(isolated ? {} : Object.create(parent), initial);
        let handler = new Handler("[$scope:" + scope.$id + "]");

        Object.assign(handler, {
            $id: lastScopeId++,
            $target: scope,
            $handler: handler,
            $parent: parent,
            $new(initial, isolated) {
                return new Scope(initial, this.$target, isolated);
            }
        });

        return new Proxy(scope, handler);
    }
}
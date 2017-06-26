import jexl from "jexl";

const debug = true;

jexl.addBinaryOp('union', 0, function (left, right) {
    return left.concat(right);
});

class FieldChange {
    constructor(index, to, from) {
        this.what = index;
        this.to = to;
        this.from = from;
        this.toString = () => {
            return "[" + index + "] (" + JSON.stringify(from) + "->" + JSON.stringify(to) + ")";
        };
    }
}

class PropertyChange {
    constructor(property, to, from) {
        this.what = property;
        this.to = to;
        this.from = from;
        this.toString = () => {
            return "." + property + " :: (" + JSON.stringify(from) + "->" + JSON.stringify(to) + ")";
        };
    }
}

function getPropertyHandler(property) {
    return this.handlers[property] || (this.handlers[property] = new ObservableHandler(this, property));
}

const WATCHERS = "[[Watchers]]";

export class ObservableHandler {

    constructor(parent, property) {
        const handler = this;
        this.$get = function (property) {
            return handler[property];
        }
        this[WATCHERS] = new Set();
        this.path = () => {
            return parent.path() + ">" + property;
        }
    }

    $notifyWatchers(change) {
        for (let watcher of this[WATCHERS]) try {
            console.log("notifying:", watcher.expression, "changed:", this.path() + change.toString());
            watcher.notify(this.path() + ">" + change.what, change);
        } catch (e) {
            console.error("error while notifying listener", e);
        }
    }

    get(target, property) {
        let local = this[property];
        if (local !== undefined) {
            return local;
        } else {
            let value = target[property];
            if (value && typeof value === "object" && property[0] !== '$') {
                return this[property] = new Proxy(value, new ObservableHandler(this, property));
            } else {
                return value;
            }
        }
    }

    set(target, property, value) {
        if (this[property] !== undefined) {
            this[property] = value;
            return true;
        }
        if (this[WATCHERS].size) {
            if (debug) {
                if (Array.isArray(target) && !isNaN(property)) {
                    console.debug("set:", this.path() + "[" + property + "]", "=", value);
                } else {
                    console.debug("set:", this.path() + "." + property, "=", value);
                }
            }
            if (Array.isArray(target) && !isNaN(property)) {
                this.$notifyWatchers(new FieldChange(property, value, target[property]));
            } else {
                this.$notifyWatchers(new PropertyChange(property, value, target[property]));
            }
        }
        target[property] = value;
        return true;
    }
}

export const WATCHED_EXPRESSIONS = '[[WatchedExpressions]]';

let uniqueId = 0;

export class Watcher {

    constructor(scope, expression) {
        this.scope = scope;
        this.expression = expression;
        this.callbacks = [];
        this.promise = jexl.eval(this.expression, new Proxy(this.scope, this));
        this.promise.cancel = () => {
            this.cancel();
        }
    }

    cancel() {
        this.action = 'delete';
        return jexl.eval(this.expression, new Proxy(this.scope, this));
    }

    /**
     * ProxyHandler set method
     *
     * @param target
     * @param property
     * @returns {boolean}
     */
    set(target, property) {
        console.error("denied access to:", property);
        return false;
    }

    /**
     * ProxyHandler get method
     *
     * @param target
     * @param property
     * @returns {*}
     */
    get(target, property) {
        if (target[WATCHERS]) {
            if (this.promise === undefined) {
                target[WATCHERS].add(this);
            } else {
                target[WATCHERS].delete(this);
            }
        }
        let value = target[property];
        if (value && typeof value === "object" && property[0] !== '$') {
            return new Proxy(value, this);
        } else {
            return value;
        }
    }

    notify(path) {
        jexl.eval(this.expression, this.scope.$target).then(result => {
            const callbacks = this.callbacks;
            let i = callbacks.length;
            while (--i >= 0) {
                callbacks[i](result, {path});
            }
        }).catch(error => setTimeout(() => {
            console.error("an error has occurred while notifying a change in:", this.expression);
            throw error;
        }));
    }

    addIfNotPresent(callback) {
        if (!this.callbacks.includes(callback)) this.callbacks.push(callback);
    }
}

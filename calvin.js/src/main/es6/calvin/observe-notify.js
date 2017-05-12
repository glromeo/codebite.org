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

let LISTENERS = "[[Listeners]]";
let PROXY = "[[Proxy]]";

class ObservableHandler {

    constructor(parent, property) {
        this[LISTENERS] = new Set();
        this.path = () => {
            return parent.path() + ">" + property;
        }
    }

    $notify(change) {
        for (let listener of this[LISTENERS]) try {
            console.log("notifying:", this.path() + change.toString());
            listener(this.path() + ">" + change.what, change);
        } catch (e) {
            console.error("error while notifying listener", e);
        }
    }

    get(target, property) {
        let local = this[property];
        if (local !== undefined) {
            return local;
        } else {
            return target[property];
        }
    }

    set(target, property, value) {
        if (value === PROXY) {
            if (debug) {
                if (Array.isArray(target) && !isNaN(property)) {
                    console.debug("get:", this.path() + "[" + property + "]  => new proxy");
                } else {
                    console.debug("get:", this.path() + "." + property + " => new proxy");
                }
            }
            this[property] = new Proxy(target[property], new ObservableHandler(this, property));
            return true;
        }
        if (this[LISTENERS].size) {
            if (debug) {
                if (Array.isArray(target) && !isNaN(property)) {
                    console.debug("set:", this.path() + "[" + property + "]", "=", value);
                } else {
                    console.debug("set:", this.path() + "." + property, "=", value);
                }
            }
            if (Array.isArray(target) && !isNaN(property)) {
                this.$notify(new FieldChange(property, value, target[property]));
            } else {
                this.$notify(new PropertyChange(property, value, target[property]));
            }
        }
        target[property] = value;
        return true;
    }
}

export class ObservableRootHandler extends ObservableHandler {

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

        console.log("watching:", this.path(), this);

        class WatchingHandler {

            set(target, property, value) {
                console.error("denied access to:", target, property);
                return false;
            }

            get(target, property) {

                let value = this[property];
                if (value !== undefined) {
                    return value;
                }

                if (target[LISTENERS]) {
                    target[LISTENERS].add(callback);
                }

                value = target[property];
                if (value && typeof value === "object") {
                    if (value[LISTENERS] === undefined) {
                        target[property] = PROXY;
                    }
                    return this[property] = new Proxy(target[property], new WatchingHandler());
                } else {
                    return this[property] = value;
                }
            }
        }

        let promise = jexl.eval(expression, new Proxy(this, new WatchingHandler()));

        promise.cancel = () => {
            (function unwatch(watchers) {
                let handlers = this.handlers;
                for (let property of Object.keys(watchers)) {
                    let handler = handlers[property];
                    if (handler === undefined) {
                        continue;
                    }
                    let listeners = handler.listeners;
                    delete listeners[listeners.indexOf(callback)];
                    let w = watchers[property];
                    if (w && typeof w === "object") {
                        unwatch(w);
                    }
                }
            })(watchers);
        };

        return promise;
    }
}

const debug = true;

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

function getHandler(property) {
    return this.handlers[property] || (this.handlers[property] = new ObservableHandler(this, property));
}

class ObservableHandler {

    constructor(parent, property) {
        this.listeners = [];
        this.handlers = {};
        this.path = () => {
            return parent.path() + ">" + property;
        }
    }

    notify(change) {
        for (let listener of this.listeners) try {
            console.log("notifying:", this.path() + change.toString());
            listener(this.path() + ">" + change.what, change);
        } catch (e) {
            console.error("error while notifying listener", e);
        }
    }

    get(target, property) {
        let value = target[property];
        let handler = this.handlers[property];
        if (handler) {
            if (value[Symbol.for("observable")]) {
                if (debug) {
                    if (Array.isArray(target) && !isNaN(property)) {
                        console.debug("get:", this.path() + "[" + property + "] => cached proxy");
                    } else {
                        console.debug("get:", this.path() + "." + property + " => cached proxy");
                    }
                }
                return value;
            } else {
                value[Symbol.for("observable")] = true;
                if (debug) {
                    if (Array.isArray(target) && !isNaN(property)) {
                        console.debug("get:", this.path() + "[" + property + "]  => new proxy");
                    } else {
                        console.debug("get:", this.path() + "." + property + " => new proxy");
                    }
                }
                return target[property] = new Proxy(value, handler);
            }
        }
        return value;
    }

    set(target, property, value, receiver) {
        if (this.listeners.length) {
            if (debug) {
                if (Array.isArray(target) && !isNaN(property)) {
                    console.debug("set:", this.path() + "[" + property + "]", "=", value);
                } else {
                    console.debug("set:", this.path() + "." + property, "=", value);
                }
            }
            if (Array.isArray(target) && !isNaN(property)) {
                this.notify(new FieldChange(property, value, target[property]));
            } else {
                this.notify(new PropertyChange(property, value, target[property]));
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

    $watch(watchers) {

        (function watch(watchers) {
            for (let property of Object.keys(watchers)) {
                let handler = getHandler.call(this, property);
                let w = watchers[property];
                if (w instanceof Function) {
                    handler.listeners.push(w);
                } else if (w instanceof Object) {
                    watch.call(handler, w);
                }
            }
        }).call(this, watchers);

        console.log("watching:", this.path(), this);

        return () => {
            (function unwatch(watchers) {
                let handlers = this.handlers;
                for (let property of Object.keys(watchers)) {
                    let handler = handlers[property];
                    if (handler === undefined) {
                        continue;
                    }
                    let w = watchers[property];
                    if (w instanceof Function) {
                        let listeners = handler.listeners;
                        delete listeners[listeners.indexOf(w)];
                    } else if (w instanceof Object) {
                        unwatch(w);
                    }
                }
            })(watchers);
        }
    }

    record() {

    }

    get(target, property) {
        return this[property] || super.get(target, property);
    }
}

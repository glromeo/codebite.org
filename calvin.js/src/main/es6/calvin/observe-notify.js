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
            let value = target[property];
            if (value && typeof value === "object" && property[0] !== '$') {
                return this[property] = new Proxy(value, new ObservableHandler(this, property));
            } else {
                return value;
            }
        }
    }

    set(target, property, value) {
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

        let $scope = this.$self;

        function notify(path) {
            jexl.eval(expression, $scope).then(items => callback(items, {path})).catch(error => {
                console.error(error);
            });
        }

        let watchHandler = {
            set(target, property) {
                console.error("denied access to:", property);
                return false;
            },
            get(target, property) {
                if (target[LISTENERS]) {
                    target[LISTENERS].add(notify);
                }
                let value = target[property];
                if (value && typeof value === "object" && property[0] !== '$') {
                    return new Proxy(value, watchHandler);
                } else {
                    return value;
                }
            }
        };

        let promise = jexl.eval(expression, new Proxy(this, watchHandler));

        promise.cancel = () => {

            let cancelHandler = {
                get(target, property) {
                    if (target[LISTENERS]) {
                        target[LISTENERS].delete(callback);
                    }
                    let value = target[property];
                    if (value && typeof value === "object" && property[0] !== '$') {
                        return new Proxy(value, cancelHandler);
                    } else {
                        return value;
                    }
                }
            };

            return jexl.eval(expression, new Proxy(this, cancelHandler));
        };

        return promise;
    }
}
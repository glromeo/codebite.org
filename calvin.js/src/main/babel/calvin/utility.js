'use strict';

var DASH_REGEX = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g;
var REVERSE_REGEX = /-[a-z\u00E0-\u00F6\u00F8-\u00FE]/g;

export function dashCase(str) {
    return str.replace(DASH_REGEX, function (match) {
        return '-' + match.toLowerCase();
    });
};

export function camelCase(str) {
    return str.replace(REVERSE_REGEX, function (match) {
        return match.slice(1).toUpperCase();
    });
};

export function closest(name, fromNode, callback) {
    do {
        if (fromNode[name]) {
            return callback ? callback(fromNode) : fromNode[name];
        }
        fromNode = fromNode.parentElement;

    } while (fromNode);
}

export function visitTree(root, callback) {
    if (!root) {
        return;
    }
    for (let child = root.firstChild; child; child = child.nextSibling) {
        let recurse = callback(child) !== false;
        if (recurse) {
            visitTree(child, callback);
        }
    }
}

export function appendCallback(target, methodName, callback) {
    let delegate = target[methodName];
    if (delegate) {
        target[methodName] = function () {
            delegate.call(this);
            callback.call(this);
        }
    } else {
        target[methodName] = callback;
    }
}

class LoggingProxyHandler {

    constructor(name) {
        this.name = name;
    }

    get(target, property) {
        if (target.hasOwnProperty(property)) {
            console.log("get:", this.name, "[", property, "]");
            let value = target[property];
            return typeof value === 'object' ? new Proxy(value, new LoggingProxyHandler(this.name + " > " + property)) : value;
        } else {
            return target[property];
        }
    }

    set(target, property, value, receiver) {
        console.log("set:", this.name, "[", property, "]");
        target[property] = value;
        return true;
    }
}

import "./custom-elements";
import {visitTree} from "../decorators/utility";

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

export function bootstrap(rootElement) {

    rootElement.$scope = (function $newScope(content, level) {
        console.debug("new scope:", level, content);
        let target = Object.assign({
            $id: level,
            $new(ext) {
                return $newScope(Object.assign(Object.create(target), ext), level + 1);
            }
        }, content);
        return new Proxy(target, new LoggingProxyHandler("$scope:" + level));
    })({}, 0);

    var cleanUpObserver = new MutationObserver(function (mutations) {
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

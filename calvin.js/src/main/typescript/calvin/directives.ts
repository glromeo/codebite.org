import {Linkable, makeLinkable} from "calvin/compile";
import {Context} from "calvin/bootstrap";

export interface Directive {
    transclude?: any;
    compile(target: Element, transclude?: Node & Linkable);
}

export class ComponentDirective implements Directive {

    compile(target: Element) {

    }
}

export class AttributeDirective implements Directive {

    compile(target: Element) {

    }
}

function directiveUrl(directiveName: string) {
    return "/jellybeans/directives/" + directiveName.toLowerCase();
}

export class LazyDirective implements Directive {

    private promise: Promise<Directive>;

    constructor(directiveName: string) {
        this.promise = SystemJS.import(directiveUrl(directiveName)).then<Directive>(exports => {
            return exports.default;
        })
    }

    compile(element: Element) {
        let promise = this.promise.then(function (directive: Directive) {
            return directive.compile(element)
        })
        return makeLinkable.call(element, function lazyLink(context: Context) {
            promise.then(function (compiled) {
                compiled.$link(context);
            })
        })
    }
}

export class DirectiveRegistry {

    private isReady: Promise<boolean>;
    private directives: {[key: string]: Directive}

    register<T extends Element|Attr>(name: string, directive: Directive) {
        this.directives[name] = directive;
    }

    lookup<T extends Element|Attr>(name: string): Directive {
        let directive = this.directives[name];
        if (directive) {
            return directive;
        } else {
            return new LazyDirective(name);
        }
    }
}

export const Directives: DirectiveRegistry = new DirectiveRegistry();
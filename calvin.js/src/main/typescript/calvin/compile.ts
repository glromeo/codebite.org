import {Context} from "calvin/bootstrap";
import {Directives} from "calvin/directives";

export function Compile(node: Node) {

    return new Promise<Linkable>(function (resolve) {
        compileNode(node);
        resolve(<Linkable>node);
    });
}

let compileNode = (function () {

    let compileFn = [];

    compileFn[Node.COMMENT_NODE] = compileComment;
    compileFn[Node.TEXT_NODE] = compileTextNode;
    compileFn[Node.ELEMENT_NODE] = compileElement;

    return function (node: Node): Node & Linkable {
        console.debug("compile", node.nodeName);
        return compileFn[node.nodeType](node);
    }
})();


export interface Linkable extends Node {
    $link(context: Context): Linkable
}

export function makeLinkable<T>($linkFn: (context: Context)=>any): T & Linkable {
    this.$link = $linkFn;
    return <T & Linkable> this;
}

export interface CompiledExpression<T> {
    (context: Context): T;
}

function compileExpression<T>(text: string): CompiledExpression<T|string> {
    if (!text) {
        return;
    }
    let expr = text.trim();
    let tokens = [];
    let mark = 0;
    let begin = expr.indexOf('{{');
    while (begin >= 0) {
        let end = expr.indexOf('}}', begin);
        if (begin > mark) tokens.push(expr.substring(mark, begin));
        tokens.push(new Function('context', '{ with (context) { return ' + expr.substring(begin + 2, end) + ' } }'));
        mark = end + 2;
        begin = expr.indexOf('{{', mark);
    }
    if (mark > 0) {
        if (mark < text.length) {
            tokens.push(expr.substring(mark));
        }
        return tokens.length ? function (context: Context) {
            let result = '';
            for (let t = 0, length = tokens.length; t < length; t++) {
                let token = tokens[t];
                result += typeof token === "string" ? token : token(context);
            }
            return result;
        } : tokens[0]
    } else return context => expr;
}

/**
 *
 * @param comment
 * @returns {Comment&Linkable}
 */
function compileComment(comment: Comment): Node & Linkable {

    let text = comment.nodeValue;

    if (text && text.indexOf('{{') >= 0) {

        let $text = compileExpression(text.trim());

        return makeLinkable.call(comment, function linkTextNode(context: Context) {
            let nodeValue = $text(context);
            if (nodeValue) {
                this.nodeValue = nodeValue;
            }
            console.log("linked #comment", this);
        });
    }
}

/**
 *
 * @param textNode
 * @returns {Text&Linkable}
 */
function compileTextNode(textNode: Text): Node & Linkable {

    let wholeText = textNode.wholeText;

    if (wholeText && wholeText.indexOf('{{') >= 0) {

        let $textContent = compileExpression(wholeText.trim());
        textNode.textContent = '...';

        let parentElement = textNode.parentElement;
        if (parentElement) {
            let sibling;
            while (isTextNode(sibling = textNode.previousSibling)) {
                parentElement.removeChild(sibling);
            }
            while (isTextNode(sibling = textNode.nextSibling)) {
                parentElement.removeChild(sibling);
            }
        }

        return makeLinkable.call(textNode, function linkTextNode(context: Context) {
            this.textContent = $textContent(context);
            console.log("linked #text", this);
        });
    }
}

function isTextNode(node) {
    return node && node.nodeType === Node.TEXT_NODE;
}

/**
 *
 * @param element
 */
function compileElement(element: Element): Node & Linkable {

    let child = element.firstChild, first = {$next: null}, last = first;
    while (child) {
        let next = compileNode(child);
        if (next) {
            last.$next = next;
            last = last.$next;
        }
        child = child.nextSibling;
    }

    let compiled = first.$next ? makeLinkable.call(element, function linkNode(context: Context) {
        console.log("link element", this);
        let $child = first.$next;
        while ($child) {
            console.log("link child", $child);
            $child.$link(context);
            $child = $child.$next;
        }
        console.log("linked children");
    }) : element;

    let tagName = element.tagName;
    if (isDirective(tagName)) {
        let directive = Directives.lookup(tagName);
        let transclude = directive.compile(element);
        if (transclude) {
            compiled = transclude;
        }
    }

    let attributes = element.attributes;
    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        let attrName = attr.name;
        if (isDirective(attrName.toUpperCase())) {
            let directive = Directives.lookup(attrName);
            let transclude = directive.compile(element);
            if (transclude) {
                compiled = transclude;
            }
        }
    }

    if (compiled.$link) {
        return compiled;
    }
}

function isDirective(tagName: string) {
    return tagName.indexOf('PDF-') === 0;
}

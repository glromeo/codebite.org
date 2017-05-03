@annotation
class MyClass { }

function annotation(target) {
    target.annotated = true;
}

@isTestable(true)
class MyOtherClass { }

export function isTestable(value) {
    return function decorator(target) {
        target.isTestable = value;
    }
}

export default class C {
    @enumerable(false)
    method() { }
}

export function enumerable(value) {
    return function (target, key, descriptor) {
        descriptor.enumerable = value;
        return descriptor;
    }
}

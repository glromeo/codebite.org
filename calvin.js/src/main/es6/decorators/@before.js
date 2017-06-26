export function before(pointcut) {
    return function (target, aspect) {
        target[pointcut] = ((before, method) => function () {
            before.apply(this, arguments);
            return method.apply(this, arguments);
        })(target[aspect], target[pointcut]);
    }
}
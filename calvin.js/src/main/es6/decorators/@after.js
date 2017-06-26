export function after(pointcut) {
    return function (target, aspect) {
        target[pointcut] = ((after, method) => function () {
            const result = method.apply(this, arguments);
            after.apply(this, arguments);
            return result;
        })(target[aspect], target[pointcut]);
    }
}
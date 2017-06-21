export function Scope(options) {

    if (options instanceof Function) {

        const target = options;
        target['@Scope'] = true;

    } else return function (target) {

        target['@Scope'] = options;
    }
}
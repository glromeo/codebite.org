
export function Template(what) {
    return function (target) {
        target['@Template'] = what;
    }
}

export default function (what) {
    return function (target) {
        target['@Template'] = what;
    }
}
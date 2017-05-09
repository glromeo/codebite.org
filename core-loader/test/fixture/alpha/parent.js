import _ from "lodash";
import child from "child";

export default function () {
    return child.snakeCase("HELLO") + ' ' + _.camelCase("w-o-r-l-d");
}
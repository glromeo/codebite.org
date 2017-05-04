import {baseURI, fileUrlToPath, pathToFileUrl} from "es-module-loader/core/common.js";
import {ModuleNamespace} from "es-module-loader/core/loader-polyfill.js";
import RegisterLoader from "es-module-loader/core/register-loader.js";
import {resolveIfNotPlain} from "es-module-loader/core/resolve.js";

export {
    baseURI, fileUrlToPath, pathToFileUrl,
    ModuleNamespace,
    RegisterLoader,
    resolveIfNotPlain
}
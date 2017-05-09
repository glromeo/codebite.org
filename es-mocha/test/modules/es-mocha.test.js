import assert from "assert";
import hi from "hello";
import _ from "lodash";

describe("integration with simple-module-loader", function () {
    it("it resolves module 'hello'", function () {
        assert.ok(typeof hi === "function", "hi is a function");
        assert.equal(_.camelCase("Hello-world"), "helloWorld", "I can use lodash");
    })
})
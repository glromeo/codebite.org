import assert from "assert";
import path from "path";
import fs from "fs";

function Named(name) {
    return function (target) {
        target['@name'] = name;
    }
}

@Named('name')
class NamedClass {

}

describe('Mocha', function () {
   describe('current path', function () {
       it('should point to the package root', function () {
           assert.equal("/Users/Gianluca/Workbench/Workspace/codebite.org/calvin.js", path.resolve("."));
       })
       it('should contain package.json', function () {
           assert.equal(true, fs.statSync(path.resolve("./package.json")).isFile());
       })
   })
});

describe('Array', function(){
    describe('#indexOf()', function(){
        it('should return -1 when the value is not present', function(){
            assert.equal(-1, [1,2,3].indexOf(4)); // 4 is not present in this array so indexOf returns -1
        })
    })
});

describe('@Named', function () {
    it('should have a constructor property @Named with value "name"', function () {
        let n = new NamedClass();
        assert.equal("name", n.constructor['@name']);
    })
});
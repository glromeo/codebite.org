'use strict'

const Benchmark = require('benchmark')

const suite = new Benchmark.Suite

const o = { x: 123 }

const p = new Proxy({ x: 123 }, {
    get(target, name) {
        return target[name]
    }
})

console.log('-------------------------------------------------------')
console.log('Comparing {}, to new Object(), to new Proxy({}) in node')
console.log('-------------------------------------------------------')

suite.add('{}\t', function() {
    for (let i=0; i<100; i++) {
        o["y"+i] = o.x += 1;
    }
}).add('Proxy\t', function() {
    for (let i=0; i<100; i++) {
        p["y"+i] = p.x += 1;
    }
}).on('cycle', function(event) {
    console.log(String(event.target))
}).on('complete', function() {
    const faster = this.filter('fastest')[0]
    const slower = this.filter('slowest')[0]
    console.log('--------------------------------------------------')
    console.log(`${faster.name} by ${Math.round(faster.hz / slower.hz)}x`)
})
// run async
    .run({ 'async': true })
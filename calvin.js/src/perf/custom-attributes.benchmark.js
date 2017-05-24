export function benchmark() {

    const suite = new Benchmark.Suite;

    const body = document.querySelector('body');

    const predicate = function (clone, node) {
        clone['[[CA]]'] = node['[[CA]]'] = Math.random();
    };

    console.log('-------------------------------------------------------')
    console.log('Comparing {}, to new Object(), to new Proxy({}) in node')
    console.log('-------------------------------------------------------')

    suite.add('programmatic clone with predicate callback\t', function () {
        try {
            for (let i = 0; i < 100; i++) {
                let cloneOfBody = window.customAttributes.programmaticCloneTree(body, predicate);
                cloneOfBody[i] = i;
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('cloneNode(true) then 2x threewalker visit\t', function () {
        try {
            for (let i = 0; i < 100; i++) {
                let cloneOfBody = window.customAttributes.cloneTree(body, predicate);
                cloneOfBody[i] = i;
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('stupidity\t', function () {
        try {
            for (let i = 0; i < 100; i++) {
                let cloneOfBody = window.customAttributes.cloneTree2(body);
                cloneOfBody[i] = i;
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).on('cycle', function (event) {
        console.log(String(event.target))
    }).on('complete', function () {
        const faster = this.filter('fastest')[0]
        const slower = this.filter('slowest')[0]
        console.log('--------------------------------------------------')
        console.log(`${faster.name} by ${Math.round(faster.hz / slower.hz)}x`)
    }).run({'async': true})

}
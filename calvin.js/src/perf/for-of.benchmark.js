export function benchmark() {

    const suite = new Benchmark.Suite;

    const body = document.querySelector('body');

    let root = document.createElement('div');
    body.appendChild(root);

    let ready = new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://getbootstrap.com/components/');
        xhr.send(null);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.status);
                }
            }
        }
    });

    function visitTreeWalker(root, predicate) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        predicate(root);
        while (walker.nextNode()) {
            predicate(walker.currentNode);
        }
    }

    suite.add('for of\t', function () {
        try {
            let c = 0;
            visitTreeWalker(root, n => {
                for (let a of n.attributes) {
                    c++;
                }
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('for in\t', function () {
        try {
            let c = 0;
            visitTreeWalker(root, n => {
                for (let a in n.attributes) {
                    c++;
                }
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('for var\t', function () {
        try {
            let c = 0;
            visitTreeWalker(root, n => {
                const attributes = n.attributes;
                for (let i = 0, length = attributes.length; i < length; i++) {
                    let a = attributes[i];
                    c++;
                }
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('for var\t', function () {
        try {
            let c = 0;
            visitTreeWalker(root, n => {
                Array.from(n.attributes).forEach(a => c++);
            });
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
        console.log(`${faster.name} by ${Math.round(100 * faster.hz / slower.hz) / 100}x`)
    });

    ready.then(responseText => {

        root.innerHTML = responseText;

        suite.run({'async': true})
    });

}
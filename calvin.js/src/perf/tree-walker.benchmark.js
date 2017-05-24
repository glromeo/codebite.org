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
            } else {
                console.log(xhr.readyState);
            }
        }
    });

    let p1 = 0, p2 = 0, p3 = 0;

    function visitRecursive(node, predicate) {
        let n;
        if (n = node.firstChild) {
            if (n.nodeType === Node.ELEMENT_NODE) {
                visitRecursive(n, predicate);
            }
            while (n = n.nextSibling) if (n.nodeType === Node.ELEMENT_NODE) {
                visitRecursive(n, predicate);
            }
        }
        predicate(node);
    }

    function visitIterative(root, predicate) {
        let v = root, x;
        predicate(v);
        main: do {
            while (x = v.firstChild) {
                v = x;
                if (v.nodeType === Node.ELEMENT_NODE) predicate(v);
            }
            while (x = v.nextSibling) {
                v = x;
                if (v.nodeType === Node.ELEMENT_NODE) {
                    predicate(v);
                    continue main;
                }
            }
            while (v = v.parentNode) while (x = v.nextSibling) {
                v = x;
                if (x.nodeType === Node.ELEMENT_NODE) {
                    predicate(v);
                    continue main;
                }
            }
        } while (v);
    }

    function visitTreeWalker(root, predicate) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        predicate(root);
        while (walker.nextNode()) {
            predicate(walker.currentNode);
        }
    }

    suite.add('recursive visit\t', function () {
        try {
            let c = 0;
            visitRecursive(root, n => n['count'] = c++);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('iterative visit\t', function () {
        try {
            let c = 0;
            visitIterative(root, n => n['count'] = c++);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('treewalker visit\t', function () {
        try {
            let c = 0;
            visitTreeWalker(root, n => n['count'] = c++);
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

        visitRecursive(root, n => p1++);
        console.log('predicate 1 count:', p1);

        visitIterative(root, n => p2++);
        console.log('predicate 2 count:', p2);

        visitTreeWalker(root, n => p3++);
        console.log('predicate 3 count:', p3);


        suite.run({'async': true})
    });

}
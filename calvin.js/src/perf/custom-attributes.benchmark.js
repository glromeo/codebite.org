export function benchmark() {

    const suite = new Benchmark.Suite;

    const body = document.querySelector('body');

    const predicate = function (clone, node) {
        clone['[[CA]]'] = node['[[CA]]'] = Math.random();
    };

    function programmaticCloneTree(root, predicate) {

        let r = root;
        let c = r.cloneNode();
        let l = c;

        predicate(c, r);

        let x, t;
        do {
            if (x = r.firstChild) {
                r = x;
                do {
                    t = x.cloneNode();
                    predicate(t, x);
                    l.appendChild(t);
                } while (x = x.nextSibling);
                l = l.firstChild;
            } else if (x = r.nextSibling) {
                r = x;
                l = l.nextSibling;
            } else while ((r = r.parentNode) && (l = l.parentNode)) if (x = r.nextSibling) {
                r = x;
                l = l.nextSibling;
                break;
            }

        } while (l);

        return c;
    }

    function nodeCloneThenUseTwoTreeWalkers() {

        const clone = root.cloneNode(true);

        const sourceTreeWalker = document.createTreeWalker(root, NodeFilter.SHOW_PROCESSING_INSTRUCTION);
        const targetTreeWalker = document.createTreeWalker(clone, NodeFilter.SHOW_PROCESSING_INSTRUCTION);

        let sourceNode = sourceTreeWalker.currentNode,
            targetNode = targetTreeWalker.currentNode;

        while (targetNode) {
            const customAttribute = sourceNode[CUSTOM_ATTRIBUTE];
            if (customAttribute) {
                Object.defineProperty(targetNode, CUSTOM_ATTRIBUTE, {
                    value: customAttribute
                });
                targetNode[CUSTOM_ATTRIBUTE].targetNode = targetNode;
            }
            sourceNode = sourceTreeWalker.nextNode();
            targetNode = targetTreeWalker.nextNode();
        }
        return clone;
    }

    suite.add('programmatic clone with predicate callback\t', function () {
        try {
            for (let i = 0; i < 100; i++) {
                let cloneOfBody = programmaticCloneTree(body, predicate);
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
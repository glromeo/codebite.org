export function benchmark() {

    const suite = new Benchmark.Suite;

    const body = document.querySelector('body');

    function populateTrees(cases, depth, callbacks) {

        if (depth < 0) {
            return;
        }

        const childrenCount = Math.floor(Math.random() * 10);

        for (let i = 0; i < childrenCount; i++) {

            let nodeType = Math.round(Math.random() * 3);
            let nodes = cases.map(r => {
                let e = document.createElement([
                    'div',
                    'p',
                    'section',
                    'span'
                ][nodeType]);
                e.setAttribute('number', i);
                r.appendChild(e);
                return e;
            });

            if (Math.floor(Math.random() * 5) > 1) {
                populateTrees(nodes, depth - 1, callbacks);
            }

            if (Math.floor(Math.random() * 10) > 3) {
                nodes.forEach(n => n.appendChild(document.createComment('passive comment')));
            }

            if (Math.floor(Math.random() * 5) > 2) {
                nodes.forEach((n, j) => n.appendChild(callbacks[j](i)));
            }
        }
    }

    let commentCaseRoot = document.createElement('div');
    commentCaseRoot.setAttribute('type', 'comment');
    let processingInstructionCaseRoot = document.createElement('div');
    processingInstructionCaseRoot.setAttribute('type', 'pi');
    populateTrees([
        commentCaseRoot,
        processingInstructionCaseRoot
    ], 10, [
        function (i) {
            const comment = document.createComment('active comment #' + i);
            comment['IS_ACTIVE'] = true;
            return comment;
        }, function (i) {
            return document.createProcessingInstruction('pi:' + i, i);
        }
    ]);
    body.appendChild(commentCaseRoot);
    console.log("populated: comment");
    body.appendChild(processingInstructionCaseRoot);
    console.log("populated: processing instruction");

    function visit(root, filter, predicate) {
        const walker = document.createTreeWalker(root, filter);
        predicate(root);
        while (walker.nextNode()) {
            predicate(walker.currentNode);
        }
    }

    suite.add('SHOW_COMMENT\t', function () {
        try {
            let c = 0;
            visit(commentCaseRoot, NodeFilter.SHOW_COMMENT, n => {
                if (n['IS_ACTIVE']) {
                    c++
                }
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }).add('SHOW_PROCESSING_INSTRUCTION\t', function () {
        try {
            let c = 0;
            visit(processingInstructionCaseRoot, NodeFilter.SHOW_PROCESSING_INSTRUCTION, n => {
                c++;
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

    suite.run({'async': true});
}
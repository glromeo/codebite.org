SystemJS.config({
    baseURL: '/node_modules',
    map: {
        "calvin": "/babel/calvin",
        "decorators": "/babel/decorators",
        "custom-attributes": "/babel/custom-attributes",
        "mocha": "/mocha"
    },
    packages: {
        'calvin': {
            main: 'main.js',
            format: 'system',
            defaultExtension: 'js'
        },
        'decorators': {
            format: 'system',
            defaultExtension: 'js'
        },
        'custom-attributes': {
            format: 'system',
            defaultExtension: 'js'
        },
        'mocha': {
            format: 'system',
            defaultExtension: 'js'
        }
    },
    packageConfigPaths: [
        '/node_modules/*/package.json'
    ]
});
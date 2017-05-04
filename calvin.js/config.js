SystemJS.config({
    baseURL: '/node_modules',
    map: {
        "calvin": "/target/lib/calvin",
        "decorators": "/target/lib/decorators"
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
        }
    },
    packageConfigPaths: [
        '/node_modules/*/package.json'
    ]
});
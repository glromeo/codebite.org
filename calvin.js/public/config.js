SystemJS.config({
    baseURL: '/node_modules',
    map: {
        "calvin": "/babel/calvin",
        "decorators": "/babel/decorators"
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
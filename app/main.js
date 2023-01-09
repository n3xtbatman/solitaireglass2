requirejs.config({
    packages: ['view', 'Solitaire', 'UI', 'stats'],
    urlArgs: 'bust=' + (new Date()).getTime(),
    waitSeconds: 0,

    map: {
        '*': {
            'Q': 'vendor/q',
            'EventEmitter': 'vendor/EventEmitter.min',
            'postal': 'vendor/postal.min',
            'underscore': 'vendor/lodash.underscore',
            'i18n': 'vendor/require-plugins/i18n',
            'image': 'vendor/require-plugins/image',
            'text': 'vendor/require-plugins/text',
            'images': 'images'
        }
    },

    skipDirOptimize: true,

    dir: '../build',
    name: "main",
    exclude: ["nls/solitaire.js", "nls/es/solitaire.js", "nls/template/solitaire.js"]
});
;(function() {

define(
[
    'UI',
    'view',
    'stats'
],

function(UI, View) {
    'use strict';
    return function Solitaire(options) {
        UI.initialize(options);
    }
});
})();
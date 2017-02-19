(function () {
    'use strict';
    
    angular.module('rocket', [
        /*
         * Angular modules
         */
        'ngTouch',
        'ngCookies',
        'ngAnimate',
        /*
         * 3rd Party modules
         */
        'ui.router',
        'pascalprecht.translate',
        'satellizer',
        'angular-growl',
        'ngDialog',
        'wu.masonry',
        '720kb.datepicker',
        /*
         * rocket modules
         */
        'rocket',
        'rocket.filters'
    ]);
    
})();
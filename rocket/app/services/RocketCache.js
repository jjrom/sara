(function() {

    'use strict';

    /* Services */
    angular.module('rocket')
            .factory('rocketCache', ['$cacheFactory', rocketCache]);
    function rocketCache($cacheFactory) {
        return $cacheFactory('myCache');
    };

})();
(function() {

    'use strict';

    angular.module('rocket')
            .factory('rocketMap', [rocketMap]);

    function rocketMap() {
        return new window.rocketmap.Map();
    }

})();

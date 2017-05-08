
angular.module('rocketMapModule',[])
        .factory('rocketMap', rocketMap);

    function rocketMap() {
        return new window.rocketmap.Map();
    }


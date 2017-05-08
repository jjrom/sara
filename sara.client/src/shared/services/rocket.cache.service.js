angular.module('rocketCacheServiceModule', [])
    .factory("rocketCache", rocketCacheFactory);




rocketCacheFactory.$inject = ["$cacheFactory"];

 function rocketCacheFactory($cacheFactory){
    return $cacheFactory('myCache');
}



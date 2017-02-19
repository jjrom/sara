(function () {
    'use strict';

    angular.module('rocket')
            .controller('ProfileController', ['$scope', 'restoUsersAPI', 'rocketServices', ProfileController]);

    function ProfileController($scope, restoUsersAPI, rocketServices) {
        
        /*
         * Get profile
         */
        $scope.profile = rocketServices.getProfile();
        
        /**
         * Download orderId
         * 
         * @param {String} orderId
         */
        $scope.downloadOrder = function(orderId) {
            rocketServices.download(rocketServices.getMetalinkUrl({
                userid:$scope.profile.userid,
                orderId:orderId
            }));
        };
        
        restoUsersAPI.getOrders({
            userid:$scope.profile.userid
        },
        function (result) {
            $scope.orders = result.orders;
        },
        function (result) {
            rocketServices.error('profile.orders.error');
        });
        
    }

})();
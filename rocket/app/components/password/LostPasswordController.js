(function () {
    'use strict';

    angular.module('rocket')
            .controller('LostPasswordController', ['$scope', 'rocketServices', 'restoUsersAPI', LostPasswordController]);

    function LostPasswordController($scope, rocketServices, restoUsersAPI) {

        $scope.lostPassword = function () {
            restoUsersAPI.lostPassword({
                email: $scope.email
            },
            function(result){
                rocketServices.success('lostPassword.success');
            },
            function(error){
                rocketServices.error('lostPassword.error');
            });
        };
        
    }
    
})();

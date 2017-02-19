(function () {
    'use strict';

    angular.module('rocket')
            .controller('RegisterController', ['$scope', 'rocketServices', 'restoUsersAPI', RegisterController]);

    function RegisterController($scope, rocketServices, restoUsersAPI) {
        $scope.registration = {};
        $scope.signup = function () {
            restoUsersAPI.signup($scope.registration,
            function(result) {
                rocketServices.go('home', null, {
                    reload:true
                });
                rocketServices.success('register.success');
            },
            function(result){
                rocketServices.error('error' + result.ErrorCode);
            });
        };
        
        /*
         * Focus on username
         */
        rocketServices.focus('username');
        
    }
})();
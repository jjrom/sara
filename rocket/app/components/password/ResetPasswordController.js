(function () {
    'use strict';

    angular.module('rocket')
            .controller('ResetPasswordController', ['$scope', '$state', '$location', 'rocketServices', 'restoUsersAPI', ResetPasswordController]);

    function ResetPasswordController($scope, $state, $location, rocketServices, restoUsersAPI) {

        $scope.resetPassword = function () {
            restoUsersAPI.resetPassword({
                url: $location.absUrl(),
                email:$state.params['email'],
                password: $scope.password
            },
            function(result){
                rocketServices.go('home', null,{
                    reload:true
                });
            },
            function(error){
                rocketServices.success('resetPassword.error');
            });
        };
        
    }
    
})();

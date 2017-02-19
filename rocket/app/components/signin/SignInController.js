(function () {
    'use strict';

    angular.module('rocket')
            .controller('SignInController', ['$rootScope', '$scope', 'restoUsersAPI', 'rocketServices', SignInController]);

    function SignInController($rootScope, $scope, restoUsersAPI, rocketServices) {
        $scope.login = function () {
            restoUsersAPI.login({
                email: $scope.email,
                password: $scope.password
            },
            function(result) {
                rocketServices.go($rootScope.previousState.name, $rootScope.previousState.params, {
                    reload:true
                });
                rocketServices.success('signin.login.success');
            },
            function(result) {
                rocketServices.error('signin.login.error');
            });
        };
        $scope.authenticate = function (provider) {
            restoUsersAPI.authenticate(provider, function(){
                rocketServices.go($rootScope.previousState.name, $rootScope.previousState.params, {
                    reload:true
                });
                rocketServices.success('signin.login.success');
            },
            function(){
                rocketServices.error('signin.login.error');
            });
        };
        
        /*
         * Focus on email
         */
        rocketServices.focus('email');
        
    }

})();
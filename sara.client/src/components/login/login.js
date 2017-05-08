 angular.module('app.component.login',[])
            .directive('login', loginDirective);

    function loginDirective(){
        return {
            restrict : "EA",
            controller : loginController,
            controllerAS : "loginCtrl",
            templateUrl :"components/login/login.html"
        };

    }


    loginController.$inject = ['$scope','$rootScope', 'restoUsersAPI', 'rocketServices'];

    function loginController($scope,$rootScope, restoUsersAPI, rocketServices) {
        var self = this;

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
                console.debug('error of login',result);
                rocketServices.error('signin.login.error');
            });
        };

        /*
         * Focus on email
         */
        rocketServices.focus('email');
        
    }

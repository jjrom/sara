 angular.module('app.component.login',[])
            .directive('login', loginDirective);

    function loginDirective(){
        return {
            restrict : "E",
            controller : loginController,
            controllerAS : "loginCtrl",
            templateUrl :"components/login/login.html"
        };

    }


    loginController.$inject = ['$rootScope', 'restoUsersAPI', 'rocketServices'];

    function loginController($rootScope, restoUsersAPI, rocketServices) {
        var self = this;

        self.login = function () {
            restoUsersAPI.login({
                email: self.email,
                password: self.password
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
        self.authenticate = function (provider) {
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

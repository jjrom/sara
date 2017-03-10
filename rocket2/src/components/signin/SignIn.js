 angular.module('app.component.sign.in')
            .directive('signIn', signInDirective);

    signInDirective = function () {
        return {
            restrict : "E",
            controller : signInController,
            controllerAS : "signInCtrl",
            templateUrl :"components/signin/signIn.html"
        };

    };


    signInController.$inject = ['$rootScope', 'restoUsersAPI', 'rocketServices'];

    function signInController($rootScope, restoUsersAPI, rocketServices) {
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

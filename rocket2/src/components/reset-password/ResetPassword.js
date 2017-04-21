 angular.module('app.components.reset.password',[])
            .directive('resetPassword',resetPasswordDirective);

 function resetPasswordDirective(){
        return {
            restrict : "E",
            controller : resetPasswordController,
            controllerAS : "resetPW",
            templateUrl : "components/reset-password/resetPassword.html"
        };

    }

    resetPasswordController.$inject = ['$state', '$location', 'rocketServices', 'restoUsersAPI'];

    function resetPasswordController($state, $location, rocketServices, restoUsersAPI) {

        var self = this;

        self.resetPassword = function () {
            restoUsersAPI.resetPassword({
                url: $location.absUrl(),
                email:$state.params.email,
                password: self.password
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


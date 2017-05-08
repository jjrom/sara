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

    resetPasswordController.$inject = ['$scope','$state', '$location', 'rocketServices', 'restoUsersAPI'];

    function resetPasswordController($scope, $state, $location, rocketServices, restoUsersAPI) {

        var self = this;

        $scope.email = rocketServices.decode_base64($state.params.encodedEmail);

        $scope.resetPassword = function () {
            restoUsersAPI.resetPassword({
                    url: $location.absUrl(),
                    email: $scope.email,
                    password: $scope.password
                },
                function(result){
                    rocketServices.success('resetPassword.success');
                    rocketServices.go('home', null, {
                        reload:true
                    });
                },
                function(error){
                    rocketServices.success('resetPassword.error');
                });
        };
        
    }


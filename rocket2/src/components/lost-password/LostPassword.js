 angular.module('app.components.lost.password',[])
            .directive('lostPassword',lostPasswordDirective);


 function lostPasswordDirective () {
     return {
         restrict : "E",
         controller : lostPasswordController,
         controllerAs : "lostPW",
         templateUrl : "components/lost-password/lostPassword.html"
     };
 }

    lostPasswordController.$inject = ['$scope','rocketServices', 'restoUsersAPI'];

    function lostPasswordController($scope,rocketServices, restoUsersAPI) {

        var self = this;
        $scope.lostPassword = function () {
            restoUsersAPI.lostPassword({
                email: $scope.email
            },
            function(result){
                console.debug("result of lost password",result);

                rocketServices.showGrowl(result.message);
            },
            function(error){
                rocketServices.error('lostPassword.error');
            });
        };
        
    }


 angular.module('app.components.lost.password',[])
            .directive('lostPassword',lostPasswordDirective);


 function lostPasswordDirective () {
     return {
         restrict : "E",
         controller : lostPasswordController,
         controllerAs : "lostPW",
         templateUrl : "components/lost.password/lostPassword.html"
     };
 }

    lostPasswordController.$inject = ['rocketServices', 'restoUsersAPI'];

    function lostPasswordController(rocketServices, restoUsersAPI) {

        var self = this;
        self.lostPassword = function () {
            restoUsersAPI.lostPassword({
                email: self.email
            },
            function(result){
                rocketServices.success('lostPassword.success');
            },
            function(error){
                rocketServices.error('lostPassword.error');
            });
        };
        
    }


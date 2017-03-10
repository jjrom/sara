 angular.module('app.component.register',[])
            .directive('register', registerDirective);


    function registerDirective(){
     return {
         restrict : "E",
         controller : registerController,
         controllerAs : "registerCtrl",
         templateUrl : "components/register/register.html"
     };

 }

 registerController.$inject = ['$scope', 'rocketServices', 'restoUsersAPI'];

    function registerController($scope, rocketServices, restoUsersAPI) {
        var self = this;
        self.registration = {};
        self.signup = function () {
            restoUsersAPI.signup(self.registration,
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

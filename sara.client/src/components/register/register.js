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

        $scope.topics = {
            intended : "",
            domain : ""
        };

        $scope.otherTopics ={
            domainOther : "",
            intendedOther : ""
        };

        // Object to bind all the form fields
        $scope.registration = {};

        $scope.signup = function () {

            if($scope.topics.intended === 'Other' && $scope.topics.domain === 'Other'){
                $scope.registration.topics = $scope.otherTopics.intendedOther+'|'+$scope.otherTopics.domainOther;
            }
            else if($scope.topics.intended === 'Other' && $scope.topics.domain !== 'Other'){
                $scope.registration.topics = $scope.otherTopics.intendedOther+'|'+$scope.topics.domain;
            } else if($scope.topics.intended !== 'Other' && $scope.topics.domain === 'Other'){
                $scope.registration.topics = $scope.topics.intended+'|'+$scope.otherTopics.domainOther;
            }
            else {
                $scope.registration.topics = $scope.topics.intended+'|'+$scope.topics.domain;
            }

            restoUsersAPI.signup($scope.registration,
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

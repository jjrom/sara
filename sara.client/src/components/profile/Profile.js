 angular.module('app.components.profile',[])
            .directive('profile',profileDirective);

    function profileDirective (){
        return {
            restrict : "E",
            controller : profileController,
            controllerAS : "profileCtrl",
            templateUrl : "components/profile/profile.html"
        };
    }

    profileController.$inject = ['$scope', 'restoUsersAPI', 'rocketServices'];

    function profileController($scope, restoUsersAPI, rocketServices) {
        
        /*
         * Get profile
         */
        var self = this;

        $scope.profile = rocketServices.getProfile();
        
        /**
         * Download orderId
         * 
         * @param {String} orderId
         */
        $scope.downloadOrder = function(orderId) {
            rocketServices.download(rocketServices.getMetalinkUrl({
                userid : $scope.profile.userid,
                orderId: orderId
            }));
        };
        
        restoUsersAPI.getOrders({
            userid : $scope.profile.userid
        },
        function (result) {
            $scope.orders = result.orders;
        },
        function (result) {
            rocketServices.error('profile.orders.error');
        });
        
    }

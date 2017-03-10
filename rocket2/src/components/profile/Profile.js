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

        self.profile = rocketServices.getProfile();
        
        /**
         * Download orderId
         * 
         * @param {String} orderId
         */
        self.downloadOrder = function(orderId) {
            rocketServices.download(rocketServices.getMetalinkUrl({
                userid : self.profile.userid,
                orderId:orderId
            }));
        };
        
        restoUsersAPI.getOrders({
            userid : self.profile.userid
        },
        function (result) {
            self.orders = result.orders;
        },
        function (result) {
            rocketServices.error('profile.orders.error');
        });
        
    }

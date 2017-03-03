
angular.module('restoCartAPIModule',['rocketServicesModule'])
        .factory('restoCartAPI',restoCartAPI);

restoCartAPI.$inject = ['$http', 'rocketServices'];
    function restoCartAPI($http, rocketServices) {

        var api = {
            add: add,
            get: get,
            remove:remove,
            placeOrder:placeOrder
        };

        return api;

        /////////

        /*
         * Add item to the user cart
         *
         * @param {array} params
         * @param {function} callback
         * @param {function} error
         */
        function add(params, callback, error) {
            $http({
                url: rocketServices.restoEndPoint() + '/users/' + params.userid + '/cart' + (params.clear ? '?_clear=1' : ''),
                method: 'POST',
                data: params.items,
                async:params.hasOwnProperty('async') ? params.async : true
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Remove item from the user cart
         *
         * @param {array} params
         *          {string} : featureid
         *          {string} : userid
         * @param {function} callback
         * @param {function} error
         */
        function remove(params, callback, error) {
            $http({
                url: rocketServices.restoEndPoint() + '/users/' + params.userid + '/cart/' + params.featureid,
                method: 'DELETE'
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Get cart content
         *
         * @param {Array} params
         *          {string} : userid
         * @param {Function} callback
         * @param {Function} error
         */
        function get(params, callback, error) {
            $http({
                url: rocketServices.restoEndPoint() + '/users/' + params.userid + '/cart',
                method: 'GET'
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /*
         * Place order
         *
         * @param {Object} params
         * @param {Function} success
         * @param {Function} error
         */
        function placeOrder(params, success, error) {
            $http({
                url: rocketServices.restoEndPoint() + '/users/' + params.userid + '/orders' + (params.fromCart ? '?_fromCart=1' : ''),
                method: 'POST',
                data: params.items || null
            })
                .success(function(result) {
                    success(result);
                })
                .error(function(result) {
                    error(result);
                });
        }

    }

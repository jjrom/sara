angular.module('app.components.main',['restoFeatureAPIModule','rocketServicesModule','rocketCartModule','restoUsersAPIModule','rocketCacheServiceModule'])
    .directive('main',mainDirective);


    mainDirective = function () {
        return {
            restrict : "E",
            controller : mainController,
            controllerAs : 'mainDirective'
        };

    };

mainController.$inject= ['$rootScope', '$scope', 'restoFeatureAPI', 'rocketServices', 'rocketCart', 'restoUsersAPI', 'rocketCache'];

function mainController($rootScope, $scope, restoFeatureAPI, rocketServices, rocketCart, restoUsersAPI, rocketCache) {

            var vm = this;

            $scope.showmenu = false;

            /*
             * Refresh authentication token during startup
             */
            restoUsersAPI.refreshToken();

            /*
             * Store previous state to redirect after
             * successfull sigin
             */
            $rootScope.previousState = {};
            $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
                $rootScope.previousState = {
                    name: from.name || 'home',
                    params: fromParams || {}
                };
            });

            /**
             * Check if user is authenticated
             */
            vm.isAuthenticated = function () {
                return rocketServices.isAuthenticated();
            };

            /*
             * Disconnect user
             */
            vm.logout = function () {

                /*
                 * Save cart THEN disconnect
                 */
                restoUsersAPI.disconnect(function () {
                        rocketServices.go('home', null, {
                            reload: true
                        });
                    },
                    function () {
                        rocketServices.error('logout.error');
                    });
            };

            /*
             * Toggle menu for mobile
             */
            vm.toggleLeftMenu = function () {
                $scope.showmenu = !$scope.showmenu;
            };

            /*
             * Return true if left menu is visible
             */
            vm.leftMenuIsVisible = function () {
                return $scope.showmenu;
            };

            /**
             * Add a feature to cart
             *
             * @param {Object} feature
             * @param {Object} $event
             */
            vm.addToCart = function (feature, $event) {

                rocketCart.add(feature,
                    function (data) {
                        rocketServices.success(data ? data : 'cart.add.success');
                    },
                    function () {
                        rocketServices.success('cart.add.error');
                    });

                $event.stopPropagation();
            };

            /**
             * Add multiple items to Cart
             *
             * Set checkLicense true for checking license of the first item.
             *
             * @param {array} features
             * @param {boolean} checkLicense
             * @param {Object} $event
             */
            vm.addMultipleToCart = function (features, checkLicense, $event) {



                function addMultipleToCart() {
                    vm.addMultipleToCart(features, false, $event);
                }

                function error() {
                    rocketServices.error('cart.add.error');
                }

                function success (msg) {
                    rocketServices.success(msg);
                }

                for (var i = 0, len = features.length; i < len; i++) {
                    var feature = features[i];
                    if (checkLicense) {
                        restoFeatureAPI.ckeckLicense(feature, addMultipleToCart, error);
                        $event.stopPropagation();
                        break;
                    } else {
                        rocketCart.add(feature,success('cart.add.success'), success('cart.add.error'));
                    }
                }
            };

            /**
             * Download feature
             *
             * @param {Object} feature
             * @param {Object} $event
             */
            vm.download = function (feature, $event) {
                restoFeatureAPI.download(feature);
                $event.stopPropagation();
            };

            /*
             * Return user picture
             *
             * @param {integer} size
             */
            vm.userPicture = function (size) {
                var profile = rocketServices.getProfile();
                return '//www.gravatar.com/avatar/' + (profile.userhash || '') + '?d=mm' + (size ? '&s=' + size : '');
            };

            vm.userMail = function () {
                var profile = rocketServices.getProfile();
                return profile.email;
            };

            /**
             * Search function
             *
             * @param {String} key
             * @param {String} value
             *
             */
            vm.search = function (key, value) {
                var params = {};
                if (key) {
                    params[key] = value;
                }
                rocketCache.remove('lastSearch');
                rocketServices.go('search', params);
            };





}
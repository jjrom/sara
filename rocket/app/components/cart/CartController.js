(function() {
    'use strict';

    angular.module('rocket')
            .controller('CartController', ['$scope', 'ngDialog', 'config', 'rocketCart', 'rocketServices', 'restoUsersAPI', CartController]);

    function CartController($scope, ngDialog, config, rocketCart, rocketServices, restoUsersAPI) {

        $scope.content = rocketCart.getContent();

        /*
         * Switch to feature view
         * 
         * @param {String} collectionName
         * @param {String} featureIdentifier
         */
        $scope.view = function(collectionName, id) {
            rocketServices.go('feature', {
                collectionName: collectionName,
                featureId: id
            }, {
                reload: true
            });
        };

        /**
         * Remove a feature from cart
         * 
         * @param {Object} feature
         */
        $scope.removeFromCart = function(feature) {
            rocketCart.remove(feature,
                    function() {
                        $scope.content = rocketCart.getCartContent();
                        rocketServices.success('cart.remove.success');
                    },
                    function() {
                        rocketServices.success('cart.remove.error');
                    });
        };

        /*
         * Checkout cart content
         */
        $scope.checkout = function() {

            rocketCart.download(function(data) {
                $scope.processDownload(data.order.orderId, data.order.items, data.order.errors);
            }, function() {
                rocketServices.error('cart.checkout.error');
            });

        };

        /**
         * Process download
         * 
         * @param {array} items
         * @param {array} errors
         * @returns {undefined}
         */
        $scope.processDownload = function(orderId, items, errors) {
            if (errors.length > 0) {
                /*
                 * process errors
                 */
                $scope.undownloadableItems = errors;
                $scope.downloadableItems = items;
                $scope.orderId = orderId;

            } else if (items.length > 0) {
                /*
                 * download items
                 */
                $scope.downloadableItems = items;
                $scope.orderId = orderId;
                $scope.downloadOrder(orderId);
            } else {
                /*
                 * error
                 */
            }
        };

        /**
         * Get license url in good language
         * 
         * @param {array} licenseDescription
         * @returns {licenseDescription.lang.url}
         */
        $scope.getLicenseUrl = function(licenseDescription) {
            var lang = rocketServices.getLang();
            if (licenseDescription[lang]) {
                return licenseDescription[lang]['url'];
            } else if (licenseDescription['en']) {
                return licenseDescription['en']['url'];
            } else {
                return null;
            }

        };

        /**
         * Sign license
         * 
         * @param {string} licenseId
         * @param {string} licenseUrl
         * @returns {undefined}
         */
        $scope.signLicense = function(licenseId, licenseUrl) {
            
            
            ngDialog.openConfirm({
                            controller: 'licenseController',
                            templateUrl: "app/components/features/license.html",
                            data:{
                                collectionName:licenseId,
                                licenseUrl:licenseUrl
                            }
                        })
                        .then(
                            function() {
                                /*
                                * Send a license signature to server
                                */
                                restoUsersAPI.signLicense(licenseId, function() {
                                    rocketServices.success('cart.signatures.success');
                                    $scope.checkout();
                                }, function() {
                                    rocketServices.error('cart.signatures.error');
                                }
                            )},
                            /*
                             * Canceled - do nothing
                             */
                            function() {}
                        );
        };

        /**
         * Download order
         * 
         * @returns {undefined}
         */
        $scope.downloadOrder = function() {
            if ($scope.orderId && $scope.downloadableItems) {
                var url = config.restoServerUrl + 'user/orders/' + $scope.orderId + '.meta4';
                rocketServices.success('cart.download.start');
                rocketServices.download(url);

                /*
                 * Clean cart and scope
                 */
                $scope.intelligentCleanup($scope.downloadableItems);
            } else {
                rocketServices.error('cart.download.error.empty');
            }
        };

        /**
         * Intelligent clean up
         * 
         * @param {array} items
         * @returns {undefined}
         */
        $scope.intelligentCleanup = function(items) {
            /*
             * Clear cart
             */
            var nb_deletedItems = rocketCart.intelligentClear(items);

            /*
             * Clear scope
             */
            $scope.undownloadableItems = null;
            $scope.downloadableItems = null;
            $scope.orderId = null;

            /*
             * Get cart content
             */
            $scope.content = rocketCart.getContent();
        };
    }

})();
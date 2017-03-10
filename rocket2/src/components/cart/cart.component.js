    angular.module('rocketCartCompModule')
        .directive('cart',cartDirective);

    function cartDirective() {
        return {
            restrict: 'E',
            templateUrl: 'components/cart/cart.component.html',
            controller : CartController,
            controllerAs : 'cartCtrl'
            };
    }

    CartController.$inject = ['ngDialog', 'config', 'rocketCart', 'rocketServices', 'restoUsersAPI'];

    function CartController(ngDialog, config, rocketCart, rocketServices, restoUsersAPI) {

        var self = this;
        self.content = rocketCart.getContent();

        /*
         * Switch to feature view
         * 
         * @param {String} collectionName
         * @param {String} featureIdentifier
         */
        self.view = function(collectionName, id) {
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
        self.removeFromCart = function(feature) {
            rocketCart.remove(feature,
                    function() {
                        self.content = rocketCart.getCartContent();
                        rocketServices.success('cart.remove.success');
                    },
                    function() {
                        rocketServices.success('cart.remove.error');
                    });
        };

        /*
         * Checkout cart content
         */
        self.checkout = function() {

            rocketCart.download(function(data) {
                self.processDownload(data.order.orderId, data.order.items, data.order.errors);
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
        self.processDownload = function(orderId, items, errors) {
            if (errors.length > 0) {
                /*
                 * process errors
                 */
                self.undownloadableItems = errors;
                self.downloadableItems = items;
                self.orderId = orderId;

            } else if (items.length > 0) {
                /*
                 * download items
                 */
                self.downloadableItems = items;
                self.orderId = orderId;
                self.downloadOrder(orderId);
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
        self.getLicenseUrl = function(licenseDescription) {
            var lang = rocketServices.getLang();
            if (licenseDescription[lang]) {
                return licenseDescription[lang].url;
            } else if (licenseDescription.en) {
                return licenseDescription.en.url;
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
        self.signLicense = function(licenseId, licenseUrl) {
            
            
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
                                    self.checkout();
                                }, function() {
                                    rocketServices.error('cart.signatures.error');
                                });
                            },
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
        self.downloadOrder = function() {
            if (self.orderId && self.downloadableItems) {
                var url = config.restoServerUrl + 'user/orders/' + self.orderId + '.meta4';
                rocketServices.success('cart.download.start');
                rocketServices.download(url);

                /*
                 * Clean cart and scope
                 */
                self.intelligentCleanup(self.downloadableItems);
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
        self.intelligentCleanup = function(items) {
            /*
             * Clear cart
             */
            var nb_deletedItems = rocketCart.intelligentClear(items);

            /*
             * Clear scope
             */
            self.undownloadableItems = null;
            self.downloadableItems = null;
            self.orderId = null;

            /*
             * Get cart content
             */
            self.content = rocketCart.getContent();
        };
    }

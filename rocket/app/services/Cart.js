(function(Storage, localStorage) {

    'use strict';

    /* Services */

    angular.module('rocket')
            .factory('rocketCart', ['config', '$cookies', '$cookieStore', '$http', '$auth', Cart]);

    function Cart(CONFIG, $cookies, $cookieStore, $http, $auth) {

        var cart = {
            add: add,
            clear: clear,
            count: count,
            download: download,
            getContent: getContent,
            intelligentClear: intelligentClear,
            remove: remove
        };

        /*
         * {featureid : {
         *      'productIdentifier': productIdentifier,
         *      'productType': productType,
         *      'quicklook': quicklook,
         *      'collection': collection,
         *      'services': {
         *          'download': download
         *       }    
         *      }
         *  }
         *  
         *  cart.content has to be an object to be exploited by JSON.stringify function.
         */
        var content = {};

        /*
         * Context parameters
         * 
         * Storage priority :
         *      1. localStorage
         *      2. cookie
         *      3. server
         *      
         *      
         * WARNING : if localStorage is not available, cookie use is forced (even if cookieUse param is set false)
         */
        var params = {
            /*
             * true: use cookie to store cart content
             * false: do not use cookie to store cart content
             */
            cookieUse: false,
            /*
             * true: use localStorage if available
             * false: do not use localStorage
             */
            localStorageUse: true,
            isInitialized: false,
            cartKey: 'cartContent'
        };

        function init() {

            if ($auth.isAuthenticated()) {

                if (CONFIG.hasOwnProperty('cookieUse')) {
                    params.cookieUse = CONFIG.cookieUse;
                }

                if (CONFIG.hasOwnProperty('localStorageUse')) {
                    params.localStorageUse = CONFIG.localStorageUse;
                }

                if (CONFIG.hasOwnProperty('cartCollection')) {
                    params.collection = CONFIG.cartCollection;
                }

                if (CONFIG.hasOwnProperty('cartKey')) {
                    params.cartKey = CONFIG.cartKey;
                }

                /*
                 * localStorage key name
                 */
                params.localStorageKeyName = params.cartKey + $auth.getPayload().data.userid;

                /*
                 * Cookie key name
                 */
                params.cookieKeyName = params.cartKey + $auth.getPayload().data.userid;


                /*
                 * Check if cart content has to be sync with localStorage
                 */
                if (params.localStorageUse) {
                    if (typeof (Storage) !== "undefined") {
                        /*
                         * localStorage is available
                         */

                        var _tmpContent = getContentLocalStore();
                        if (_tmpContent) {
                            /*
                             * cart content exists in localStorage
                             */
                            content = _tmpContent;
                        } else {
                            /*
                             * cart content not exists in localStorage => init localStorage cart content
                             */
                            setContentLocalStore();
                        }
                    } else {
                        /*
                         * If localStorage is not available, force cookie use
                         */
                        params.localStorageUse = false;
                        params.cookieUse = true;
                    }
                }

                /*
                 * Check if cart content has to be sync with coookie
                 */
                if (params.cookieUse) {
                    /*
                     * cookie has to be used
                     */
                    var _tmpContent = getCookie();
                    if (_tmpContent) {
                        /*
                         * cart content exists in cookie
                         */
                        content = _tmpContent;
                    } else {
                        /*
                         * cart content not exists in cookie => init cookie cart content
                         */
                        setCookie();
                    }
                }

                params.isInitialized = true;

            }
        }
        ;

        /**
         * Get cart content
         * 
         * Call this method from the controller to get the cart content.
         * 
         * @returns {cart.content|Array|_L1.Cart.cart.content}
         */
        function getContent() {

            if (!params.isInitialized) {
                init();
            }

            if (params.localStorageUse) {
                /*
                 * Get cart content from localStorage
                 */
                content = getContentLocalStore();
            } else if (params.cookieUse) {
                /*
                 * Get cart content from cookie
                 */
                content = getCookie();
            }

            return content;

        }
        ;

        function count() {
            var count = 0;
            for (var x in getContent()) {
                count = count + 1;
            }
            return count;
        }
        ;

        /*
         * Store content in localStore
         * 
         * @returns {undefined}
         */
        function setContentLocalStore() {
            /*
             * Set localStorage content
             */
            localStorage.setItem(params.localStorageKeyName, JSON.stringify(content));
        }
        ;

        /*
         * Get cart content from localStorage
         * 
         * @returns {Array|Object}
         */
        function getContentLocalStore() {
            var storageContent = {};
            /*
             * Check if localStorage content is not null
             */
            if (localStorage.hasOwnProperty(params.localStorageKeyName)) {
                /*
                 * Get localStorage content
                 */
                storageContent = JSON.parse(localStorage.getItem(params.localStorageKeyName));
            }
            return storageContent;
        }
        ;

        /*
         * Store cart content in cookie
         * 
         * @returns {undefined}
         */
        function setCookie() {
            /*
             * Add or replace cookie content
             */
            $cookieStore.put(params.cookieKeyName, JSON.stringify(content));
        }
        ;

        /*
         * Get cart content from cookie
         * 
         * @returns {unresolved}
         */
        function getCookie() {
            var cookieContent = {};
            /*
             * If cookie exists
             */
            if ($cookies.hasOwnProperty(params.cookieKeyName)) {
                /*
                 * Get cookie content
                 */
                cookieContent = JSON.parse($cookieStore.get(params.cookieKeyName));

            }
            return cookieContent;
        }
        ;

        /*
         * Clear cart content in navigator
         * 
         * This method should be called at user logging out
         * 
         * WARNING : this function does not impact server cart
         * 
         * @returns {undefined}
         */
        function clear() {

            if (!params.isInitialized) {
                init();
            }

            /*
             * Clear service cart content
             */
            content = {};

            if (params.localStorageUse) {
                /*
                 * sync with localStorage
                 */
                setContentLocalStore();
            } else if (params.cookieUse) {
                /*
                 * sync with cookie
                 */
                setCookie();
            }

        }
        ;
        
        /**
         * Intelligent clear
         * 
         * @param {array} items
         * @returns {undefined}
         */
        function intelligentClear(items) {
            var nb_deletedItems = 0;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                remove(item.id, function(){
                    nb_deletedItems ++;
                });
            }
            return nb_deletedItems;
        };

        /**
         * Add features to cart
         * 
         * @param {object} feature
         * @param {callback} success
         * @param {callback} error
         * @returns {undefined}
         */
        function add(feature, success, error) {

            if ((typeof feature.id) !== 'string' || !feature.hasOwnProperty('properties')) {
                error();
            }

            if (!params.isInitialized) {
                init();
            }


            if (content.hasOwnProperty(feature.id)) {
                /*
                 * Cart already contains this item
                 */
                success('cart.add.alreadyAdded');
            } else {

                /*
                 * Add item to service cart content
                 */
                content[feature.id] = {
                    id: feature.id,
                    properties: feature.properties
                };

                if (params.localStorageUse) {
                    /*
                     * sync with localStorage
                     */
                    setContentLocalStore();
                    success();
                } else if (params.cookieUse) {
                    /*
                     * sync with cookie
                     */
                    setCookie();
                    success();
                }
            }


        }
        ;

        /*
         * Remove feature from cart
         * 
         * @param {string} featureid
         * @param {callback} success
         * @returns {undefined}
         */
        function remove(featureid, success) {

            if (!params.isInitialized) {
                init();
            }

            /*
             * remove item from service cart content
             */
            delete content[featureid];

            /*
             * Sync cart content following priority order
             */
            if (params.localStorageUse) {
                /*
                 * Save to localStorage
                 */
                setContentLocalStore();
                success();
            } else if (params.cookieUse) {
                /*
                 * Save to cookie
                 */
                setCookie();
                success();
            }
        }
        ;

        /*
         * Download cart content
         * 
         * @returns {undefined}
         */
        function download(callback, error) {
            if (!params.isInitialized) {
                init();
            }

            var cartContent = getContent();
            var features = [];

            for (var key in cartContent) {
                features.push(cartContent[key]);
            }

            var post_options = {
                userid: $auth.getPayload().data.userid,
                features: features
            };

            /*
             * Post order
             */
            $http({
                method: 'POST',
                url: CONFIG.restoServerUrl + 'user/orders',
                dataType: "json",
                data: post_options.features,
                contentType: 'application/json'
            }).success(function(data) {

                $http({
                    method: 'GET',
                    url: CONFIG.restoServerUrl + 'user/orders/' + data.order.orderId + '.json',
                    contentType: 'application/json'
                }).success(function(data) {
                    callback(data);
                }).error(function() {
                    error();
                });
                
            }).error(function() {
                error();
            });

        }
        ;

        return cart;
    }
    ;

})(Storage, localStorage);
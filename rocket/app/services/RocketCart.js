(function(Storage, localStorage) {

    'use strict';

    /* Services */

    angular.module('rocket')
            .factory('rocketCart', ['restoCartAPI', 'config', 'rocketServices', '$cookies', rocketCart]);

    function rocketCart(restoCartAPI, config, rocketServices, $cookies) {

        var cart = {
            add: add,
            clear: clear,
            checkout: checkout,
            getCartContent: getCartContent,
            remove: remove,
            pullFromServer:pullFromServer,
            pushToServer:pushToServer
        };
        
        /*
         * User identifier - -1 if not identified
         */
        var userid = -1;
        
        /*
         * Cookie/LocalStorage key prefix
         */
        var prefix = 'cart';
        
        /*
         * Context parameters
         * 
         * Storage priority :
         *      1. localStorage
         *      2. cookie
         *      3. server
         *      
         *      
         * WARNING : if localStorage is not available, cookie use is forced
         */
        var params = {
            
            /*
             * true : force http request for each cart actions
             * false : no http request send
             */
            cartSynchronization: config.hasOwnProperty('cartSynchronization') ? config.cartSynchronization : false
            
        };

        /**
         * Initialize cart
         * 
         * @param {function} callback
         */
        function init(callback) {
            
            /*
             * Set userid 
             */
            if (rocketServices.isAuthenticated()) {
                userid = rocketServices.getProfile().userid;
            }
            
            /*
             * Get content from server
             */
            pullFromServer(userid, callback);
            
        };

        /*
         * Sync cart content with server. Actual cart content is overwritten
         * 
         * 
         * {"6c8e2a3ed9f43d426c3e0694988846dcd5c944ef":
         *   {
         *      "id":"7b5541f4-dbcd-56aa-bc4c-2bd9bd59a387",
         *      "properties":
         *          {
         *              "productIdentifier":"SPOT4_HRVIR1_XS_20130511_N1_TUILE_EEthiopiaD0000B0000",
         *              "productType":"REFLECTANCETOA",
         *              "quicklook":"http:\/\/spirit.cnes.fr\/take5\/ql\/SPOT4_HRVIR1_XS_20130511_N1_TUILE_EEthiopiaD0000B0000.png",
         *              "collection":"Take5",
         *              "services":
         *                  {
         *                      "download":"http:\/\/resto.mapshup.com\/2.0\/collections\/Take5\/7b5541f4-dbcd-56aa-bc4c-2bd9bd59a387\/download"
         *                  }
         *              }
         *          }
         *      }
         * 
         * @param {integer} error
         * @param {function} callback
         * @returns {undefined}
         */
        function pullFromServer(userid, callback) {
            
            if (!params.cartSynchronization) {
                return;
            }
            
            /*
             * Get cart from server
             */
            restoCartAPI.get({
                userid:userid
            }, function(data) {

                /*
                 * Save cart in service
                 * 
                 * @type @arr;data
                 */
                var content = {
                    items:[]
                };
                for (var key in data) {
                    
                    var _tmpData = data[key];
                    
                    /*
                     * If a collection is specified for this cart just use
                     * collection objects
                     */
                    if (params.hasOwnProperty('cartCollection')) {
                        if (_tmpData.properties.collection === params.collection) {
                            content.items.push(data);
                        }
                    } 
                    else {
                        content.items.push(data);
                    }

                }
                
                /*
                 * Store cart content locally
                 */
                setCartContent(content);
                
                /*
                 * Callback
                 */
                if (typeof callback === 'function') {
                    callback();
                }
                
            },
            /*
             * Error callback
             */
            function(data) {
                rocketServices.error(data);
            });
        };

        /*
         * Get cart content from local storage or cookie
         * 
         * @returns {Array|Object}
         */
        function getCartContent() {
            
            if (userid === -1) {
                return init(function(){
                    getCartContent();
                });
            }
            
            var content = {
                items:[]
            };
            
            /*
             * Localstorage is available (HTML5)
             */
            if (typeof (Storage) !== "undefined" && localStorage) {
                if (localStorage.hasOwnProperty(prefix + userid)) {
                    content = JSON.parse(localStorage.getItem(prefix + userid));
                }
            }
            /*
             * Cookie
             */
            else {
                if ($cookies.hasOwnProperty(prefix + userid)) {
                    content = JSON.parse($cookies.get(prefix + userid));
                }
            }
            
            return content;
            
        };

        /*
         * Set cart content to local storage or cookie
         * 
         * @param {Object} content
         */
        function setCartContent(content) {
            
            /*
             * Localstorage is available (HTML5)
             */
            if (typeof (Storage) !== "undefined" && localStorage) {
                localStorage.setItem(prefix + userid, JSON.stringify(content));
            }
            /*
             * Cookie
             */
            else {
                $cookies.put(prefix + userid, JSON.stringify(content));
            }
            
        };
        
        /*
         * Clear local cart content in navigator
         */
        function clear() {

            if (userid === -1) {
                if (userid === -1) {
                    return init(function(){
                        clear();
                    });
                }
            }
            
            /*
             * Localstorage is available (HTML5)
             */
            if (typeof (Storage) !== "undefined" && localStorage) {
                localStorage.removeItem(prefix + userid);
            }
            /*
             * Cookie
             */
            else {
                $cookies.remove(prefix + userid);
            }
            
        };

        /**
         * Add feature to cart
         * 
         * @param {type} feature
         * @param {type} success
         * @param {type} error
         * @returns {undefined}
         */
        function add(feature, success, error) {

            if (userid === -1) {
                return init(function(){
                    add(feature,success,error);
                });
            }

            /*
             * Valid feature needs at least an id and a properties property
             */
            if (!feature.id || !feature.properties) {
                error();
            }
            
            var content = getCartContent();
            
            /*
             * Cart already contains this item
             */
            for (var i = 0, ii = content.items.length; i < ii; i++) {
                if (content.items[i].id === feature.id) {
                    success();
                    return;
                }
            }
            
            /*
             * Add item to service cart content
             */
            content.items.push(feature);

            /*
             * Set content
             */
            setCartContent(content);

            /*
             * Callback function
             */
            success();

        };

        /*
         * Remove feature from cart
         * 
         * @param {string} featureid
         * @param {callback} success
         * @returns {undefined}
         */
        function remove(featureid, success) {

            if (userid === -1) {
                return init(function(){
                    remove(featureid, success);
                });
            }
            
            var content = getCartContent();
            
            /*
             * Remove item from service cart content
             */
            for (var i = 0, ii = content.items.length; i < ii; i++) {
                if (content.items[i].id === featureid) {
                    content.items.splice(i, 1);
                    break;
                }
            }
            
            /*
             * Set modified cart content
             */
            setCartContent(content);
            
            /*
             * Callback function
             */
            success();
        };
        
        
        /**
         * Checkout cart
         * 
         * @param {Function} callback
         * @param {Function} error
         */
        function checkout(callback, error) {
           
            /*
             * Synchronize cart on server
             */
            pushToServer(function(){
                
               /*
                * Post order - then return metalink url if successful
                */
               restoCartAPI.placeOrder({
                   userid:userid,
                   fromCart:true
               },
               function(result) {

                   /*
                    * Clear local cart
                    */
                   clear();

                   /*
                    * Get order metalink
                    */
                   callback(rocketServices.getMetalinkUrl({
                       userid:userid,
                       orderId:result.order.orderId
                   }));
                   
               },
               function(result) {
                   error(result);
               });
           });
           
        };

        /**
         * Push cart to server
         * 
         * @param {Function} callback
         */
        function pushToServer(callback) {
            
            if (!params.cartSynchronization) {
                callback();
            }
            
            restoCartAPI.add({
                items: getCartContent().items,
                userid: userid,
                clear:true
            },
            function (result) {
                callback(result);
            },
            function (result) {
                callback(result);
            });
            
        };

        return cart;
    };

})(Storage, localStorage);
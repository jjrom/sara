
angular.module('restoUsersAPIModule',['rocketServicesModule','rocketCartModule'])
        .factory('restoUsersAPI', restoUsersAPI);

restoUsersAPI.$inject = ['$http', '$auth', '$timeout', 'rocketServices', 'rocketCart'];

    function restoUsersAPI($http, $auth, $timeout, rocketServices, rocketCart) {

        var api = {
            connect: connect,
            disconnect: disconnect,
            getOrders:getOrders,
            hasToSignLicense:hasToSignLicense,
            licensesToSign:licensesToSign,
            login:login,
            lostPassword: lostPassword,
            resetPassword: resetPassword,
            refreshToken: refreshToken,
            signLicense:signLicense,
            signup:signup
        };

        return api;

        ////////////
        /**
         * Login to resto
         *
         * @param {Object} params
         * @param {Function} callback
         * @param {Function} error
         *
         */
        function login(params, callback, error) {
            $auth.login({
                email: params.email,
                password: params.password
            })
                .then(function (result) {
                    setToken(result.data.token, false);
                    refreshToken();
                    callback();
                })
                ["catch"](function (result) {
                error(result);
            });
        }

        /**
         * Refresh User profile as JSON Web Token
         *
         * @param {Function} callback
         * @param {Function} error
         */
        function connect(callback, error) {
            $http({
                url:rocketServices.restoEndPoint() + '/api/users/connect',
                method:'GET'
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Log out user
         *
         * @param {Function} callback
         * @param {Function} error
         */
        function disconnect(callback, error) {
            $http({
                url:rocketServices.restoEndPoint() + '/api/user/disconnect',
                method:'POST'
            }).
            success(function (result) {
                $auth.logout();
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Ask for a new password
         *
         * GET /api/users/resetPassword
         *
         * @param {Object} params : must contains 'email'
         * @param {Function} callback
         * @param {Function} error
         */
        function lostPassword(params, callback, error) {
            $http({
                url:rocketServices.restoEndPoint() + 'api/user/resetPassword',
                method:'GET',
                params:{
                    email: params.email
                }
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Reset password
         *
         * POST /api/users/resetPassword
         *
         * @param {Object} params : must contains 'url' and 'password'
         * @param {Function} callback
         * @param {Function} error
         */
        function resetPassword(params, callback, error) {
            $http({
                url:rocketServices.restoEndPoint() + '/api/users/resetPassword',
                method:'POST',
                data:{
                    url:params.url,
                    email:params.email,
                    password:params.password
                },
                headers:{
                    'Content-Type': 'application/json'
                }
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Create an account
         *
         * @param {Object} params
         * @param {Function} callback
         * @param {Function} error
         */
        function signup(params, callback, error) {
            $http({
                url:rocketServices.restoEndPoint() + '/users',
                method:'POST',
                data:{
                    givenname: params.givenname,
                    lastname: params.lastname,
                    username: params.username,
                    country: params.country,
                    organization: params.organization,
                    topics: params.topics,
                    email: params.email,
                    password: params.password,
                    activateUrl: rocketServices.baseUrl() + '#/signin'
                },
                headers:{
                    'Content-Type': 'application/json'
                }
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Check if user has to sign input license
         *
         * @param {Object} params
         * @param {Function} callback
         */
        function hasToSignLicense(params, callback) {
            $http({
                url:rocketServices.restoEndPoint() + '/users/' + params.userid + '/signatures/' + params.collectionName,
                method:'GET'
            }).
            success(function (result) {
                callback({
                    collectionName:params.collectionName,
                    hasToSignLicense: result.signatures[params.collectionName].hasToSignLicense,
                    licenseUrl: result.signatures[params.collectionName].licenseUrl
                });
            }).
            error(function (result) {
                callback({
                    collectionName:params.collectionName,
                    hasToSignLicense: true,
                    licenseUrl: result.signatures[params.collectionName].licenseUrl
                });
            });
        }

        /**
         * Check if user has to sign input license
         *
         * @param {Object} params
         * @param {Function} callback
         */
        function licensesToSign(params, callback, error) {
            $http({
                url:rocketServices.restoEndPoint() + '/users/' + params.userid + '/signatures/' ,
                method:'GET'
            }).
            success(function (result) {
                callback(result.signatures);
            }).
            error(function () {
                error();
            });
        }

        /**
         * Get orders for user
         *
         * @param {Object} params
         * @param {Function} callback
         * @param {Function} error
         */
        function getOrders(params, callback, error) {
            $http({
                url:rocketServices.restoEndPoint() + '/user/orders',
                method:'GET'
            }).
            success(function (result) {
                callback(result);
            }).
            error(function (result) {
                error(result);
            });
        }

        /**
         * Sign license
         *
         * @param {string} licenseId
         * @param {Function} callback
         * @param {Function} error
         */
        function signLicense(licenseId, callback, error) {
            $http({
                url: rocketServices.restoEndPoint() + '/api/licenses/' + licenseId + '/sign',
                method: 'POST'
            })
                .success(function(result) {
                    callback(result);
                })
                .error(function(result) {
                    error(result);
                });
        }

        /**
         * Get token duration
         *
         * @returns {token.exp|Number|token.iat}
         */
        function getTokenDuration(){
            if (rocketServices.isAuthenticated()) {
                var payload = $auth.getPayload();
                return payload.exp - payload.iat;
            }
            else {
                return 0;
            }
        }

        /**
         * Set token to local storage
         *
         * @param {String} token
         * @param {boolean} redirect
         */
        function setToken(token, redirect) {
            $auth.setToken(token, redirect);
        }

        /**
         * Automatically refresh token based on the token duration
         */
        function refreshToken() {

            /*
             * Get token duration validity
             */
            var duration = getTokenDuration() * 500;
            if (duration === 0) {
                return false;
            }

            /*
             * Create interval function to refresh token before expiration date
             */
            $timeout(function() {
                if (rocketServices.isAuthenticated()) {
                    connect(function(result){
                            setToken(result.token, false);
                            refreshToken();
                        },
                        function() {
                            $auth.logout();
                        });
                }
                else {
                    /*
                     * Save cart and disconnect
                     */
                    rocketCart.pushToServer(function (result) {
                        disconnect(function () {
                                rocketServices.go('home', null, {
                                    reload: true
                                });
                            },
                            function () {
                            });
                    });
                }
            }, duration);
        }

    }

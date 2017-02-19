(function (angular, localStorage) {
    'use strict';

    angular.module('rocket')
            .factory('rocketServices', ['$auth', '$translate', '$state', '$timeout', 'config', 'growl', rocketServices]);

    function rocketServices($auth, $translate, $state, $timeout, config, growl) {
        
        var api = {
            baseUrl:baseUrl,
            error: error,
            focus:focus,
            getLang: getLang,
            getProfile: getProfile,
            getMetalinkUrl:getMetalinkUrl,
            getToken: getToken,
            go: go,
            isAuthenticated: isAuthenticated,
            restoEndPoint:restoEndPoint,
            success: success,
            translate:translate,
            warning: warning,
            download:download
        };
        
        var options = {
            ttl: 3000,
            disableIcons: true,
            disableCloseButton: true,
            disableCountDown: true
        };
        
        return api;

        ////////////

        /**
         * Return base url - i.e. url before '#' 
         */
        function baseUrl() {
            return window.location.href.split('#')[0];
        }
        
        /**
         * Set focus on element id
         * Note: $timeout is used to be sure that focus is run
         * after other events
         * 
         * @param {string} id
         */
        function focus(id) {
            $timeout(function() {
              var element = document.getElementById(id);
              if(element)
                element.focus();
            });
        };
        
        /*
         * Return true if user is authenticated - false otherwise
         */
        function isAuthenticated() {
            return $auth.isAuthenticated();
        };
        
        /**
         * Return resto server url root endpoint
         * @returns {String}
         */
        function restoEndPoint() {
            return config.restoServerUrl;
        }
        
        /**
         * Returns a JWT from Local Storage
         */
        function getToken() {
            return $auth.getToken();
        };
        
        /**
         * Returns user profile
         */
        function getProfile() {
            if (isAuthenticated()) {
                return $auth.getPayload().data;
            }
            return {};
        };
        
        /**
         * Get application language
         */
        function getLang() {
            var lang = translate('lang') === 'lang' ? 'en' : translate('lang');
            return lang;
        };
        
        /*
         * Return metalink url
         * 
         * @param {Object} params
         */
        function getMetalinkUrl(params) {
            return restoEndPoint() + '/users/' + params.userid + '/orders/' + params.orderId + '.meta4';
        };

        /**
         * Go to view
         * 
         * @param {string} name
         * @param {Object} params
         * @param {Object} options
         */
        function go(name, params, options) {
            $state.go(name, params || {}, options || {});
        };
        
        /**
         * Display error
         * 
         * @param {string} message
         */
        function error(message) {
            $translate(message).then(function (translation) {
                growl.error(translation, options);
            });
        }
        
        /**
         * Display success
         * 
         * @param {string} message
         */
        function success(message) {
            $translate(message).then(function (translation) {
                growl.success(translation, options);
            });
        }
        
        /**
         * Display warning
         * 
         * @param {string} message
         */
        function warning(message) {
            $translate(message).then(function (translation) {
                growl.warning(translation, options);
            });
        }
       
        /**
         * Replace {a:1}, {a:2}, etc within str by array values
         * 
         * @param {string} str (e.g. "My name is {a:1} {a:2}")
         * @param {array} values (e.g. ['Jérôme', 'Gasperi'])
         * 
         */
        function translate(str, values) {
            
            var i, l, out = $translate.instant(str);

            /*
             * Replace additional arguments
             */
            if (values && out.indexOf('{a:') !== -1) {
                for (i = 0, l = values.length; i < l; i++) {
                    out = out.replace('{a:' + (i + 1) + '}', values[i]);
                }
            }

            return out;
        }
        
        /**
         * Automatically open iframe within page for download
         * (Note: systematically add a _bearer query parameter for authentication)
         * 
         * @param {String} url
         */
        function download(url, signLicenseCallback) {

            var first = true;
            var $frame = $('#hiddenDownloader');
        
            /*
             * Add authentication bearer
             */
            url = url + (url.indexOf('?') === -1 ? '?' : '&') + '_bearer=' + getToken();
            
            if ($frame.length === 0) {
                $frame = $('<iframe id="hiddenDownloader" style="display:none;">').appendTo('body');
            }
            $frame.attr('src', url).load(function() {
                var result = JSON.parse($('body', $(this).contents()).text());
                if (result && result.ErrorCode && first) {
                    first = false;
                    switch (result.ErrorCode) {
                        case 3002:
                            signLicenseCallback(result);
                            break;
                        case 403:
                            error('Forbidden');
                            break;
                        case 404:
                            error('Not found');
                            break;
                        default:
                            error('Problem downloading');
                    }
                    return false;
                }
            });
            return false;
        };
        
    }
})(angular, localStorage);
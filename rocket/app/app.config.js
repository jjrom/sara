(function () {
    'use strict';

    angular.module('rocket')
            .config(['$translateProvider', '$authProvider', 'growlProvider', 'config', RocketConfig]);

    function RocketConfig($translateProvider, $authProvider, growlProvider, config) {
        
        var token = function() {
            return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        };
        
        /*
         * Internationalization
         * (See app/i18n/{lang}.json)
         */
        var availableLanguages = config.availableLanguages || ['en'];
        $translateProvider.useStaticFilesLoader({
            prefix: 'app/i18n/',
            suffix: '.json'
        }).registerAvailableLanguageKeys(availableLanguages);
        /*
         * Automatically detects browser language.
         * If not available, fallback to the first available language
         * (default is english)
         */
        if (config.detectLanguage) {
            $translateProvider.determinePreferredLanguage().fallbackLanguage(availableLanguages[0]);
        }
        else {
            $translateProvider.preferredLanguage(availableLanguages[0]);
        }
        
        /*
         * Authentication configuration
         */
        $authProvider.baseUrl = '';
        $authProvider.loginUrl = config['restoServerUrl'] + '/api/users/connect';
        $authProvider.loginRedirect = null;
        var redirectUri = config['restoServerUrl'] + 'api/oauth/callback';
        
        /*
         * Authentication providers
         */
        if (config.auth) {
            for (var key in config.auth) {
                switch (key) {
                    case 'google':
                        $authProvider.google({
                            url: config['restoServerUrl'] + '/api/auth/google',
                            redirectUri:redirectUri,
                            clientId: config.auth[key]['clientId'],
                            requiredUrlParams:['scope', 'state'],
                            state:token()
                        });
                        break;
                    case 'linkedin':
                        $authProvider.linkedin({
                            url: config['restoServerUrl'] + '/api/auth/linkedin',
                            redirectUri:redirectUri,
                            clientId: config.auth[key]['clientId'],
                            requiredUrlParams:['state'],
                            state:token()
                        });
                        break;
                    default:
                        var requiredUrlParams = config.auth[key]['requiredUrlParams'] ? config.auth[key]['requiredUrlParams'] : [];
                            requiredUrlParams.push('state');
                        $authProvider.oauth2({
                            name: key,
                            url: config['restoServerUrl'] + '/api/auth/' + key,
                            redirectUri:redirectUri,
                            clientId: config.auth[key]['clientId'],
                            authorizationEndpoint: config.auth[key]['authorizeUrl'],
                            scope:config.auth[key]['scope'] || null,
                            requiredUrlParams: requiredUrlParams,
                            state:token(),
                            popupOptions: { width: 900, height: 500 }
                        });

                }
            }
        }
        growlProvider.globalPosition('top-center');
       
    }

})();
/**
 * Define Angular application module.
 *
 * @ngdoc application
 * @namespace app
 * @requires ng
 * @requires ol
 * @requires app.components.footer
 * @requires app.components.header
 * @requires app.templates
 */
angular.module('app', [
    // Official modules.
    'ng',
    // Library modules.
    'olMap',
    // Application modules.
    'app.components.header',
    'rocketCacheServiceModule',
    'app.components.main',
    'rocketConstantModule',
    'restoFeatureAPIModule',
    'app.components.left.menu',
    'restoCartAPIModule',
    'rocketMapModule',
    'rocketServicesModule',
    'restoUsersAPIModule',
    'rocketCartModule',
    'ngTouch',
    'ngCookies',
    'ngAnimate',
    'ui.router',
    'pascalprecht.translate',
    'satellizer',
    'angular-growl',
    'ngDialog',
    'wu.masonry',
    '720kb.datepicker',
    'rocket.filters',
    'AppDirectives',
    //Components Loading
    'rocketCartCompModule',
    'collectionsComponentModule',
    'app.components.home',
    'app.components.lost.password',
    'app.components.reset.password',
    'app.components.profile',
    'app.templates'])
    .config(RocketConfig)
    .config(RocketRoutes);



    // Config
    RocketConfig.$inject = ['$translateProvider', '$authProvider', 'growlProvider', 'config'];
    function RocketConfig($translateProvider, $authProvider, growlProvider, config) {

        var token = function() {
            return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        };

        /*
         * Internationalization
         * (See i18n/{lang}.json)
         */
        var availableLanguages = config.availableLanguages || ['en'];
        $translateProvider.useStaticFilesLoader({
            prefix: 'i18n/',
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



    // Routes Config
    RocketRoutes.$inject = ['$stateProvider', '$urlRouterProvider'];
    function RocketRoutes($stateProvider, $urlRouterProvider) {

        var resolve = {
            authenticated: ['$q', '$location', 'rocketServices', function ($q, $location, rocketServices) {
                var deferred = $q.defer();
                if (!rocketServices.isAuthenticated()) {
                    $location.path('/signin');
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            }]
        };

        /*
         * For any unmatched url, redirect to /home
         */
        $urlRouterProvider.otherwise('home');

        /*
         * Routes
         */
        $stateProvider
            .state('about', {
                url: "/about",
                templateUrl: "src/components/help/about.html"
            })
            .state('cart', {
                url: "/cart",
                template: '<cart></cart>',
                resolve:resolve
            })
            .state('collections', {
                url: "/collections/:collectionName",
                template: '<collections></collections>'
            })
            .state('help', {
                url: "/help",
                templateUrl: "src/components/help/help.html"
            })
            .state('home', {
                url: "/home",
                template: "<home></home>"
            })
            .state('lostPassword', {
                url: '/lostPassword',
                template: "<lost-password></lost-password>"
            })
            .state('feature', {
                url: '/collections/:collectionName/:featureId',
                templateUrl: 'app/components/features/feature.html',
                controller: 'FeatureController'
            })
            .state('profile', {
                url: '/profile',
                template : "<profile></profile>",
                resolve:resolve
            })
            .state('register', {
                url: '/register',
                templateUrl: "app/components/register/register.html",
                controller:"RegisterController"
            })
            .state('resetPassword', {
                url: '/resetPassword/:email',
                template : "<reset-password></reset-password>"
            })
            .state('search', {
                url: "/search?q&lang&view&collection&platform&instrument&productType&processingLevel&sensorMode&page&startDate&completionDate&geometry",
                templateUrl: "app/components/features/search.html",
                controller: 'SearchController',
                reloadOnSearch: false
            })
            .state('signin', {
                url: '/signin',
                templateUrl: "app/components/signin/signIn.html",
                controller:"SignInController"
            });
    }


/**
 * In order to have more control over the initialization process, we use the manual bootstrapping
 * method of Angular (instead of "ng-app" directive). With this method we can properly handle the
 * configuration value to setup Angular modules (and also use the "ng-cloak" directive to display
 * a splash/loading screen until the configuration is loaded).
 *
 * @param {Object} config The application configuration.
 */
function bootstrap(config) {

    // TODO handle configuration value here...

    // Bootstrap Angular application module.
    angular.bootstrap(window.document, ['app']);
}
$.getJSON('config.json', bootstrap); // loading configuration...








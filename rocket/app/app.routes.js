(function () {
    'use strict';

    angular.module('rocket')
            .config(['$stateProvider', '$urlRouterProvider', RocketRoutes]);

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
                    templateUrl: "app/components/help/about.html"
                })
                .state('cart', {
                    url: "/cart",
                    controller: 'CartController',
                    templateUrl: "app/components/cart/cart.html",
                    resolve:resolve
                })
                .state('collections', {
                    url: "/collections/:collectionName",
                    templateUrl: "app/components/collections/collections.html"
                })
                .state('help', {
                    url: "/help",
                    templateUrl: "app/components/help/help.html"
                })
                .state('home', {
                    url: "/home",
                    controller: 'HomeController',
                    templateUrl: "app/components/home/home.html"
                })
                .state('lostPassword', {
                    url: '/lostPassword',
                    templateUrl: "app/components/password/lostPassword.html",
                    controller:"LostPasswordController"
                })
                .state('feature', {
                    url: '/collections/:collectionName/:featureId',
                    templateUrl: 'app/components/features/feature.html',
                    controller: 'FeatureController'
                })
                .state('profile', {
                    url: '/profile',
                    templateUrl: 'app/components/profile/profile.html',
                    controller: 'ProfileController',
                    resolve:resolve
                })
                .state('register', {
                    url: '/register',
                    templateUrl: "app/components/register/register.html",
                    controller:"RegisterController"
                })
                .state('resetPassword', {
                    url: '/resetPassword/:email',
                    templateUrl: "app/components/password/resetPassword.html",
                    controller:"ResetPasswordController"
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

})();
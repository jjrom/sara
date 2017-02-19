(function (jQuery) {
    'use strict';

    angular.module('rocket')
    
        /*
         * Scroll page to dom element
         */
        .directive('scrollToItem', function() {                                                      
            return {                                                                                
                restrict: 'A',                                                                       
                scope: {                                                                             
                    scrollTo: "@"                                                                    
                },                                                                                   
                link: function(scope, $elm, attr) {
                    $elm.on('click', function() {                                                    
                        jQuery('html,body').animate({scrollTop: jQuery(scope.scrollTo).offset().top }, "slow");
                    });                                                                              
                }                                                                                   
            };
        })
        /*
         * Display a default image while loading image in background
         */
        .directive('bgImage', function () {
            return {
                link: function(scope, element, attr) {

                    attr.$observe('bgImage', function() {           
                        if (!attr.bgImage) {
                            // No attribute specified, so use default
                            if (scope.defaultImage) {
                                element.css("background-image", "url(" + scope.defaultImage + ")");
                            }
                        }
                        else {
                            var image = new Image();
                            image.src = attr.bgImage;
                            image.onload = function() {
                                //Image loaded- set the background image to it
                                element.css("background-image", "url(" + attr.bgImage + ")");
                            };
                            image.onerror = function() {
                                //Image failed to load- use default
                                element.css("background-image", "url(" + scope.defaultImage + ")");
                            };
                        }
                    });
              }
          };
        })
        .directive('eventFocus', function(focus) {
            return function (scope, elem, attr) {
                elem.on(attr.eventFocus, function () {
                    focus(attr.eventFocusId);
                });

                // Removes bound events in the element itself
                // when the scope is destroyed
                scope.$on('$destroy', function () {
                    elem.off(attr.eventFocus);
                });
            };
        })
       /*
        * Display loading element when an $http request is running
        * (except for GET connect requests) 
        */
        .directive('loading', ['$http', loadingFct]);

        function loadingFct($http) {
            return {
                restrict: 'A',
                link: function (scope, elm, attr) {
                    scope.isLoading = function () {
                        if ($http.pendingRequests.length === 1) {
                            if ($http.pendingRequests[0]['method'] === 'GET' && $http.pendingRequests[0]['url'].slice(-8) === '/connect') {
                                return false;
                            }
                        }
                        return $http.pendingRequests.length > 0;
                    };
                    scope.$watch(scope.isLoading, function (v) {
                        if (v) {
                            elm.show();
                        }
                        else {
                            elm.hide();
                        }
                    });
                }
            };
        };
        
})(window.jQuery);
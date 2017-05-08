/**
 * @ngdoc directive
 */
function headerDirective() {
    return {
        restrict: 'E',
        templateUrl: 'components/header/header.html'
    };
}

/**
 * @namespace app.components.header
 * @requires ng
 */
angular.module('app.components.header', [
    'ng'
]).directive('header', headerDirective);
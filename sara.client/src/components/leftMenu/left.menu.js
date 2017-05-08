/**
 * @ngdoc directive
 */
function leftMenuDirective() {
    return {
        restrict: 'E',
        templateUrl: 'components/leftMenu/left.menu.html'
    };
}

/**
 * @namespace app.components.header
 * @requires ng
 */
angular.module('app.components.left.menu', [
    'ng'
]).directive('leftMenu', leftMenuDirective);
/**
 * @ngdoc directive
 */
function footerDirective() {
    return {
        restrict: 'E',
        templateUrl: 'components/footer/footer.html'
    };
}

/**
 * @namespace app.components.footer
 * @requires ng
 */
angular.module('app.components.footer', [
    'ng'
]).directive('footer', footerDirective);
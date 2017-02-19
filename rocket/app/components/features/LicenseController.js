(function () {
    'use strict';

    /* Search Controller */

    angular.module('rocket')
            .controller('licenseController', ['$scope', LicenseController]);

    function LicenseController($scope) {
        
        /*
         * Return license url get from parent controller
         */
        $scope.getLicenseUrl = function() {
            return $scope.ngDialogData['licenseUrl'];
        };
        
    };
    
})();
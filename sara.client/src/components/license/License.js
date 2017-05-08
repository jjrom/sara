
angular.module('app.component.license',[])
            .directive('license', LicenseDirective);

    function LicenseDirective() {
        return {
            restrict : "E",
            controller : LicenseController,
            controllerAs : "licenseCtrl",
            templateUrl : "components/license/license.html"
        };
    }

    function LicenseController() {
        
        /*
         * Return license url get from parent controller
         */
        var self = this;
        self.getLicenseUrl = function() {
            return self.ngDialogData.licenseUrl;
        };
        
    }
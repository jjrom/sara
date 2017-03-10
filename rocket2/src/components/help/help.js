angular.module('app.components.help',[])
    .directive("help", helpDirective);

    function helpDirective() {
        return {
            restrict : "E",
            templateUrl : "components/help/help.html"
        };
        
    }
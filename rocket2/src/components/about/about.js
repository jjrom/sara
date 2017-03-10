angular.module('app.components.about',[])
    .directive('about', aboutDirective);

    function aboutDirective() {
        return {
            restrict : "E",
            templateUrl : "components/about/about.html"
        };

    }
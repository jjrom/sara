
angular.module('app.components.search.filters', [])
            .directive('searchFilters', searchFiltersDirective);

    function searchFiltersDirective() {
        return {
            restrict : "E",
            // controller : searchFiltersController,
            // controllerAs : "searchFiltersCtrl",
            templateUrl : "components/search-filters/search.filters.html"
        };
    }

    // function searchFiltersController() {
    //
    // }

angular.module('collectionsComponentModule',[])
    .directive('collections',collectionsDirective);

function collectionsDirective(){
    return {
        restrict :"E",
        controller : collectionsController,
        controllerAs : 'collectionsCtrl',
        templateUrl : 'components/collections/collections.component.html'
    };
}

    collectionsController.$inject = [];

    collectionsController = function () {
    
    };
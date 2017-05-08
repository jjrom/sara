angular.module('app.component.collections',[])
    .directive('collections',collectionsDirective);

function collectionsDirective(){
    return {
        restrict :"E",
        // controller : collectionsController,
        // controllerAs : 'collectionsCtrl',
        templateUrl : 'components/collections/collections.html'
    };
}

    // collectionsController = function () {
    //     var self = this;
    //
    // };
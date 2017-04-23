angular.module('app.components.home',['rocketCacheServiceModule','restoCollectionsApiModule','rocketServicesModule'])
    .directive("home",homeDirective);


/**
 * @ngdoc directive
 */
function homeDirective() {
    return {
        restrict: 'E',
        templateUrl: 'components/home/home.html',
        controller: HomeController,
        controllerAs: 'homeCtrl'
    };
}


//Supporter avec la minification
//Injecter le nom de la service dans le dépendence de la controller

HomeController.$inject=['rocketServices','rocketCache','restoCollectionsAPI'];

function HomeController(rocketServices, rocketCache, restoCollectionsAPI) {

    /**
     * Got to product function
     *
     * @param {string} featureId
     * @param {string} collectionName
     */
    var self = this;
    self.viewProduct = function (featureId, collectionName) {
        rocketServices.go('feature', {
                collectionName: collectionName,
                featureId: featureId
            },
            {
                reload: true
            });
    };

    /**
     * Search function
     * @hb
     */
    self.search = function () {
        rocketCache.remove('lastSearch');
        rocketServices.go('explore', {
            q: self.query
        });
    };
    /**
     * Initialize 20 empty squares grid
     */
    self.features = [];
    for (var i = 0, ii = 20; i < ii; i++) {
        self.features.push({
            id: -1
        });
    }

    /*
     * Get latest acquisitions
     */
    restoCollectionsAPI.search({
            cacheName: 'latest'
        },
        function (data) {
            self.features = data.features;
        },
        function (data) {
        });

    /*
     * Get collections
     */
    restoCollectionsAPI.getCollections(function (data) {
            self.collections = [];
            var length = data.collections.length;
            for (var i = 0; i < length; i++) {
                var item = [];
                item.name = data.collections[i].name;
                item.counter = data.collections[i].statistics.count;
                if (data.collections[i].osDescription[rocketServices.getLang()]) {
                    item.friendlyName = data.collections[i].osDescription[rocketServices.getLang()].LongName;
                    item.Description = data.collections[i].osDescription[rocketServices.getLang()].Description;
                } else {
                    item.friendlyName = data.collections[i].osDescription.LongName;
                    item.Description = data.collections[i].osDescription.Description;
                }
                self.collections.push(item);
            }
        },
        function (error) {
        });

    /*
     * Focus on search
     */
    rocketServices.focus('searchinput');

}
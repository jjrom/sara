(function () {
    'use strict';

    /* Search Controller */

    angular.module('rocket')
            .controller('SearchController', ['$scope', '$state', '$location', '$timeout', 'ngDialog', 'rocketServices', 'rocketMap', 'rocketCart', 'restoCollectionsAPI', 'restoFeatureAPI', 'config', SearchController]);

    function SearchController($scope, $state, $location, $timeout, ngDialog, rocketServices, rocketMap, rocketCart, restoCollectionsAPI, restoFeatureAPI, config) {

        /*
         * Variable
         */
        $scope.features = [];
        $scope.hasChanged = false;
        $scope.hasNoMore = false;
        $scope.maxRecords = config.maxRecords ? config.maxRecords : 20,
                $scope.resultCounter = {
                    totalResults: 0,
                    start: 0,
                    end: 0
                };
        $scope.query = [];
        $scope.searchPolygon = null;
        $scope.polygonDrawningActivated = false;

        // nb of items in current collection
        $scope.count = 0;

        $scope.$on('$locationChangeSuccess', function () {
            $scope.view($location.search()['view'], false);
        });

        /**
         * Update state with input from the List view
         */
        $scope.updateSearchParams = function () {
            for (var key in $scope.listform) {
                if (typeof $scope.listform[key] !== 'undefined') {
                    $scope.params[key] = $scope.listform[key];
                }
            }
            $scope.search();
        };

        /**
         * Change panel view
         * 
         * @param {string} panel
         * @param {boolean} updatelocation
         * @param {string} collectionName
         * @param {string} featureId
         */
        $scope.view = function (panel, updatelocation, collectionName, featureId) {

            switch (panel) {
                case 'metadata':
                    rocketServices.go('feature', {
                        collectionName: collectionName,
                        featureId: featureId
                    },
                            {
                                reload: true
                            });
                    break;
                default:
                    $scope.viewList(updatelocation);
            }
        };

        /**
         * Show list view
         * 
         * @param {boolean} updateLocation
         */
        $scope.viewList = function (updateLocation) {
            $scope.showDefault = false;
            $scope.showList = true;
            $scope.hideMap();

            /*
             * Openlayers issue with resize...
             */
            $timeout(function () {
                rocketMap.map.updateSize();
                rocketMap.map.render();
            }, 100);

            if ($scope.hasChanged) {
                rocketMap.zoomOnLayer();
            }

            /*
             * Update location bar
             */
            if (updateLocation) {
                $location.search($.extend($scope.getSearchParams(), {
                    view: 'list'
                }));
            }

        };

        /**
         * Open dialog with search filters information
         */
        $scope.showFilters = function () {
            var queryAnalysis;
            if ($scope.query && $scope.query.analysis) {
                queryAnalysis = {
                    location: $scope.query.analysis.analyze ? $scope.query.analysis.analyze.Where[0] : {},
                    searchFilters: $scope.query.searchFilters || [],
                    errors: $scope.query.analysis.analyze ? $scope.query.analysis.analyze.Errors : []
                };
            } else {
                queryAnalysis = {
                    searchFilters: [],
                    errors: []
                };
            }

            ngDialog.open({
                controller: 'searchFiltersController',
                templateUrl: "app/components/features/searchFilters.html",
                data: queryAnalysis
            });
        };

        /**
         * Launch search on resto
         */
        $scope.search = function () {
            $scope.initSearchContext();

            $location.search($.extend($scope.getSearchParams(), {
                view: $location.search()['view']
            }));
            $scope.getFeatures(false);
        };

        /**
         * Reset all search filters excepted collection
         */
        $scope.reset = function () {
            /*
             * Save collection if set
             */
            if ($scope.params && $scope.params.collection) {
                var collection = $scope.params.collection;
            }

            /*
             * Reset params
             */
            $scope.params = {
                page: 1,
                view: $scope.params['view']
            };

            /*
             * Restore collection if set
             */
            if (collection) {
                $scope.params.collection = collection;
            }

            /*
             * Reset search polygon
             */
            $scope.resetSearchPolygon();

            /*
             * Launch search
             */
            $scope.search();
        };

        /**
         * Get feature
         * 
         * @param {string} id
         * @returns {undefined}
         */
        $scope.getFeature = function (id) {
            for (var i = 0, ii = $scope.features.length; i < ii; i++) {
                if ($scope.features[i].id === id) {
                    return $scope.features[i];
                }
            }
            return null;
        };

        /**
         * Get features
         * 
         * @param {boolean} append
         * @returns {undefined}
         */
        $scope.getFeatures = function (append) {

            /*
             * Launch request to resto search endpoint
             */

            var _params = $scope.getSearchParams();
            if (_params.geometry) {
                /*
                 * If a geometry is defined, project it in server wanted projection
                 */
                _params.geometry = $scope.projectWKTpolygonNomenclature('EPSG:3857', 'EPSG:4326', _params.geometry);
            }

            restoCollectionsAPI.search(_params, function (data) {
                return $scope.updateSearchContext(data, append);
            }, function () {
                rocketServices.error('search.error');
            });

        };

        /**
         * Update features and map
         * 
         * append : if true concat data with previous results
         * 
         * @param {array} data
         * @param {boolean} append
         * @returns {boolean}
         */
        $scope.updateSearchContext = function (data, append) {

            /*
             * Update search info
             */
            if (!append) {
                $scope.query = data.query || data.properties.query;
            }

            /*
             * Features changed
             */
            $scope.hasChanged = true;

            /*
             * Clear data
             */
            $scope.features = append === false ? data.features : $scope.features.concat(data.features)

            $scope.resultCounter.start = $scope.maxRecords * $scope.params.page - $scope.maxRecords;
            $scope.resultCounter.end = $scope.maxRecords * $scope.params.page - $scope.maxRecords + data.features.length;
            
            /*
             * No more features
             */
            if ($scope.resultCounter.end == data.properties.totalResults || data.features.length < $scope.maxRecords) {
                $scope.hasNoMore = true;
            } else {
                $scope.hasNoMore = false;
            }

            /*
             * Get total results count
             */
            $scope.resultCounter.totalResults = data.properties.totalResults;
            if ($scope.resultCounter.totalResults < $scope.resultCounter.end || ($scope.hasNoMore && $scope.resultCounter.totalResults !== $scope.resultCounter.end)) {
                /*
                 * totalResults is an estimation, 
                 * if this estimation is under real count use end limit
                 */
                $scope.resultCounter.totalResults = $scope.resultCounter.end;
            }

            /*
             * Update main map
             */
            rocketMap.updateLayer(data.features, {
                'append': append
            });
            rocketMap.zoomOnLayer();

            /*
             * Tell user if no result
             */
            if (!append && $scope.features.length === 0) {
                rocketServices.error('search.noresult');
            }

            return true;
        };

        /**
         * Note: launch search only if there are still
         * features to search for
         */
        $scope.loadMore = function () {
            $scope.params.page = $scope.params.page + 1;
            $scope.getFeatures(true);
        };

        /*
         * Load next page results
         */
        $scope.nextPage = function () {
            /*
             * Increase page counter
             */
            $scope.params.page = $scope.params.page * 1 + 1;

            $location.search($.extend($scope.getSearchParams(), {
                view: $location.search()['view']
            }));

            /*
             * Get features
             */
            $scope.getFeatures(false);
        };

        /*
         * Load previous page results
         */
        $scope.previousPage = function () {
            /*
             * Decrease page
             */
            $scope.params.page = $scope.params.page * 1 - 1;

            $location.search($.extend($scope.getSearchParams(), {
                view: $location.search()['view']
            }));

            /*
             * Get features
             */
            $scope.getFeatures(false);
        };

        /*
         * Init the context
         */
        $scope.init = function () {

            $scope.initSearchContext();

            var launchSearch = false;

            /*
             * Assign state values to scope
             */
            for (var param in $state.params) {
                if (typeof ($state.params[param]) !== 'undefined' && param !== 'collection' && param !== 'view') {
                    launchSearch = true;
                }

                if (param === 'page') {
                    $scope.params[param] = ($state.params[param] && !isNaN(parseInt($state.params[param]))) ? parseInt($state.params[param]) : $scope.params[param];
                } else if (param !== 'view') {
                    $scope.params[param] = $scope.params[param] ? $scope.params[param] : $state.params[param];
                }
            }

            /*
             * Get collections
             */
            restoCollectionsAPI.getCollections(function (data) {
                /*
                 * Is a collection selected ?
                 */
                if ($scope.params && $scope.params.collection) {
                    var length = data.collections.length;
                    for (var i = 0; i < length; i++) {
                        if (data.collections[i]['name'] === $scope.params.collection) {
                            $scope.count = data.synthesis.statistics.facets.collection[$scope.params.collection];
                            $scope.statistics = data.collections[i].statistics.facets;
                            if (data.collections[i]['osDescription']) {
                                $scope.friendlyName = data.collections[i]['osDescription']['LongName'];
                                $scope.Description = data.collections[i]['osDescription']['Description'];
                            }
                        }
                    }
                } else {
                    $scope.statistics = data.synthesis.statistics.facets;
		    if (data.synthesis.statistics.count){
		    	 $scope.count = data.synthesis.statistics.count;
		    }
                }
            }, function () {
                rocketServices.success('error.server.connect');
            });

            /*
             * If a geometry is defined in url parameters draw it
             */
            if ($scope.params.geometry) {
                $scope.activatePolygonDrawning();
                rocketMap.addDrawnedFeature($scope.generateArrayFromWKTpolygonNomenclature($scope.params.geometry));
                $scope.activatePolygonDrawning();
            }

            $scope.view($state.params.view);
            if (launchSearch) {
                $scope.getFeatures(false);
            }
        };

        /**
         * Initialize page values
         */
        $scope.initSearchContext = function () {
            $scope.params = $scope.params || {};
            $scope.params.page = 1;
            $scope.hasNoMore = false;
        };

        /**
         * Return current params without page
         * 
         * @returns {Object}
         */
        $scope.getSearchParams = function () {
            var searchParams = {};
            for (var key in $scope.params) {
                if (typeof $scope.params[key] !== 'undefined') {
                    searchParams[key] = $scope.params[key];
                }
            }

            if ($scope.searchPolygon) {
                searchParams.geometry = $scope.generateWKTpolygonNomenclature($scope.searchPolygon);
            }

            return searchParams;
        };

        /*
         * Update local search polygon
         * 
         * @param {array} coordinates
         * @returns {undefined}
         */
        $scope.updateSearchPolygon = function (coordinates) {
            $timeout(function () {
                if ($scope.searchPolygon !== null) {
                    $scope.searchPolygon = $scope.searchPolygon.concat(coordinates[0]);
                } else {
                    $scope.searchPolygon = coordinates[0];
                    $scope.activatePolygonDrawning();
                }
            });
        };

        /*
         * Reset search polygon
         * 
         * 1. Set local searchPolygon to null
         * 2. Deactivate polygon drawning
         */
        $scope.resetSearchPolygon = function () {
            $scope.searchPolygon = null;
            $scope.polygonDrawningActivated = false;
            rocketMap.resetDrawnedOverlay();
        };

        /**
         * Activate polygon drawning
         */
        $scope.activatePolygonDrawning = function () {
            /*
             * Activate polygon drawning if is not
             * Else, deactivate polygon drawning
             */
            if (!$scope.polygonDrawningActivated) {
                /*
                 * reset drawned polygon
                 */
                $scope.searchPolygon = null;
                $scope.polygonDrawningActivated = true;
                rocketMap.activatePolygonDrawning(function (coordinates) {
                    $scope.updateSearchPolygon(coordinates);

                });
            } else {
                $scope.polygonDrawningActivated = false;
                rocketMap.deactivatePolygonDrawning();
            }
        };

        /*
         * Generate WKT nomenclature for a given polygon
         * 
         * @param {array} polygon : as to be an array
         * @returns {string}
         */
        $scope.generateWKTpolygonNomenclature = function (polygon) {
            if (polygon) {
                /*
                 * Construct WKY geometry
                 */
                var WKTpolygon = 'POLYGON((';
                var first = true;
                for (var i = 0; i < polygon.length; i++) {
                    var point = polygon[i];
                    if (first) {
                        WKTpolygon = WKTpolygon + point[0] + ' ' + point[1];
                        first = false;
                    } else {
                        WKTpolygon = WKTpolygon + ',' + point[0] + ' ' + point[1];
                    }
                }
                WKTpolygon = WKTpolygon + '))';

                return WKTpolygon;

            } else {
                return null;
            }

        };

        /*
         * Generate WKT nomenclature for a given multi polygon
         * 
         * @param {array} polygon : as to be an array
         * @returns {string}
         */
        $scope.generateWKTmultipolygonNomenclature = function (multypolygon) {
            if (multypolygon) {
                /*
                 * Construct WKY geometry
                 */
                var WKTpolygon = 'MULTIPOLYGON(((';

                var firstPolygon = true;
                for (var j = 0; j < multypolygon.length; j++) {
                    var first = true;
                    var polygon = multypolygon[j];
                    if (firstPolygon === false) {
                        WKTpolygon = WKTpolygon + ', ((';
                    } else {
                        firstPolygon = false;
                    }
                    for (var i = 0; i < polygon.length; i++) {
                        var point = polygon[i];
                        if (first) {
                            WKTpolygon = WKTpolygon + point[0] + ' ' + point[1];
                            first = false;
                        } else {
                            WKTpolygon = WKTpolygon + ',' + point[0] + ' ' + point[1];
                        }
                    }

                    WKTpolygon = WKTpolygon + '))';
                }
                WKTpolygon = WKTpolygon + ')';

                return WKTpolygon;

            } else {
                return null;
            }

        };

        /**
         * Project input WKT polygon in wanted projection
         * 
         * @param {string} inProj
         * @param {string} outProj
         * @param {string} polygon : WKT polygon
         * @returns {unresolved}
         */
        $scope.projectWKTpolygonNomenclature = function (inProj, outProj, polygon) {
            /*
             * Project geometry in EPSG:4326
             * 
             * @type @new;ol.format.WKT
             */
            var format = new ol.format.WKT();
            var feature = format.readFeature(polygon);
            feature.getGeometry().transform(inProj, outProj);
            return format.writeFeature(feature);
        };

        /*
         * Generate Array from WKT polygon nomenclature
         * 
         * WARNING : WKT geometry has to be a polygon
         * 
         * @param {string} WKT polygon : as to be a string
         * @returns {array}
         */
        $scope.generateArrayFromWKTpolygonNomenclature = function (s_polygon) {
            if (s_polygon) {
                try {
                    var r_array = [];
                    s_polygon = s_polygon.replace('POLYGON((', '');
                    s_polygon = s_polygon.replace('))', '');
                    var t_polygon = s_polygon.split(",");

                    for (var i = 0; i < t_polygon.length; i++) {
                        var t_coordinate = t_polygon[i].split(" ");
                        r_array.push([t_coordinate[0], t_coordinate[1]]);
                    }

                    return r_array;
                } catch (e) {
                    return null;
                }

            } else {
                return null;
            }

        };

        /*
         * Map initialization
         */
        var menuConfig = {
            target: 'staticmap',
            close: {
                title: 'Close'
            },
            viewMetadata: {
                title: 'View metadata',
                callback: function (feature) {
                    if (feature) {
                        rocketServices.go('feature', {
                            collectionName: feature.getProperties().collection,
                            featureId: feature.getId()
                        },
                                {
                                    reload: true
                                });
                    }
                }
            }
        };

        /*
         * Map menu actions depends on user profile
         */
        if (rocketServices.isAuthenticated()) {
            menuConfig['viewFullResolution'] = {
                title: 'View product in full resolution'
            };
            menuConfig['hideFullResolution'] = {
                title: 'Hide full resolution product'
            };
            menuConfig['download'] = {
                title: 'View metadata',
                callback: function (feature) {
                    if (feature) {
                        restoFeatureAPI.download($scope.getFeature(feature.getId()));
                    }
                }
            };
            menuConfig['cart'] = {
                title: 'Add to cart',
                callback: function (feature) {
                    if (feature) {
                        rocketCart.add($scope.getFeature(feature.getId()),
                                function () {
                                    rocketServices.success('cart.add.success');
                                },
                                function () {
                                    rocketServices.success('cart.add.error');
                                });
                    }
                }
            };
        }

        rocketMap.init({
            target: 'staticmap',
            background: config.map.background,
            hilite: true,
            map3D: false,
            fullScreen: false,
            menuConfig: menuConfig
        });

        /*
         * Hide map - CESIUM bug needs to switch to 2D
         * or browser hangs
         */
        $scope.hideMap = function () {
            if (rocketMap.map3D) {
                rocketMap.map3D.ol3d.setEnabled(false);
            }
            $scope.showMap = false;
        };

        /*
         * Focus on search
         */
        rocketServices.focus('searchinput');

        $scope.init();
    }
    ;

})();

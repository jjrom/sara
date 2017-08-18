angular.module('app.component.explore',[])
    .directive('explore', exploreDirective);

    function exploreDirective(){
        return {
            restrict :"E",
            controller : exploreController,
            controllerAs : "exploreCtrl",
            templateUrl : "components/explore/explore.html"
        };
    }

    exploreController.$inject = ['$scope', '$state', '$location', '$timeout', 'ngDialog',
        'rocketServices', 'rocketMap', 'rocketCart', 'restoCollectionsAPI', 'restoFeatureAPI', 'config'];

    function exploreController ($scope, $state, $location, $timeout, ngDialog, rocketServices,
                                rocketMap, rocketCart, restoCollectionsAPI, restoFeatureAPI, config){

        /*
         * Variable
         */
        var self = this;
        self.features = [];
        self.hasChanged = false;
        self.hasNoMore = false;
        self.maxRecords = config.maxRecords ? config.maxRecords : 20;
        self.resultCounter = {
            totalResults: 0,
            start: 0,
            end: 0
        };
        self.query = [];
        self.searchPolygon = null;
        self.polygonDrawningActivated = false;

        self.orbitDirections = {'Ascending':'Ascending','Descending' : 'Descending'};

        self.polarisations = {'HH':'HH','HH+HV':'HH+HV', 'HV':'HV','VH':'VH','VV':'VV', 'VV+VH':'VV+VH'};

        // nb of items in current collection
        self.count = 0;

        var countAroundProductNumber = function (number) {
            var digits_number = number.toString().length;
            var x_number = Math.pow(10,digits_number-1);
            var new_number = number / x_number;
            new_number = new_number.toFixed(2);
            return new_number * x_number;
        };

        $scope.$on('$locationChangeSuccess', function () {
            self.view($location.search().view, false);
        });

        /**
         * Update state with input from the List view
         */
        self.updateSearchParams = function () {
            for (var key in self.listform) {
                if (typeof self.listform[key] !== 'undefined') {
                    self.params[key] = self.listform[key];
                }
            }
            self.search();
        };

        self.changeCloudCover = function () {
            if(angular.isUndefined(self.cloudCover)){
                self.cloudCover = 100;
            } else if(self.cloudCover === null){
                delete self.params.cloudCover;
            } else {
                self.params.cloudCover = self.cloudCover+"]";
            }

        };

        /**
         * @hb
         * Change panel view
         *
         * @param {string} panel
         * @param {boolean} updatelocation
         * @param {string} collectionName
         * @param {string} featureId
         */
        self.view = function (panel, updatelocation, collectionName, featureId) {

            switch (panel) {
                case 'metadata':
                    rocketServices.go('result', {
                            collectionName: collectionName,
                            featureId: featureId
                        },
                        {
                            reload: true
                        });
                    break;
                default:
                    self.viewList(updatelocation);
            }
        };

        /**
         * Show list view
         *
         * @param {boolean} updateLocation
         */
        self.viewList = function (updateLocation) {
            self.showDefault = false;
            self.showList = true;
            self.hideMap();

            /*
             * Openlayers issue with resize...
             */
            $timeout(function () {
                rocketMap.map.updateSize();
                rocketMap.map.render();
            }, 100);

            if (self.hasChanged) {
                rocketMap.zoomOnLayer();
            }

            /*
             * Update location bar
             */
            if (updateLocation) {
                $location.search($.extend(self.getSearchParams(), {
                    view: 'list'
                }));
            }

        };

        self.getKeyValueWhen = function (obj) {
            var key = Object.keys(obj)[0];
            return key+':'+obj[key];
        };

        self.cleanDateString = function (stringDate) {
            return stringDate.substring(0,10);
        };

        /**
         * Open dialog with search filters information
         */
        self.showFilters = function () {
            var queryAnalysis;
            if (self.query && self.query.analysis) {
                queryAnalysis = {
                    location: self.query.analysis.analyze ? self.query.analysis.analyze.Where[0] : {},
                    searchFilters: self.query.searchFilters || [],
                    errors: self.query.analysis.analyze ? self.query.analysis.analyze.Errors : []
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
        self.search = function () {

            delete self.params.q;

            self.initSearchContext();

            $location.search($.extend(self.getSearchParams(), {
                view: $location.search().view
            }));


            self.getFeatures(false);
        };

        /**
         * Reset all search filters excepted collection
         */
        self.reset = function () {
            /*
             * Save collection if set
             */
            var collection = null;
            if (self.params && self.params.collection) {
                collection = self.params.collection;
            }

            /*
             * Reset params
             */
            self.params = {
                page: 1,
                view: self.params.view
            };

            /*
             * Restore collection if set
             */
            if (collection !== null) {
                self.params.collection = collection;
            }

            /*
             * Reset search polygon
             */
            self.resetSearchPolygon();

            /*
             * Launch search
             */
            self.search();
        };

        /**
         * Get feature
         *
         * @param {string} id
         * @returns {undefined}
         */
        self.getFeature = function (id) {
            for (var i = 0, ii = self.features.length; i < ii; i++) {
                if (self.features[i].id === id) {
                    return self.features[i];
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
        self.getFeatures = function (append) {

            /*
             * Launch request to resto search endpoint
             */

            var _params = self.getSearchParams();
            if (_params.geometry) {
                /*
                 * If a geometry is defined, project it in server wanted projection
                 */
                _params.geometry = self.projectWKTpolygonNomenclature('EPSG:3857', 'EPSG:4326', _params.geometry);
            }

            restoCollectionsAPI.search(_params, function (data) {

                self.exactCount = data.properties.exactCount;
                self.analysis = data.properties.query.analysis;

                if(self.analysis.analyze.When.times){
                    self.params.startDate = self.analysis.analyze.When.times[0]['time:start'].substring(0,10);
                    self.params.completionDate = self.analysis.analyze.When.times[0]['time:end'].substring(0,10);
                }


                if(self.analysis.analyze.What['eo:platform'] === "S1A|S1B"){
                    self.params.collection = "S1";
                }

                if(self.analysis.analyze.What['eo:platform'] === "S2A|S2B"){
                    self.params.collection = "S2";
                }

                if(self.analysis.analyze.What['eo:platform'] === "S3A|S3B"){
                    self.params.collection = "S3";
                }

                // Handle the case of instrument

                if(self.analysis.analyze.What['eo:instrument']){
                    self.params.instrument = self.analysis.analyze.What['eo:instrument'];
                }

                return self.updateSearchContext(data, append);
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
        self.updateSearchContext = function (data, append) {
            /*
             * Update search info
             */
            if (!append) {
                self.query = data.query || data.properties.query;
            }

            /*
             * Features changed
             */
            self.hasChanged = true;

            /*
             * Clear data
             */
            self.features = append === false ? data.features : self.features.concat(data.features);

            self.resultCounter.start = self.maxRecords * self.params.page - self.maxRecords+1;

            self.resultCounter.end = self.maxRecords * self.params.page - self.maxRecords + data.features.length;

            /*
             * No more features
             */
            if (self.resultCounter.end == data.properties.totalResults || data.features.length < self.maxRecords) {
                self.hasNoMore = true;
            } else {
                self.hasNoMore = false;
            }

            /*
             * Get total results count
             */
            if(data.properties.exactCount){
                self.resultCounter.totalResults = data.properties.totalResults;
            } else {
                self.resultCounter.totalResults = countAroundProductNumber(data.properties.totalResults);
            }


            if (self.resultCounter.totalResults < self.resultCounter.end || (self.hasNoMore && self.resultCounter.totalResults !== self.resultCounter.end)) {
                /*
                 * totalResults is an estimation,
                 * if this estimation is under real count use end limit
                 */
                self.resultCounter.totalResults = self.resultCounter.end;
            }




            /*
             * Update main map
             */
            rocketMap.updateLayer(self.correctFeaturesJSON(data.features), {
                'append': append
            });
            rocketMap.zoomOnLayer();

            /*
             * Tell user if no result
             */
            if (!append && self.features.length === 0) {
                rocketServices.error('search.noresult');
            }

            return true;
        };

        /**
         * Note: launch search only if there are still
         * features to search for
         */
        self.loadMore = function () {
            self.params.page = self.params.page + 1;
            self.getFeatures(true);
        };

        /*
         * Load next page results
         */
        self.nextPage = function () {
            /*
             * Increase page counter
             */
            self.params.page = self.params.page * 1 + 1;

            $location.search($.extend(self.getSearchParams(), {
                view: $location.search().view
            }));

            /*
             * Get features
             */
            self.getFeatures(false);
        };

        /*
         * Load previous page results
         */
        self.previousPage = function () {
            /*
             * Decrease page
             */
            self.params.page = self.params.page * 1 - 1;

            $location.search($.extend(self.getSearchParams(), {
                view: $location.search().view
            }));

            /*
             * Get features
             */
            self.getFeatures(false);
        };

        /*
         * Init the context
         */
        self.init = function () {

            self.initSearchContext();

            var launchSearch = false;

            /*
             * Assign state values to scope
             */
            for (var param in $state.params) {

                if (typeof ($state.params[param]) !== 'undefined' && param !== 'collection' && param !== 'view') {
                    launchSearch = true;
                }

                if (param === 'page') {
                    self.params[param] = ($state.params[param] && !isNaN(parseInt($state.params[param]))) ? parseInt($state.params[param]) : self.params[param];
                } else if (param !== 'view') {
                    self.params[param] = self.params[param] ? self.params[param] : $state.params[param];
                }

            }


            /*
             * Get collections
             */
            restoCollectionsAPI.getCollections(function (data) {
                /*
                 * Is a collection selected ?
                 */
                // if (self.params && self.params.collection) {
                //     var length = data.collections.length;
                //     for (var i = 0; i < length; i++) {
                //         if (data.collections[i].name === self.params.collection) {
                //             self.count = data.synthesis.statistics.facets.collection[self.params.collection];
                //             self.statistics = data.collections[i].statistics.facets;
                //             if (data.collections[i].osDescription) {
                //                 self.friendlyName = data.collections[i].osDescription.LongName;
                //                 self.Description = data.collections[i].osDescription.Description;
                //             }
                //         }
                //     }
                // } else {
                    self.statistics = data.synthesis.statistics.facets;
                    self.globalStatistics = data.synthesis.statistics.facets;
                    if (data.synthesis.statistics.count){
                        self.count = data.synthesis.statistics.count;
                    }
                // }
            }, function () {
                rocketServices.success('error.server.connect');
            });

            /*
             * If a geometry is defined in url parameters draw it
             */
            if (self.params.geometry) {
                self.activatePolygonDrawning();
                rocketMap.addDrawnedFeature(self.generateArrayFromWKTpolygonNomenclature(self.params.geometry));
                self.activatePolygonDrawning();
            }

            self.view($state.params.view);
            if (launchSearch) {
                self.getFeatures(false);
            }
        };

        self.initForCollection = function () {

            // cleanParams(self.params);
            /*
             * Get Data for collection
             */
            restoCollectionsAPI.getCollections(function (data) {
                /*
                 * Is a collection selected ?
                 */
                if (self.params && self.params.collection) {
                    var length = data.collections.length;
                    for (var i = 0; i < length; i++) {
                        if (data.collections[i].name === self.params.collection) {
                            self.statistics = data.collections[i].statistics.facets;
                        }
                    }
                } else {
                    self.params.orbitDirection = "";
                    self.params.polarisation = "";
                    self.statistics = null;
                }
            }, function () {
                rocketServices.success('error.server.connect');
            });
        };

        /**
         * Initialize page values
         */
        self.initSearchContext = function () {
            self.params = self.params || {};
            self.params.page = 1;
            self.hasNoMore = false;
        };


        /**
         * Return current params without page
         *
         * @returns {Object}
         */
        self.getSearchParams = function () {
            var searchParams = {};
            for (var key in self.params) {
                if (typeof self.params[key] !== 'undefined') {
                    searchParams[key] = self.params[key];
                }
            }

            if (self.searchPolygon) {
                searchParams.geometry = self.generateWKTpolygonNomenclature(self.searchPolygon);
            }

            return searchParams;
        };

        /*
         * Update local search polygon
         *
         * @param {array} coordinates
         * @returns {undefined}
         */
        self.updateSearchPolygon = function (coordinates) {
            $timeout(function () {
                if (self.searchPolygon !== null) {
                    self.searchPolygon = self.searchPolygon.concat(coordinates[0]);
                } else {
                    self.searchPolygon = coordinates[0];
                    self.activatePolygonDrawning();
                }
            });
        };

        /*
         * Reset search polygon
         *
         * 1. Set local searchPolygon to null
         * 2. Deactivate polygon drawning
         */
        self.resetSearchPolygon = function () {
            self.searchPolygon = null;
            self.polygonDrawningActivated = false;
            rocketMap.resetDrawnedOverlay();
        };

        /**
         * Activate polygon drawning
         */
        self.activatePolygonDrawning = function () {
            /*
             * Activate polygon drawning if is not
             * Else, deactivate polygon drawning
             */
            if (!self.polygonDrawningActivated) {
                /*
                 * reset drawned polygon
                 */
                self.searchPolygon = null;
                self.polygonDrawningActivated = true;
                rocketMap.activatePolygonDrawning(function (coordinates) {
                    self.updateSearchPolygon(coordinates);

                });
            } else {
                self.polygonDrawningActivated = false;
                rocketMap.deactivatePolygonDrawning();
            }
        };

        /*
         * Generate WKT nomenclature for a given polygon
         *
         * @param {array} polygon : as to be an array
         * @returns {string}
         */
        self.generateWKTpolygonNomenclature = function (polygon) {
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
        self.generateWKTmultipolygonNomenclature = function (multypolygon) {
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
        self.projectWKTpolygonNomenclature = function (inProj, outProj, polygon) {
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
        self.generateArrayFromWKTpolygonNomenclature = function (s_polygon) {
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

        /**
         * HACK TO FIX THE FEATURES OUT OF THE WORLD
         * 02/08/2017
         * @param features
         * @returns {*}
         */
        self.correctFeaturesJSON = function (features) {
            var i,k;
            for (i = 0; i < features.length; i++) {
                var topind = -1;
                var secind = -1;
                var toplat = -100;
                var seclat = -100;
                for (k = 0; k < features[i].geometry.coordinates[0].length; k++) {
                    if (features[i].geometry.coordinates[0][k][1] > toplat) {
                        secind = topind;
                        seclat = toplat;
                        topind = k;
                        toplat = features[i].geometry.coordinates[0][k][1];
                    } else {
                        if (features[i].geometry.coordinates[0][k][1] > seclat) {
                            secind = k;
                            seclat = features[i].geometry.coordinates[0][k][1];
                        }
                    }
                    if(features[i].geometry.coordinates[0][k][0] > 180){
                        features[i].geometry.coordinates[0][k][0] += 180 ;
                        features[i].geometry.coordinates[0][k][0] %= 360 ;
                        features[i].geometry.coordinates[0][k][0] -= 180 ;
                    }
                }
                console.log("Top 2 index "+topind+", "+secind+"; top 2 lat "+toplat+", "+seclat);
                for (k = 0; k < features[i].geometry.coordinates[0].length-1; k++) {
                    if (Math.abs(features[i].geometry.coordinates[0][k][0] - features[i].geometry.coordinates[0][k+1][0]) >360 ) {
                       if (features[i].geometry.coordinates[0][k][0] > features[i].geometry.coordinates[0][k+1][0]) {
                           features[i].geometry.coordinates[0][k+1][0] += 360;
                       } else {
                           features[i].geometry.coordinates[0][k+1][0] -= 360;
                       }
                    }
                    if (Math.abs(features[i].geometry.coordinates[0][k][0] - features[i].geometry.coordinates[0][k+1][0]) > 180 && !(seclat>80 && (k === topind && k+1 === secind || k === secind && k+1 === topind))) {
                        console.log("Feature "+i+" point "+k+" before:"+features[i].geometry.coordinates[0][k][0]+":"+features[i].geometry.coordinates[0][k][1]+","+features[i].geometry.coordinates[0][k+1][0]+":"+features[i].geometry.coordinates[0][k+1][1]);
	                if (features[i].geometry.coordinates[0][k][0] > features[i].geometry.coordinates[0][k+1][0]) {
                             features[i].geometry.coordinates[0][k+1][0] += 360;
                        } else {
                             features[i].geometry.coordinates[0][k+1][0] -= 360;
                        }
	               	console.log("Feature "+i+" point "+k+" after:"+features[i].geometry.coordinates[0][k][0]+":"+features[i].geometry.coordinates[0][k][1]+","+features[i].geometry.coordinates[0][k+1][0]+":"+features[i].geometry.coordinates[0][k+1][1]);
                    }
                }
            }
            return features;
        };

        /*
         * Map initialization
         */
        var menuConfig = {
            target: 'staticmap',
            zoom : 2,
            center : [2.348, 48.853],
            close: {
                title: 'Close'
            },
            viewMetadata: {
                title: 'Details',
                callback: function (feature) {
                    if (feature) {
                        rocketServices.go('result', {
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
            menuConfig.viewFullResolution = {
                title: 'View product in full resolution'
            };
            menuConfig.hideFullResolution = {
                title: 'Hide full resolution product'
            };
            menuConfig.download = {
                title: 'View metadata',
                callback: function (feature) {
                    if (feature) {
                        restoFeatureAPI.download(self.getFeature(feature.getId()));
                    }
                }
            };
            menuConfig.cart = {
                title: 'Add to cart',
                callback: function (feature) {
                    if (feature) {
                        rocketCart.add(self.getFeature(feature.getId()),
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

        rocketMap.map.setView(new ol.View({
            zoom : config.map.zoom,
            center : config.map.center
        }));

        /*
         * Hide map - CESIUM bug needs to switch to 2D
         * or browser hangs
         */
        self.hideMap = function () {
            if (rocketMap.map3D) {
                rocketMap.map3D.ol3d.setEnabled(false);
            }
            self.showMap = false;
        };

        /*
         * Focus on search
         */
        rocketServices.focus('searchinput');

        self.init();


    }

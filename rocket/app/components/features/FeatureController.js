(function () {
    'use strict';

    /* Feature Controller */

    angular.module('rocket')
            .controller('FeatureController', ['$scope', '$state', '$timeout', 'rocketServices', 'restoCollectionsAPI', 'config', FeatureController]);

    function FeatureController($scope, $state, $timeout, rocketServices, restoCollectionsAPI , config) {
        
        /*
         * Show property
         * 
         * @param {string} item : property name
         * @returns {Boolean}
         */
        $scope.showProperty = function(item) {
            if (angular.isString(item)){
                return true;
            } else if (angular.isNumber(item)) {
                return true;
            } else {
                return false;
            }
        };
        
        /*
         * Initialize view
         */
        $scope.init = function() {
            if ($scope.feature) {
                  
                var keywords = rebuildKeywords($scope.feature.properties.keywords);
                
                /*
                 * resto doesn't translate location and season names
                 */
                for (var name in keywords.location) {
                    keywords.location[rocketServices.translate(name)] = keywords.location[name];
                    delete keywords.location[name];
                }
                for (var name in keywords.season) {
                    keywords.season[rocketServices.translate(name)] = keywords.season[name];
                    delete keywords.season[name];
                }
                $scope.keywords = keywords;
            }
            
            /*
             * Set map
             */
            $('#feature-staticmap').empty();
            $timeout(function() {
                $scope.staticMap = new rocketmap.StaticMap({
                    target:'feature-staticmap',
                    background:config.map.background,
                    controls:true,
                    displayWMS: true,
                    fillColorLocation: "rgba(0, 0, 0, 0)",
                    strokeColorLocation: "black",
                    interactions:true
                });
                $scope.staticMap.update({
                    type: 'FeatureCollection',
                    features: [$scope.feature]
                });
            }, 400);
        };
        
        /**
         * Show feature on map
         * 
         * @param {Object} feature
         * @param {Object} $event
         */
        $scope.viewOnMap = function(feature, $event) {
		if (rocketServices.isAuthenticated()) {
			restoCollectionsAPI.canVisualize(feature,function() {
				$scope.staticMap.addProductLayer(feature);
			},function() {}); 
		}
        };
        
        /**
         * Quote input string if it contains white spaces
         * @param {String} input
         */
        $scope.quote = function (input) {
            return input.indexOf(' ') >= 0 ? '"' + input + '"' : input;
        };
        
        /*
         * Return a structured keywords object from flat keywords object
         * 
         * @param {Object} keywords
         * @returns {Object}
         */
        var rebuildKeywords = function(keywords) {
            
            /*
             * From http://stackoverflow.com/questions/21342596/tree-structure-from-adjacency-list
             */
            var makeTree = (function () {
                var defaultClone = function (record) {
                    var newRecord = JSON.parse(JSON.stringify(record));
                    delete newRecord.parent;
                    return newRecord;
                };
                return function (flat, clone) {
                    return flat.reduce(function (data, record) {
                        var oldRecord = data.catalog[record.id];
                        var newRecord = (clone || defaultClone)(record);
                        if (oldRecord && oldRecord.children) {
                            newRecord.children = oldRecord.children;
                        }
                        data.catalog[record.id] = newRecord;
                        if (record.parent) {
                            var parent = data.catalog[record.parent] = (data.catalog[record.parent] || {id: record.parent});
                            parent.children = parent.children || {};
                            parent.children[newRecord['name']] = newRecord;
                        } else {
                            data.tree[newRecord['name']] = newRecord;
                        }
                        return data;
                    }, {catalog: {}, tree: {}}).tree;
                };
            })();
            
            /**
             * Return cleaned keyword
             * 
             * @param {Object} keywords
             * @param {String} hash
             * @returns {Object}
             */
            function toKeyword(keywords, hash) {
                var keyword = {
                    id: hash
                };
                for (var property in keywords[hash]) {
                    if (property === 'parentHash') {
                        keyword['parent'] = keywords[hash][property];
                    }
                    else {
                        keyword[property] = keywords[hash][property];
                    }
                }
                return keyword;
            };

            /**
             * Convert associative array to simple array
             * 
             * @param {Object} keywords
             * @returns {Array}
             */
            function flatify(keywords) {
                var flatKeywords = [];
                for (var hash in keywords) {
                    flatKeywords.push(toKeyword(keywords, hash));
                }
                return flatKeywords;
            };

            /**
             * Convert keyword tree to structured list
             * 
             * @param {Object} keywords
             * @returns {Array}
             */
            function structure(keywords) {
                var structuredKeywords = {};
                for (var i in keywords) {
                    if (!structuredKeywords[keywords[i]['type']]) {
                        structuredKeywords[keywords[i]['type']] = {};
                    }
                    structuredKeywords[keywords[i]['type']][keywords[i]['name']] = keywords[i];
                }
                return structuredKeywords;
            };

            return structure(makeTree(flatify(keywords)));
        };
        
        /*
         * Get feature from server/cache
         */
        restoCollectionsAPI.getFeature({
            collectionName:$state.params.collectionName,
            featureId:$state.params.featureId
        },
        function (data) {
            $scope.feature = data;
            $scope.init();
        }, function () {
            rocketServices.go('home', null, {
                reload:true
            });
        });
        
        /*
         * Get collections
         */
        restoCollectionsAPI.getCollections(function(data){
            for (var i = 0, ii = data.collections.length; i < ii; i++) {
                if (data.collections[i]['name'] === $state.params.collectionName) {
                    $scope.collection = data.collections[i];
                    $scope.collection['description'] = data.collections[i]['osDescription'][rocketServices.getLang()];
                }
            }
        },
        function(error){
        });
        
    };
    
})();
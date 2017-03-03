/**
 * rocketmap contextual menu
 * 
 * Code mainly from mapshup https://github.com/jjrom/mapshup/blob/master/client/js/mapshup/lib/core/Menu.js
 * 
 * @param {Object} window
 */
(function (window) {

    window.rocketmap = {};

    /**
     * map view
     */
    window.rocketmap.Map = function () {

        /*
         * The div container of the map
         */
        this.target = 'map';

        /*
         * True if map is already initialized
         */
        this.isLoaded = false;

        /*
         * Result layer
         */
        this.layer = null;

        /*
         * Array of product layers
         * For a product image, the product layer is usually a WMS service
         * linked to the full resolution product
         */
        this.productLayers = [];

        /*
         * Feature overlay
         */
        this.selectOverlay = null;

        /*
         * GeoJSON formatter
         */
        this.geoJSONFormatter = null;

        /**
         * Initialize map with input features array
         * 
         * @param {array} options
         */
        this.init = function (options) {

            var self = this;

            options = options || {};

            if (options.target) {
                self.target = options.target;
            }

            self.isLoaded = true;

            /*
             * Initialize menu
             */
            self.mapMenu = new window.rocketmap.Menu(self);
            self.mapMenu.init(options.menuConfig);

            /*
             * Initialize GeoJSON formatter
             */
            self.geoJSONFormatter = new window.ol.format.GeoJSON({
                defaultDataProjection: "EPSG:4326"
            });

            /*
             * Initialize result vector layer
             */
            self.layer = new window.ol.layer.Vector({
                source: new window.ol.source.Vector(),
                style: new window.ol.style.Style({
                    fill: new window.ol.style.Fill({
                        color: 'rgba(255, 0, 255, 0.4)'
                    }),
                    stroke: new window.ol.style.Stroke({
                        color: 'black',
                        width: 1
                    })
                })
            });

            /*
             * Set map controls
             */
            var controls = [
                /*new window.ol.control.ZoomSlider(),*/
                new window.ol.control.ScaleLine()
            ];

            /*
             * Enable full screen
             */
            if (options.fullScreen) {
                controls.push(new window.ol.control.FullScreen());
            }

            /*
             * Enable 3D map
             */
            if (self.hasWebGL() && window.olcs && options.map3D) {
                self.map3D = new window.rocketmap.Map3D(self.map);
                controls.push(new self.map3D.Toggle3DControl({
                    map3D: self.map3D
                }));
            }

            /*
             * Initialize map
             */
            self.map = new window.ol.Map({
                controls: window.ol.control.defaults().extend(controls),
                interactions: window.ol.interaction.defaults({
                    doubleClickZoom: false
                }),
                /*
                 interactions: window.ol.interaction.defaults().extend([
                 new window.ol.interaction.DragRotateAndZoom()
                 ]),*/
                layers: [
                    window.rocketmap.Util.getBackgroundLayer(options.background),
                    self.layer
                ],
                /*
                 * Improve user experience by loading tiles while dragging/zooming.
                 * Will make zooming choppy on mobile or slow devices
                 */
                loadTilesWhileInteracting: true,
                //renderer: ['canvas', 'webgl', 'DOM'],
                target: self.target,
                view: new window.ol.View({
                    center: [0, 0],
                    zoom: 2
                })
            });


            if (options.drawendCallback) {
                /*
                 * Set drawable polygon
                 */
                self.activatePolygonDrawning(options.drawendCallback);
            }

            /*
             * Initialize feature overlay for selected feature
             */
            self.selectOverlay = new window.ol.FeatureOverlay({
                map: self.map,
                style: function (f) {
                    if (self.productLayers[f.getId()]) {
                        return [new window.ol.style.Style({
                                stroke: new window.ol.style.Stroke({
                                    color: '#ff0',
                                    width: 3
                                })
                            })];
                    }
                    return [new window.ol.style.Style({
                            fill: new window.ol.style.Fill({
                                color: 'rgba(255, 255, 128, 0.2)'
                            }),
                            stroke: new window.ol.style.Stroke({
                                color: '#ff0',
                                width: 3
                            })
                        })];
                }
            });

            /*
             * Initialize feature overlay for selected feature
             */
            self.hiliteOverlay = new window.ol.FeatureOverlay({
                map: self.map,
                style: function (f) {
                    if (self.productLayers[f.getId()]) {
                        return [new window.ol.style.Style({
                                stroke: new window.ol.style.Stroke({
                                    color: '#FF0',
                                    width: 1
                                })
                            })];
                    }
                    return [new window.ol.style.Style({
                            fill: new window.ol.style.Fill({
                                color: 'rgba(255, 0, 255, 0.2)'
                            }),
                            stroke: new window.ol.style.Stroke({
                                color: '#f0F',
                                width: 1
                            })
                        })];
                }
            });

            if (options.hilite) {
                /*
                 * Map event - mousemove
                 * Hilite hovered feature on mousemove
                 */

                $(self.map.getViewport()).on('mousemove', function (evt) {
                    var feature = self.map.forEachFeatureAtPixel(self.map.getEventPixel(evt.originalEvent), function (feature, layer) {
                        return feature;
                    });
                    if (feature !== self.hilited) {
                        if (self.hilited) {
                            self.hiliteOverlay.removeFeature(self.hilited);
                        }
                        if (feature) {
                            self.hiliteOverlay.addFeature(feature);
                        }
                        self.hilited = feature;
                    }
                });
            }

            /*
             * Map event - click
             * Display menu
             */
            self.map.on('click', function (evt) {
                var pixel = self.map.getEventPixel(evt.originalEvent);
                var test = self.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                    if (feature && feature.getId()) {
                        self.select(feature.getId());
                        self.mapMenu.show(pixel, feature);
                        return true;
                    }
                    return false;
                });
                if (!test) {
                    self.unselectAll();
                }
            });

            self.map.on('moveend', function () {
                self.mapMenu.updatePosition();
            });

            /*
             * Enable 3D globe
             */
            if (self.map3D) {
                self.map3D.init(self.map);
            }

            self.zoomOnLayer();

            return self;
        };

        /*
         * Max extent for EPSG:3857 projection
         */
        this.maxExtentEPSG3857 = [-20037508.342789, -28023508.959349, 20037508.342789, 105077903.377017];

        /*
         * Resize extent to be in max extent
         * 
         * @param {array} extent
         * @param {array} maxExtent
         * @returns {Object.rocketmap.Map.constrainedExtent.extent}
         */
        this.constrainedExtent = function (extent, maxExtent) {
            /*
             * Check for max and min
             */
            if (extent[0] < maxExtent[0]) {
                extent[0] = maxExtent[0];
            }
            if (extent[1] < maxExtent[1]) {
                extent[1] = maxExtent[1];
            }
            if (extent[2] > maxExtent[2]) {
                extent[2] = maxExtent[2];
            }
            if (extent[3] > maxExtent[3]) {
                extent[3] = maxExtent[3];
            }

            return extent;
        };

        /**
         * Zoom on layer
         */
        this.zoomOnLayer = function () {
            var self = this;
            if (self.isLoaded && self.map) {
                setTimeout(function () {
                    self.map.updateSize();
                    if (self.layer.getSource() && self.layer.getSource().getFeatures().length > 0) {
                        var extent = self.layer.getSource().getExtent();
                        extent = self.constrainedExtent(extent, self.maxExtentEPSG3857);
                        var size = self.map.getSize();
                        self.map.getView().fitExtent(extent, size);
                    }
                }, 200);
            }
        };

        /**
         * Add a WMS layer to map
         * 
         * @param {Object} feature
         */
        this.addProductLayer = function (feature) {
            var id, properties, parsedWMS;

            if (!this.isLoaded || !feature) {
                return null;
            }

            id = feature.getId();
            properties = feature.getProperties();
            if (!properties['services'] || !properties['services']['browse'] || !properties['services']['browse']['layer']) {
                return null;
            }

            /*
             * Remove existing product layer from map if any
             */
            if (this.productLayers[id]) {
                this.map.removeLayer(this.productLayers[id]);
            }

            parsedWMS = window.rocketmap.Util.parseWMSGetMap(properties['services']['browse']['layer']['url']);
            this.productLayers[id] = new window.ol.layer.Tile({
                source: new window.ol.source.TileWMS({
                    attributions: [new window.ol.Attribution({
                            html: 'Test'
                        })],
                    params: {
                        'LAYERS': parsedWMS.layers,
                        'FORMAT': parsedWMS.format
                    },
                    url: parsedWMS.url
                })
            });

            this.map.addLayer(this.productLayers[id]);

        };

        /**
         * Remove a WMS layer from map
         * 
         * @param {string} id : Feature id
         */
        this.removeProductLayer = function (id) {
            if (this.productLayers[id]) {
                this.map.removeLayer(this.productLayers[id]);
                this.productLayers[id] = null;
            }
        };

        /**
         * Update features layer
         * 
         * @param {Object} features - Feature array
         * @param {Object} options :
         *              
         *              {
         *                  append: // true to add features to existing features
         *              } 
         */
        this.updateLayer = function (features, options) {

            if (!this.isLoaded) {
                return null;
            }

            /*
             * Erase previous features unless "append" is set to true
             */
            if (!options.append) {
                this.layer.getSource().clear();
                for (var key in this.productLayers) {
                    this.removeProductLayer(key);
                }
            }

            /*
             * Add features to result layer
             */
            if (features && features.length > 0) {
                this.layer.getSource().addFeatures(this.geoJSONFormatter.readFeatures(JSON.stringify({
                    'type': 'FeatureCollection',
                    'features': features
                }), {
                    featureProjection: 'EPSG:3857'
                }));
            }
        };

        /**
         * Check that map panel is visible
         * 
         * @returns {boolean}
         */
        this.isVisible = function () {
            if (!this.isLoaded || !$('#' + this.target).is(':visible')) {
                return false;
            }
            return true;
        };

        /**
         * Return current map extent in EPSG:4326 projection
         * 
         * @returns {array}
         */
        this.getExtent = function () {
            var extent = [-180, -90, 180, 90];
            if (!this.isLoaded) {
                try {
                    extent = window.ol.extent.applyTransform(this.map.getView().calculateExtent(this.map.getSize()), window.ol.proj.getTransform('EPSG:3857', 'EPSG:4326'));
                } catch (e) {
                }
            }
            return extent;
        };

        /**
         * Activate polygon drawning
         * 
         * @param {function} drawendCallback
         * @returns {undefined}
         */
        this.activatePolygonDrawning = function (drawendCallback) {
            if (this.featureOverlay) {
                this.featureOverlay.setFeatures(null);
            }
            if (this.draw === null || this.modify === null) {
                this.map.addInteraction(this.modify);
                this.map.addInteraction(this.draw);
            } else {
                // The features are not added to a regular vector layer/source,
                // but to a feature overlay which holds a collection of features.
                // This collection is passed to the modify and also the draw
                // interaction, so that both can add or modify features.
                this.featureOverlay = new window.ol.FeatureOverlay({
                    style: new window.ol.style.Style({
                        /*fill: new window.ol.style.Fill({
                         color: 'rgba(255, 255, 255, 0.2)'
                         }),*/
                        stroke: new window.ol.style.Stroke({
                            color: '#ffcc33',
                            width: 2
                        }),
                        image: new window.ol.style.Circle({
                            radius: 7,
                            fill: new window.ol.style.Fill({
                                color: '#ffcc33'
                            })
                        })
                    })
                });
                this.featureOverlay.setMap(this.map);

                this.draw = new window.ol.interaction.Draw({
                    features: this.featureOverlay.getFeatures(),
                    type: /** @type {ol.geom.GeometryType} */ ('Polygon')
                });
                this.map.addInteraction(this.draw);

                this.draw.on('drawend',
                        function (evt) {
                            var geom = evt.feature.getGeometry();
                            if (geom instanceof window.ol.geom.Polygon) {
                                /*
                                 * Pass feature coordinates to callback
                                 */
                                drawendCallback(geom.getCoordinates());
                            }
                        }, this);
            }


        };

        /**
         * Deactivate polygon drawning
         * 
         * @returns {undefined}
         */
        this.deactivatePolygonDrawning = function () {
            if (this.draw) {
                this.map.removeInteraction(this.draw);
            }
            //this.featureOverlay.setFeatures(null);
        };

        /*
         * Rest drawned polygon
         * 
         * @returns {undefined}
         */
        this.resetDrawnedOverlay = function () {
            if (this.featureOverlay) {
                this.featureOverlay.setFeatures(null);
            }
            this.deactivatePolygonDrawning();
        };

        /**
         * Add a feature to the drawnable overlay
         * 
         * @param {array} polyCoords
         * @returns {undefined}
         */
        this.addDrawnedFeature = function (polyCoords) {
            if (polyCoords) {
                if (this.featureOverlay) {
                    var geometry = new window.ol.geom.Polygon([polyCoords]);
                    var feature = new window.ol.Feature({
                        geometry: geometry
                    });
                    this.featureOverlay.addFeature(feature);
                }
            }
        };

        /**
         * Select feature
         * 
         * @param {string} fid
         * @param {boolean} zoomOn
         */
        this.select = function (fid, zoomOn) {
            if (!this.isLoaded) {
                return false;
            }

            var f = this.layer.getSource().getFeatureById(fid);
            if (f) {
                var extent = f.getGeometry().getExtent(), $map = $('#' + this.target);
                this.unselectAll();
                if (zoomOn) {
                    this.map.getView().fitExtent(extent, this.map.getSize());
                    this.mapMenu.show([$map.width() / 2, $map.height() / 2], f);
                }
                if (f !== this.selected) {
                    this.selectOverlay.addFeature(f);
                    this.selected = f;
                }
            }
        };

        /**
         * Unselect all feature
         */
        this.unselectAll = function () {
            this.mapMenu.hide();
            if (this.selected) {
                this.selectOverlay.removeFeature(this.selected);
                this.selected = null;
            }
        };

        /**
         * Return true if webgl is available
         * @returns {Boolean}
         */
        this.hasWebGL = function () {
            try {
                var canvas = document.createElement('canvas');
                return !!window.WebGLRenderingContext && (
                        canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            } catch (e) {
                return false;
            }
        };

        return this;
    };

})(window);

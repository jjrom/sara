/**
 * rocketmap static map
 * 
 * @param {Object} window
 */
(function(window) {

    /**
     * Static Map
     */
    window.rocketmap.StaticMap = function(options) {

        /*
         * The div container of the static map
         */
        this.target = 'staticmap';

        /*
         * Display WMS
         */
        this.displayWMS = false;

        /*
         * Array of product layers
         * For a product image, the product layer is usually a WMS service
         * linked to the full resolution product
         */
        this.productLayers = [];

        /**
         * Initialize map with input features array
         * 
         * @param {array} options
         * 
         *          options.target : name of map div
         *          options.interactions: true - can navigate
         *          options.controls: true - add map controls
         */
        this.init = function(options) {

            if (this.map) {
                return this;
            }

            options = options || {};

            if (options.target) {
                this.target = options.target;
            }
            if (options.displayWMS) {
                this.displayWMS = options.displayWMS;
            }

            /*
             * Location layer contains search area
             */
            this.locationLayer = this.createLayer({
                fillColor: options.fillColorLocation || 'rgba(255, 255, 0, 0.4)',
                strokeColor: options.strokeColorLocation || 'black',
                strokeWidth: 0
            });

            /*
             * Overlay layer contains features result
             */
            this.overlayLayer = this.createLayer({
                fillColor: options.fillColorOverlay || 'rgba(255, 0, 255, 0.1)',
                strokeColor: options.strokeColorOverlay || 'black',
                strokeWidth: 3
            });

            /*
             * Initialize map
             */
            this.map = new window.ol.Map({
                layers: [
                    window.rocketmap.Util.getBackgroundLayer(options.background),
                    this.locationLayer,
                    this.overlayLayer
                ],
                controls: options.controls ? window.ol.control.defaults().extend([
                    new window.ol.control.FullScreen()
                ]) : [
                    new window.ol.control.Attribution()
                ],
                interactions: options.interactions ? window.ol.interaction.defaults() : [],
                target: this.target,
                view: new window.ol.View({
                    center: [0, 0],
                    zoom: 0
                })
            });

            return this;
        };

        /**
         * Add location (Point, Line, Polygons) to map and zoom
         * on extent
         * 
         * @param {String/Object} data as WKT or GeoJSON
         */
        this.update = function(data) {

            var features, radius = 10000;

            if (!this.map) {
                this.init();
            }

            /*
             * GeoJSON...
             */
            if (typeof data === 'object') {
                features = this.readGeoJSON(data);
            }
            /*
             * ...or WKT
             */
            else {
                features = this.readWKT(data);
            }

            /*
             * Remove previous feature
             */
            this.locationLayer.getSource().clear();

            /*
             * Add new feature
             */
            this.locationLayer.getSource().addFeatures(features);

            /*
             * Zoom on locationLayer
             */
            if (this.locationLayer.getSource() && this.locationLayer.getSource().getFeatures().length > 0) {

                /*
                 * Get a minimal extent (POINT case)
                 */
                var extent = this.locationLayer.getSource().getExtent();
                if (extent[0] === extent[2] || extent[1] === extent[4]) {
                    extent = [
                        extent[0] - radius,
                        extent[1] - radius,
                        extent[2] + radius,
                        extent[3] + radius
                    ];
                }
                this.map.getView().fitExtent(extent, this.map.getSize());
            }

            /*
             * Display feature WMS
             */
            if (this.displayWMS) {
                for (var i = 0; i < features.length; i++) {
                    this.addProductLayer(features[i]);
                }
            }

        };

        /**
         * Add features overlay
         * 
         * @param {Object} features
         */
        this.addOverlay = function(features) {

            if (!this.map) {
                this.init();
            }

            /*
             * Add overlay features
             */
            this.overlayLayer.getSource().clear();
            this.overlayLayer.getSource().addFeatures(this.readGeoJSON({
                type: 'FeatureCollection',
                features: features
            }));

        };

        /**
         * Return an array of features from WKT string
         * 
         * @param {String} wkt
         */
        this.readWKT = function(wkt) {

            var format = new ol.format.WKT(),
                    feature = format.readFeature(wkt);

            /*
             * Transform to background projection
             */
            feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');

            return [feature];
        };

        /**
         * Return an array of features from a GeoJSON FeatureCollection
         * 
         * @param {Object} featureCollection
         */
        this.readGeoJSON = function(featureCollection) {

            var format = new window.ol.format.GeoJSON({
                defaultDataProjection: "EPSG:4326"
            });

            var features = format.readFeatures(JSON.stringify(featureCollection), {
                featureProjection: 'EPSG:3857'
            });

            return features;

        };

        /**
         * Create a vector layer
         * 
         * @param {array} options
         * @returns {rocketmap.StaticMap_L6.window.ol.layer.Vector}
         */
        this.createLayer = function(options) {
            options = options || {};
            return new window.ol.layer.Vector({
                source: new window.ol.source.Vector(),
                style: new window.ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({color: options.fillColor || 'rgba(255, 255, 0, 0.4)'}),
                        stroke: new ol.style.Stroke({color: 'black', width: 1})
                    }),
                    fill: new window.ol.style.Fill({
                        color: options.fillColor || 'rgba(255, 255, 255, 0.001)'
                    }),
                    stroke: new window.ol.style.Stroke({
                        color: options.strokeColor || 'orange',
                        width: options.hasOwnProperty('strokeWidth') ? options.strokeWidth : 3
                    })
                })
            });
        };

        /**
         * Add a WMS layer to map
         * 
         * @param {Object} feature
         */
        this.addProductLayer = function(feature) {
            var id, properties, parsedWMS;

            if (!feature) {
                return null;
            }

            id = feature.getId();
            properties = feature.getProperties();
            if (!properties['services'] || !properties['services']['browse'] || !properties['services']['browse']['layer']) {
                return null;
            }

            parsedWMS = window.rocketmap.Util.parseWMSGetMap(properties['services']['browse']['layer']['url']);
            var layer = new window.ol.layer.Tile({
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

            this.map.addLayer(layer);

        };


        /*
         * Initialize map
         */
        return this.init(options);

    };

})(window);

(function(window, ol) {

    /**
     * Util
     */
    window.rocketmap.Map3D = function () {
        
        /**
         * Globe reference
         */
        this.ol3d = null;
        
        /**
         * Enable 3D view with CESIUM if available
         * 
         * @param {Object} map : OL3 map object
         */
        this.init = function(map) {
            
            var scene;
            
            /*
             * Initialize 3D globe with terrain provider
             */
            this.ol3d = new window.olcs.OLCesium({
                map: map
            });
            scene = this.ol3d.getCesiumScene();
            scene.terrainProvider = new window.Cesium.CesiumTerrainProvider({
                url: '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
            });
            
            return this;
        };
        
        /**
         * Create a Toggle 3D control button
         * 
         * @param {Object} opt_options
         */
        this.Toggle3DControl = function(opt_options) {
            var options, button, handleToggle3d, element;
            options = opt_options || {};
            if (!options.map3D) {
                return false;
            }
            button = document.createElement('button');
            button.innerHTML = '3D';
            handleToggle3d = function (e) {
                options.map3D.ol3d.setEnabled(!options.map3D.ol3d.getEnabled());
            };
            button.addEventListener('click', handleToggle3d, false);
            button.addEventListener('touchstart', handleToggle3d, false);
            element = document.createElement('div');
            element.className = 'toogle-3d ol-unselectable ol-control';
            element.appendChild(button);
            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });
            return true;
        };
        
       /*
        * Initialize Toggle-3d control
        */
        ol.inherits(this.Toggle3DControl, ol.control.Control);
            
    };
})(window, ol);

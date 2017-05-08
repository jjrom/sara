/**
 * rocketmap contextual menu
 * 
 * Code mainly from mapshup https://github.com/jjrom/mapshup/blob/master/client/js/mapshup/lib/core/Menu.js
 * 
 * @param {Object} window
 */
(function (window) {

    window.rocketmap.Menu = function (rocketmap) {

        /*
         * Only one Map Menu object is created
         */
        if (window.rocketmap.Menu._o) {
            return window.rocketmap.Menu._o;
        }
        
        /*
         * Rocketmap pointer
         */
        this.rocketmap = rocketmap;
        
        /*
         * Items configuration array
         */
        this.menuConfig = [];
        
        /**
         * Last mouse click is stored to display menu
         */
        this.coordinate = [0,0];

        /**
         * Check is menu is loaded
         */
        this.isLoaded = false;
        
        /**
         * Menu items array
         */
        this.items = [];
        
        /**
         * Menu items array
         */
        this.visibleItems = [];
        
        /**
         * Menu is not displayed within the inner border of the map
         * of a size of "limit" pixels (default is 0 pixels)
         */
        this.limit = 0;
        
        /**
         * Menu initialisation
         *
         * <div id="menu">
         * </div>
         */
        this.init = function(menuConfig) {
            
            /*
             * Variables initialisation
             */
            var self = this;
            
            self.menuConfig = menuConfig;
            
            /*
             * Set default target
             */
            if (!self.menuConfig.target){
                self.menuConfig.target = "map";
            }
            
            /*
             * Create the menu div
             */
            $('#mapmenu').remove();
            $('#' + self.menuConfig.target).append('<div id="mapmenu"></div>');
            
            /*
             * Set jquery reference
             */
            self.$m = $('#mapmenu');
            
            /*
             * Menu is successfully loaded
             */
            self.isLoaded = true;
            
            return self;

        };
        
        /*
         * Add an external item to the menu
         * This function should be called by plugins
         * that require additionnal item in the menu
         * 
         * @param items : array of menu items
         * 
         * Menu item structure :
         * {
         *      id: // identifier
         *      text: // Displayed title
         *      title: // Title
         *      callback: // function to execute on click
         * }
         */
        this.add = function (items) {

            /*
             * Add new item
             */
            if ($.isArray(items)) {
                for (var i = 0, l = items.length; i < l; i++) {
                    this.items.push(items[i]);
                }

                /*
                 * Recompute items position within the menu
                 */
                this.refresh();
            }

            return true;
            
        };
        
        /**
         * Force menu to init
         */
        this.refresh = function() {
            
            /*
             * Items are displayed on a circle :
             *  - first item position is 180 degrees
             *  - trigonometric direction
             */
            var i,ii,x,y,rad,
                scope = this,
                offsetX = 0,
                angle = 180,
                step = 45,
                a = 75,
                b = a;
            
            /*
             * Clean menu
             */
            $('.item', scope.$m).remove();
            
            for (i = 0, ii = scope.items.length; i < ii; i++) {
                (function(item, $m) {
                
                    /*
                     * Convert angle in radians
                     */
                    rad = (angle * Math.PI) / 180;

                    $m.append('<div class="item right" id="'+item.id+'" title="'+item.title+'">'+item.text+'</div>');
                    x = Math.cos(rad) * a + offsetX;
                    y = Math.sin(rad) * b - 10;
                    $('#'+item.id).click(function(){
                        item.callback(item.feature);
                        return false;
                    }).css({
                        'left': Math.round(x),
                        'top': Math.round(y)
                    });

                    /*
                     * Increment angle
                     */ 
                    angle = angle + step;
                })(scope.items[i], scope.$m);
            }

        };
        
        /*
         * Remove an item from the menu
         * 
         * @param id : id of item to remove
         * 
         */
        this.remove = function(id) {
            
            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length;i<l;i++) {
                
                /*
                 * Remove item with corresponding id
                 */
                if (this.items[i].id === id) {
                    
                    this.items.splice(i,1);
                    
                    /*
                     * Recompute items position within the menu
                     */
                    this.refresh();
                    
                    return true;
                }
            }
            
            return false;

        };
        
        /*
         * Remove all item from menu
         */
        this.clean = function() {
            this.items = [];
            this.refresh();
            return true;
        };

        /**
         * Feature menu is displayed at "pixel" position
         * If pixel is not given as input, it is inferred
         * from this.coordinate position (i.e. last click on #map div)
         * 
         * @param {array} pixel : [x,y] position to display menu
         * @param {Object} feature
         */
        this.show = function(pixel, feature) {
            
            var self = this;
            
            if (!self.isLoaded) {
                return false;
            }
            
            /*
             * Add contextual menu item
             */
            self.clean();
            self.add([
                {
                    id:window.rocketmap.Util.getId(),
                    text:'<span class="fa fa-3x fa-close"></span>',
                    title:self.menuConfig['close']['title'],
                    callback:function(scope) {
                        self.rocketmap.unselectAll();
                    }
                }
            ]);
            if (feature) {
                
                var properties = feature.getProperties();
                
                /*
                 * View metadata
                 */
                self.add([
                    {
                        id:window.rocketmap.Util.getId(),
                        text:'<span class="fa fa-3x fa-info"></span>',
                        title:self.menuConfig['viewMetadata']['title'] + ' [' + feature.getId() + ']',
                        callback:self.menuConfig['viewMetadata']['callback'],
                        feature:feature
                    }
                ]);
                
                /*
                 * Visualize/Hide full resolution product
                 */
                if (properties['services'] && properties['services']['browse'] && properties['services']['browse']['layer']) {
                    if (self.menuConfig['viewFullResolution']) {
                        if (!self.rocketmap.productLayers[feature.getId()]) {
                            self.add([
                                {
                                    id:window.rocketmap.Util.getId(),
                                    text:'<span class="fa fa-3x fa-eye"></span>',
                                    title:self.menuConfig['viewFullResolution']['title'],
                                    callback:function(scope) {
                                        self.rocketmap.addProductLayer(feature);
                                        self.rocketmap.unselectAll();
                                    }
                                }
                            ]);
                        }
                        else {
                            self.add([
                                {
                                    id:window.rocketmap.Util.getId(),
                                    text:'<span class="fa fa-3x fa-eye-slash"></span>',
                                    title:self.menuConfig['hideFullResolution']['title'],
                                    callback:function(scope) {
                                        self.rocketmap.removeProductLayer(feature.getId());
                                        self.rocketmap.unselectAll();
                                    }
                                }
                            ]);
                        }
                    }
                }
                
                /*
                 * Download
                 */
                if (properties['services'] && properties['services']['download'] && properties['services']['download']['url']) {
                    if (self.menuConfig['download']) {
                        self.add([
                            {
                                id:window.rocketmap.Util.getId(),
                                text:'<span class="fa fa-3x fa-cloud-download"></span>',
                                title:'Download',
                                callback:self.menuConfig['download']['callback'],
                                feature:feature
                            }
                        ]);
                    }
                    if (self.menuConfig['cart']) {
                        self.add([
                            {
                                id:window.rocketmap.Util.getId(),
                                text:'<span class="fa fa-3x fa-cart-plus"></span>',
                                title:self.menuConfig['cart']['title'],
                                callback:self.menuConfig['cart']['callback'],
                                feature:feature
                            }
                        ]);
                    }
                }
            }
            
            pixel = pixel || [0, 0];
            
            self.coordinate = self.rocketmap.map.getCoordinateFromPixel(pixel);
            
            /**
             * Show '#menu' at the right position
             * within #map div
             */
            self.$m.css({
                'left': pixel[0],
                'top': pixel[1]
            }).show();

            return true;
        };
        
        /*
         * Update menu position
         */
        this.updatePosition = function() {
            if (!this.coordinate) {
                return false;
            }
            var xy = this.rocketmap.map.getPixelFromCoordinate(this.coordinate);
            if (xy) {
                this.$m.css({
                    'left': xy[0],
                    'top': xy[1]
                });
            }
            return true;
        };
        

        /**
         * Hide menu
         */
        this.hide = function() {
            this.$m.hide();
            return true;
        };
        
        /*
         * Set unique instance
         */
        window.rocketmap.Menu._o = this;
        
        return this;
    };
    
})(window);

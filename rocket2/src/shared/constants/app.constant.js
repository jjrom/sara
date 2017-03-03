
angular.module('rocketConstantModule',[])
    .constant('config',
        {
            "restoServerUrl": "http://resto.mapshup.com/2.2/",
            "contactEmail": "somebody@localhost",
            "cartSynchronization": true,
            "detectLanguage": true,
            "availableLanguages": ["en"],
            "maxRecords": 20, // has to be the same as RESTo configuration
            "auth": {
            },
            "map": {
                "background": {
                    "source": "OSM"
                }
            }
        });

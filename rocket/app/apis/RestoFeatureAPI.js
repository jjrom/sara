(function () {

    'use strict';

    angular.module('rocket')
            .factory('restoFeatureAPI', ['ngDialog', 'rocketServices', 'restoUsersAPI', restoFeatureAPI]);

    function restoFeatureAPI(ngDialog, rocketServices, restoUsersAPI) {

        var api = {
            ckeckLicense: ckeckLicense,
            download: download
        };

        return api;

        ////////////

        /**
         * Download feature
         * 
         * @param {Object} feature
         */
        function download(feature) {

            if (feature.properties && feature.properties.services && feature.properties.services.download) {

                rocketServices.download(feature.properties.services.download.url, function (error) {
                    if (error.ErrorMessage && error.license && error.license.description && error.license.description.url && error.license.licenseId) {
                        ngDialog.openConfirm({
                            controller: 'licenseController',
                            templateUrl: "app/components/features/license.html",
                            data: {
                                collectionName: feature.properties.collection,
                                licenseUrl: error.license.description.url
                            }
                        }).then(
                                function () {
                                    /*
                                     * Send a license signature to server
                                     */
                                    restoUsersAPI.signLicense(error.license.licenseId,
                                            function () {
                                                // Resend download request
                                                rocketServices.download(feature.properties.services.download.url, function () {
                                                    rocketServices.error('download.error');
                                                });
                                            },
                                            function () {
                                                rocketServices.error('download.error');
                                            });
                                },
                                function () {
                                    /*
                                     * Canceled - do nothing
                                     */
                                }
                        );
                    } else {
                        rocketServices.error('download.error');
                    }
                }
                );




            }
        }
        ;

        /*
         * Check license
         * 
         * @param {object} feature
         * @param {type} success
         * @param {type} error
         * @returns {undefined}
         */
        function ckeckLicense(feature, success, error) {

            if (feature.properties && feature.properties.services && feature.properties.services.download) {

                /*
                 * Check license
                 */
                restoUsersAPI.hasToSignLicense({
                    userid: rocketServices.getProfile()['userid'],
                    collectionName: feature.properties.collection
                }, function (result) {
                    if (result.hasToSignLicense) {
                        ngDialog.openConfirm({
                            controller: 'licenseController',
                            templateUrl: "app/components/features/license.html",
                            data: {
                                collectionName: feature.properties.collection,
                                licenseUrl: result.licenseUrl
                            }
                        })
                                .then(
                                        /*
                                         * Send a license signature to server
                                         */
                                                function (result) {
                                                    restoUsersAPI.signLicense({
                                                        userid: rocketServices.getProfile()['userid'],
                                                        collectionName: feature.properties.collection
                                                    },
                                                            function (result) {
                                                                success(feature);
                                                            },
                                                            function (result) {
                                                                error();
                                                            });
                                                },
                                                /*
                                                 * Canceled - do nothing
                                                 */
                                                        function (result) {}
                                                );
                                            } else {
                                        success(feature);
                                    }

                                });

            }
        }
        ;

    }

})();

/**
 * Define Angular application module.
 *
 * @ngdoc application
 * @namespace app
 * @requires ng
 * @requires ol
 * @requires app.components.footer
 * @requires app.components.header
 * @requires app.templates
 */
angular.module('app', [
    // Official modules.
    'ng',
    // Library modules.
    'olMap',
    // Application modules.
    'app.components.footer',
    'app.components.header',
    'app.templates']);

/**
 * In order to have more control over the initialization process, we use the manual bootstrapping
 * method of Angular (instead of "ng-app" directive). With this method we can properly handle the
 * configuration value to setup Angular modules (and also use the "ng-cloak" directive to display
 * a splash/loading screen until the configuration is loaded).
 *
 * @param {Object} config The application configuration.
 */
function bootstrap(config) {

    // TODO handle configuration value here...

    // Bootstrap Angular application module.
    angular.bootstrap(window.document, ['app']);
}
$.getJSON('config.json', bootstrap); // loading configuration...


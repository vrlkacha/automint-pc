/*
 * Automint Application
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../typings/main.d.ts" />

/*
 *  This closure contains initialization of angular application
 *  Do not update this file unless app level changes are required
 */

(function() {
    angular.module('automintApp', ['ui.router', 'oc.lazyLoad', 'ngSanitize', 'ngAnimate', 'ngMaterial'])
        .config(sceConfig)
        .config(DateFormatConfig)
        .run(RunMainBlock);
    
    sceConfig.$inject = ['$sceDelegateProvider'];
    DateFormatConfig.$inject = ['$mdDateLocaleProvider'];
    RunMainBlock.$inject = ['$rootScope', '$state', '$stateParams', '$window', '$amRoot'];
    
    //  configure rules for strict contextual escpaing
    function sceConfig($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist([
            'self'
        ]);
    }
    
    //  configure date formats for the application
    function DateFormatConfig($mdDateLocaleProvider) {
        $mdDateLocaleProvider.formatDate = formatDate;
        
        function parseDate(dateString) {
            return moment(dateString).format('DD/MM/YYYY');
        }
        
        function formatDate(date) {
            return moment(date).format('DD/MM/YYYY');
        }
    }
    
    //  it's called when all the modules are loaded
    function RunMainBlock($rootScope, $state, $stateParams, $window, $amRoot) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        
        //  initialize database and default syncing mechanism with automint server
        $amRoot.initDb();
        
        //  when state changes, scroll back to top
        function onStateChangeSuccess() {
            $("html, body").animate({
                scrollTop: 0
            }, 200);
        }
    }
})();
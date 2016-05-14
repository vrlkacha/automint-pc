/*
 * Closure for initializing and mapping oclazyLoad modules
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .config(LazyLoadConfigs);
    
    LazyLoadConfigs.$inject = ['$ocLazyLoadProvider'];
    
    function LazyLoadConfigs($ocLazyLoadProvider) {
        $ocLazyLoadProvider.config({
            debug: false,
            events: false,
            modules: [
                //  datatables
                {
                    name: 'material-datatable',
                    files: [
                        'bower_components/angular-material-data-table/dist/md-data-table.min.js',
                        'bower_components/angular-material-data-table/dist/md-data-table.min.css'
                    ]
                }
            ]
        });
    }
})();
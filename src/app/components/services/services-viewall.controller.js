/**
 * Controller for View Services module
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeRA', ServiceViewAllController);

    ServiceViewAllController.$inject = ['$scope', '$state', '$filter', 'utils', 'amServices'];

    function ServiceViewAllController($scope, $state, $filter, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  named assginments for tracking UI elements
        vm.query = {
            limit: 5,
            page: 1,
            total: 0
        };
        vm.filter = {
            month: 1,
            year: 0
        }
        vm.services = [];
        vm.displayDataOptions = [{
            name: '1 Month',
            month: 1,
            year: 0
        }, {
            name: '6 Months',
            month: 6,
            year: 0
        }, {
            name: 'A Year',
            month: 0,
            year: 1
        }, {
            name: 'Everything',
            month: 0,
            year: 0
        }]
        vm.displayDataFor = vm.displayDataOptions[0].name;

        //  function maps
        vm.addService = addService;
        vm.getServices = getServices;
        vm.editService = editService;
        vm.deleteService = deleteService;

        //  default execution steps
        getServices();
        $scope.$watch('vm.displayDataFor', watchDisplayDataFor);


        //  function definitions
        
        //  listen to changes in display data settings
        function watchDisplayDataFor(newValue, oldValue) {
            var found = $filter('filter')(vm.displayDataOptions, {
                name: newValue
            });
            if (found.length == 1) {
                vm.filter.month = found[0].month;
                vm.filter.year = found[0].year;
                getServices();
            }
        }
        
        function getServices() {
            vm.promise = amServices.getFilteredServices;
            vm.promise(vm.query.page, vm.query.limit, vm.filter.month, vm.filter.year).then(success).catch(failure);

            function success(res) {
                vm.services = res.services;
                vm.query.total = res.total;
            }

            function failure(err) {
                console.log(err);
                vm.services = [];
                vm.query.total = 0;
            }
        }

        //  go to add service state
        function addService() {
            $state.go('restricted.services.add');
        }

        //  edit service
        function editService(service) {
            $state.go('restricted.services.edit', {
                serviceId: service.value.id,
                vehicleId: service.value.vehicleId,
                userId: service.id
            });
        }

        //  delete service from UI
        function deleteService(service) {
            amServices.deleteService(service.id, service.value.vehicleId, service.value.id).then(success).catch(failure);

            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Service has been deleted.');
                    getServices();
                } else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Service can not be deleted at moment. Please Try Again!');
            }
        }
    }
})();
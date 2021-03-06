/**
 * Controller for Edit Package component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.2
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlPkUI', PackageAddController);

    PackageAddController.$inject = ['$rootScope', '$q', '$filter', '$state', 'utils', 'amTreatments'];

    function PackageAddController($rootScope, $q, $filter, $state, utils, amTreatments) {
        //  initialize view model
        var vm = this, oPackageName;

        //  named assignments to keep track of UI elements
        vm.label_name = "Enter Package Name:";
        vm.operationMode = 'edit';
        vm.package = {
            name: ''
        };
        vm.treatment = {
            details: '',
            rate: ''
        };
        vm.vehicletypes = [];
        vm.selectedTreatments = [];

        //  default execution steps
        if ($state.params.name == undefined || $state.params.name == '') {
            errorAndExit();
            return;
        }
        $rootScope.isCUSection = true;
        getVehicleTypes(getTreatments, getPackageInfo);
        
        //  function maps
        vm.goBack = goBack;
        vm.changeNameLabel = changeNameLabel;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.isAddOperation = isAddOperation;
        vm.finalizeNewTreatment = finalizeNewTreatment;
        vm.treatmentQuerySearch = treatmentQuerySearch;
        vm.save = save;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertTnToTitleCase = convertTnToTitleCase;
        vm.calculateSubTotal = calculateSubTotal;

        //  function definitions

        function calculateSubTotal(type) {
            var total = 0;
            vm.selectedTreatments.forEach(iterateTreatments);
            return total;

            function iterateTreatments(treatment) {
                total += parseFloat(treatment.rate[type.toLowerCase().replace(' ', '-')]);
            }
        }
        
        function convertTnToTitleCase() {
            vm.treatment.details = utils.autoCapitalizeWord(vm.treatment.details);
        }
        
        function convertNameToTitleCase() {
            vm.package.name = utils.autoCapitalizeWord(vm.package.name);
        }
        
        function goBack() {
            $state.go('restricted.treatments.master', {
                openTab: 'packages'
            })
        }
        
        //  error and exit
        function errorAndExit() {
            utils.showSimpleToast('Something went wrong. Please Try Again!');
            $state.go('restricted.treatments.master', {
                openTab: 'packages'
            });
        }
        
        //  get package information and update UI accordingly
        function getPackageInfo() {
            amTreatments.getPackageInfo($state.params.name).then(success).catch(failure);
            
            function success(res) {
                vm.package.name = res.name;
                oPackageName = res.name;
                changeNameLabel();
                Object.keys(res.treatments).forEach(itreateTreatments);
                
                function itreateTreatments(treatment) {
                    var found = $filter('filter')(vm.treatments, {
                        name: treatment
                    });
                    
                    if (found.length == 1 && found[0].name == treatment) {
                        found[0].rate = res.treatments[treatment].rate;
                        vm.selectedTreatments.push(found[0]);
                    } else {
                        vm.treatments.push({
                            name: treatment,
                            rate: res.treatments[treatment].rate
                        });
                        vm.selectedTreatments.push(vm.treatments[vm.treatments.length - 1]);
                    }
                }
            }
            
            function failure(err) {
                errorAndExit();
            }
        }

        //  listen to changes in input fields [BEGIN]
        function changeNameLabel(force) {
            vm.isName = (force != undefined) || (vm.package.name != '');
            vm.label_name = (vm.isName) ? "Package Name:" : "Enter Package Name:";
        }
        //  listen to changes in input fields [END]

        //  check current operation mode if it is 'add' or not
        function isAddOperation() {
            return (vm.operationMode == 'add');
        }

        //  get treatment from database
        function getTreatments() {
            var callback = arguments[0];
            vm.treatmentPromise = amTreatments.getTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res.treatments;
                callback();
            }

            function failure(err) {
                vm.treatments = [];
                callback();
            }
        }

        //  get vehicle types to display headers on datatable
        function getVehicleTypes() {
            var callback = arguments[0];
            var callingFunction = this;
            var callbackArgs = arguments;
            
            amTreatments.getVehicleTypes().then(success).catch(failure);
            delete callingFunction, callbackArgs, callback;

            function success(res) {
                res.forEach(iterateVehicleType);;
                callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));

                function iterateVehicleType(type) {
                    vm.vehicletypes.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }

            function failure(err) {
                vm.vehicletypes.push('Default');
                callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }
        }

        function updateTreatmentDetails() {
            var found = $filter('filter')(vm.treatments, {
                name: vm.treatment.details
            });
            if (found.length == 1 && found[0].name == vm.treatment.details)
                vm.treatment.rate = found[0].rate;
            else
                vm.treatment.rate = {};
        }

        function finalizeNewTreatment(btnClicked) {
            vm.treatment.details = vm.treatment.details.trim();
            if (vm.treatment.details != '') {
                var found = $filter('filter')(vm.treatments, {
                    name: vm.treatment.details
                });
                if (found.length == 1 && found[0].name == vm.treatment.details) {
                    found[0].checked = true;
                    vm.selectedTreatments.push(found[0]);
                } else {
                    vm.treatments.push({
                        name: vm.treatment.details,
                        rate: vm.treatment.rate,
                        checked: true
                    });
                    vm.selectedTreatments.push(vm.treatments[vm.treatments.length - 1]);
                }
                vm.treatment.details = '';
                vm.treatment.rate = {};
                $('#new-treatment-details').focus();
            }
            if (btnClicked)
                $('#new-treatment-details').focus();
        }

        //  query search for treatments [autocomplete]
        function treatmentQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.treatment.details ? vm.treatments.filter(createFilterForTreatments(vm.treatment.details)) : vm.treatments);

            return results;
        }

        //  create filter for users' query list
        function createFilterForTreatments(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) === 0);
            }
        }

        function save() {
            if (vm.package.name == '') {
                utils.showSimpleToast('Please Enter Name');
                return;
            }
            if (vm.selectedTreatments.length <= 0) {
                utils.showSimpleToast('Please Select Treatments');
                return;
            }
                
            vm.selectedTreatments.forEach(iterateTreatments);
            amTreatments.savePackage(vm.package, oPackageName).then(success).catch(failure);

            function iterateTreatments(treatment) {
                vm.package[treatment.name] = treatment;
                delete vm.package[treatment.name]['$$hashKey']
                delete vm.package[treatment.name].name;
            }
            
            function success(res) {
                utils.showSimpleToast('Package has been saved successfully!');
                $state.go('restricted.treatments.master', {
                    openTab: 'packages'
                });
            }
            
            function failure(err) {
                utils.showSimpleToast('Could not save package at moment. Please Try Again!');
            }
        }
    }
})();
/**
 * Controller for Edit Service component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeUI', ServiceEditController);

    ServiceEditController.$inject = ['$state', '$q', '$log', '$filter', '$mdEditDialog', '$mdDialog', 'utils', 'amServices'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceEditController($state, $q, $log, $filter, $mdEditDialog, $mdDialog, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false;

        //  vm assignments to keep track of UI related elements
        vm.label_userMobile = 'Enter Mobile Number:';
        vm.label_userEmail = 'Enter Email:';
        vm.label_userAddress = 'Enter Address:';
        vm.label_vehicleReg = 'Enter Vehicle Registration Number:';
        vm.label_vehicleManuf = 'Manufacturer:';
        vm.label_vehicleModel = 'Model:';
        vm.vehicleTypeList = [];
        vm.user = {
            id: '',
            mobile: '',
            name: '',
            email: '',
            address: ''
        };
        vm.vehicle = {
            id: '',
            reg: '',
            manuf: '',
            model: '',
            type: 'default'
        };
        vm.service = {
            date: new Date(),
            odo: 0,
            cost: 0,
            invoiceno: 1,
            status: '',
            problems: []
        }
        vm.manufacturers = [];
        vm.models = [];
        vm.treatments = [];
        vm.selectedProblems = [];
        vm.selectedPackages = [];
        vm.allMemberships = [];
        vm.membershipChips = [];
        vm.serviceTypeList = ['Treatments', 'Package', 'Membership'];

        //  function maps
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertRegToCaps = convertRegToCaps;
        vm.searchVehicleChange = searchVehicleChange;
        vm.manufacturersQuerySearch = manufacturersQuerySearch;
        vm.modelQuerySearch = modelQuerySearch;
        vm.changeUserMobileLabel = changeUserMobileLabel;
        vm.changeUserEmailLabel = changeUserEmailLabel;
        vm.changeVehicleRegLabel = changeVehicleRegLabel;
        vm.changeVehicleTab = changeVehicleTab;
        vm.changeVehicleType = changeVehicleType;
        vm.treatmentsQuerySearch = treatmentsQuerySearch;
        vm.onProblemSelected = onProblemSelected;
        vm.onProblemDeselected = onProblemDeselected;
        vm.isAddOperation = isAddOperation;
        vm.editProblemDetails = editProblemDetails;
        vm.editProblemRate = editProblemRate;
        vm.changeServiceTab = changeServiceTab;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.finalizeNewProblem = finalizeNewProblem;
        vm.save = save;
        vm.changeUserAddressLabel = changeUserAddressLabel;
        vm.queryMembershipChip = queryMembershipChip;
        vm.OnClickMembershipChip = OnClickMembershipChip;
        vm.calculateCost = calculateCost;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.navigateToSubscriptMembership = navigateToSubscriptMembership;

        //  default execution steps
        getVehicleTypes();
        changeServiceTab(true);
        getPackages();
        getMemberships();

        //  function definitions
        
        function addMembershipChip(chip) {
            vm.membershipChips.push(chip);
            OnAddMembershipChip(chip);
        }
        
        function navigateToSubscriptMembership() {
            vm.userTab = true;
        }

        function OnClickMembershipChip(event) {
            var chipIndex = angular.element(event.currentTarget).controller('mdChips').selectedChip;
            if (chipIndex < 0)
                return;
            $mdDialog.show({
                controller: MembershipEditDialogController,
                controllerAs: 'vm',
                templateUrl: 'app/components/services/service_membership.edit-template.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    membership: vm.membershipChips[chipIndex],
                    treatments: vm.treatments,
                    vehicletypes: vm.vehicleTypeList
                },
                clickOutsideToClose: true
            }).then(changeMembershipChip).catch(changeMembershipChip);
            
            function changeMembershipChip(obj) {
                $log.info('Changes Saved');
            }
        }
        
        function adjustExistingMembership(membership) {
            var m = $.extend({}, membership.treatments, false);
            membership.treatments = [];
            Object.keys(m).forEach(iterateTreatments);
            membership.selectedTreatments = [];
            membership.treatments.forEach(makeSelectedTreatments);
            membership.expandMembership = expandMembership;
            membership.calculateMembershipTotal = calculateMembershipTotal;
            membership.onTreatmentSelected = onTreatmentSelected;
            membership.onTreatmentDeselected = onTreatmentDeselected;
            membership.calculateTOccurenceLeft = calculateTOccurenceLeft;
            membership.calculateTDurationLeft = calculateTDurationLeft;
            delete m;
            
            function iterateTreatments(treatment) {
                delete treatment['$$hashKey'];
                m[treatment].name = treatment;
                membership.treatments.push(m[treatment]);
            }
            
            function expandMembership() {
                membership.expanded = (membership.expanded == undefined ? true : !membership.expanded);
            }
            function makeSelectedTreatments(treatment) {
                if (calculateTOccurenceLeft(treatment) != 0 && calculateTDurationLeft(treatment) != 0) {
                    treatment.checked = true;
                    membership.selectedTreatments.push(treatment);
                }
            }
            function calculateMembershipTotal() {
                var total = 0;
                membership.selectedTreatments.forEach(it);
                membership.total = total;
                return total;

                function it(t) {
                    total += t.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
                }
            }
            
            function calculateTOccurenceLeft(item) {
                return (item.given.occurences - item.used.occurences);
            }
            function calculateTDurationLeft(item) {
                return (item.given.duration - item.used.duration);
            }
            function onTreatmentSelected(item) {
                item.checked = true;
            }

            function onTreatmentDeselected(item) {
                item.checked = false;
            }
        }

        function OnAddMembershipChip(chip) {
            var m = $.extend({}, chip.treatments, false);
            chip.treatments = [];
            Object.keys(m).forEach(iterateTreatments);
            chip.selectedTreatments = [];
            chip.startdate = moment().format();
            chip.treatments.forEach(makeSelectedTreatments);
            chip.expandMembership = expandMembership;
            chip.calculateMembershipTotal = calculateMembershipTotal;
            chip.onTreatmentSelected = onTreatmentSelected;
            chip.onTreatmentDeselected = onTreatmentDeselected;
            chip.calculateTOccurenceLeft = calculateTOccurenceLeft;
            chip.calculateTDurationLeft = calculateTDurationLeft;
            delete m;
            
            function iterateTreatments(treatment) {
                delete treatment['$$hashKey'];
                m[treatment].given = {
                    occurences: m[treatment].occurences,
                    duration: m[treatment].duration
                }
                m[treatment].used = {
                    occurences: 0,
                    duration: 0
                }
                delete m[treatment].occurences;
                delete m[treatment].duration;
                m[treatment].name = treatment;
                m[treatment].checked = false;
                chip.treatments.push(m[treatment]);
            }

            function expandMembership() {
                chip.expanded = (chip.expanded == undefined ? true : !chip.expanded);
            }
            function makeSelectedTreatments(treatment) {
                if (calculateTOccurenceLeft(treatment) != 0 && calculateTDurationLeft(treatment) != 0) {
                    treatment.checked = true;
                    chip.selectedTreatments.push(treatment);
                }
            }
            function calculateMembershipTotal() {
                var total = 0;
                chip.selectedTreatments.forEach(it);
                chip.total = total;
                return total;

                function it(t) {
                    total += t.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
                }
            }
            
            function calculateTOccurenceLeft(item) {
                return (item.given.occurences - item.used.occurences);
            }
            function calculateTDurationLeft(item) {
                return (item.given.duration - item.used.duration);
            }
            function onTreatmentSelected(item) {
                item.checked = true;
            }

            function onTreatmentDeselected(item) {
                item.checked = false;
            }
        }

        function MembershipEditDialogController($mdDialog, membership, treatments, vehicletypes) {
            var editMsVm = this;

            editMsVm.treatment = {
                details: '',
                rate: ''
            };
            editMsVm.membership = {
                name: membership.name,
                occurences: membership.occurences,
                duration: membership.duration
            };
            editMsVm.vehicletypes = vehicletypes;
            editMsVm.selectedTreatments = [];
            editMsVm.treatments = treatments;
            editMsVm.confirmDialog = confirmDialog;

            loadDefaultOccDur();
            loadMemberships();

            function loadMemberships() {
                membership.treatments.forEach(iterateTreatments);

                function iterateTreatments(treatment) {
                    var found = $filter('filter')(editMsVm.treatments, {
                        name: treatment.name
                    }, true);

                    if (found.length == 1) {
                        found[0].rate = treatment.rate;
                        found[0].given.occurences = treatment.given.occurences;
                        found[0].given.duration = treatment.given.duration;
                        found[0].used.occurences = treatment.used.occurences;
                        found[0].used.duration = treatment.used.duration;
                        editMsVm.selectedTreatments.push(found[0]);
                    } else {
                        editMsVm.treatments.push(treatment);
                        editMsVm.selectedTreatments.push(editMsVm.treatments[editMsVm.treatments.length - 1]);
                    }
                }
            }

            function loadDefaultOccDur() {
                editMsVm.treatments.forEach(iterateTreatments);

                function iterateTreatments(treatment) {
                    if (!treatment.given) {
                        treatment.given = {
                            occurences: membership.occurences,
                            duration: membership.duration
                        }
                    }
                    if (!treatment.used) {
                        treatment.used = {
                            occurences: 0,
                            duration: 0
                        }
                    }
                }
            }
            
            function confirmDialog() {
                membership.treatments = editMsVm.selectedTreatments;
                membership.selectedTreatments = [];
                membership.treatments.forEach(makeSelectedTreatments);
                $mdDialog.hide();
                
                function makeSelectedTreatments(treatment) {
                    if (membership.calculateTOccurenceLeft(treatment) != 0 && membership.calculateTDurationLeft(treatment) != 0) {
                        treatment.checked = true;
                        membership.selectedTreatments.push(treatment);
                    }
                }
            }
        }

        function queryMembershipChip() {
            var tracker = $q.defer();
            var results = (vm.membershipChipText) ? vm.allMemberships.filter(createFilterForMemberships(vm.membershipChipText)) : vm.allMemberships;

            return results;

            function createFilterForMemberships(query) {
                var lcQuery = angular.lowercase(query);
                return function filterFn(item) {
                    return (angular.lowercase(item.name).indexOf(lcQuery) >= 0);
                }
            }
        }
        
        function getMemberships() {
            amServices.getMemberships().then(success).catch(failure);
            
            function success(res) {
                vm.allMemberships = res.memberships;
            }

            function failure(error) {
                vm.allMemberships = [];
            }
        }

        //  get packages
        function getPackages() {
            vm.packagePromise = amServices.getPackages().then(success).catch(failure);

            function success(res) {
                vm.packages = [];
                res.forEach(iteratePackages);

                function iteratePackages(package) {
                    var treatments = [];
                    Object.keys(package.treatments).forEach(iterateTreatments);
                    package.treatments = treatments;
                    package.selectedTreatments = [];
                    package.onTreatmentSelected = onTreatmentSelected;
                    package.onTreatmentDeselected = onTreatmentDeselected;
                    package.calculatePackageTotal = calculatePackageTotal;
                    package.expandPackage = expandPackage;
                    vm.packages.push(package);
                    delete treatments;

                    function expandPackage() {
                        package.expanded = (package.expanded == undefined ? true : !package.expanded);
                    }

                    function calculatePackageTotal() {
                        var total = 0;
                        package.selectedTreatments.forEach(it);
                        package.total = total;
                        return total;

                        function it(t) {
                            total += t.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
                        }
                    }

                    function iterateTreatments(treatment) {
                        treatments.push({
                            name: treatment,
                            rate: package.treatments[treatment].rate,
                            checked: false
                        });
                    }

                    function onTreatmentSelected(item) {
                        item.checked = true;
                    }

                    function onTreatmentDeselected(item) {
                        item.checked = false;
                    }
                }
            }

            function failure(err) {
                vm.packages = [];
            }
        }
        
        //  get vehicle types from database
        function getVehicleTypes() {
            amServices.getVehicleTypes().then(success).catch(failure);
            
            function success(res) {
                res.forEach(iterateVehicleType);
                getDetails();
                
                function iterateVehicleType(type) {
                    vm.vehicleTypeList.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }
            
            function failure(err) {
                vm.vehicleTypeList.push('Default');
                getDetails();
            }
        }
        
        //  fill details
        function getDetails() {
            amServices.serviceTree($state.params.userId, $state.params.vehicleId, $state.params.serviceId).then(success).catch(failure);
            
            function success(res) {
                autofillVehicle = true;
                vm.user.id = $state.params.userId;
                vm.user.name = res.name;
                vm.user.email = res.email;
                vm.user.mobile = res.mobile;
                vm.user.address = res.address;
                changeUserEmailLabel();
                changeUserMobileLabel();
                changeUserAddressLabel();
                if (res.memberships)
                    Object.keys(res.memberships).forEach(iterateMemberships);
                vm.vehicle.id = $state.params.vehicleId;
                vm.vehicle.reg = res.vehicle.reg;
                changeVehicleRegLabel();
                vm.vehicle.manuf = res.vehicle.manuf;
                vm.vehicle.model = res.vehicle.model;
                vm.vehicle.type = res.vehicle.type;
                if (res.vehicle.service.packages) {
                    vm.serviceType = vm.serviceTypeList[1];
                    Object.keys(res.vehicle.service.packages).forEach(iteratePackages);
                }
                if (res.vehicle.service.memberships) {
                    vm.serviceType = vm.serviceTypeList[2];
                    Object.keys(res.vehicle.service.memberships).forEach(addMemberships);
                }
                vm.service.id = $state.params.serviceId;
                vm.service.date = new Date(res.vehicle.service.date);
                vm.service.cost = res.vehicle.service.cost;
                vm.service.odo = res.vehicle.service.odo;
                vm.service.invoiceno = res.vehicle.service.invoiceno;
                vm.service.status = res.vehicle.service.status;
                vm.servicestatus = (res.vehicle.service.status == 'paid');
                getRegularTreatments(res.vehicle.service.problems);
                
                function iterateMemberships(membership) {
                    res.memberships[membership].name = membership;
                    vm.membershipChips.push(res.memberships[membership]);
                    adjustExistingMembership(res.memberships[membership]);
                }
                function iteratePackages(package) {
                    var found = $filter('filter')(vm.packages, {
                        name: package
                    }, true);
                    
                    if (found.length == 1) {
                        found[0].checked = true;
                        Object.keys(res.vehicle.service.packages[package].treatments).forEach(iterateTreatments);
                        vm.selectedPackages.push(found[0]);
                        
                        function iterateTreatments(treatment) {
                            var ft = $filter('filter')(found[0].treatments, {
                                name: treatment
                            }, true);
                            
                            if (ft.length == 1) {
                                ft[0].checked = true;
                                found[0].selectedTreatments.push(ft[0]);
                            }
                        }
                    }
                }
                function addMemberships(membership) {
                    var found = $filter('filter')(vm.membershipChips, {
                        name: membership
                    }, true);
                    
                    if (found.length == 1) {
                        found[0].checked = true;
                        Object.keys(res.vehicle.service.memberships[membership].treatments).forEach(iterateTreatments);
                        
                        function iterateTreatments(treatment) {
                            var ft = $filter('filter')(found[0].treatments, {
                                name: treatment
                            }, true);
                            
                            if (ft.length == 1) {
                                ft[0].checked = true;
                                --ft[0].used.occurences;
                                found[0].selectedTreatments.push(ft[0]);
                            }
                        }
                    }
                }
            }
            function failure(err) {
                utils.showSimpleToast('Something went wrong!');
                $state.go('restricted.services.all');
            }
        }

        //  convert user name to TitleCase when they are typing
        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }

        //  in order to keep registation field in All Caps mode
        function convertRegToCaps() {
            vm.vehicle.reg = vm.vehicle.reg.toUpperCase();
        }

        //  query search for manufacturers [autocomplete]
        function manufacturersQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.vehicle.manuf ? vm.manufacturers.filter(createFilterForManufacturers(vm.vehicle.manuf)) : vm.manufacturers);

            if (results.length > 0) {
                return results;
            }

            amServices.getManufacturers().then(allotManufacturers).catch(noManufacturers);
            return tracker.promise;

            function allotManufacturers(res) {
                vm.manufacturers = res;
                results = (vm.vehicle.manuf ? vm.manufacturers.filter(createFilterForManufacturers(vm.vehicle.manuf)) : vm.manufacturers);
                tracker.resolve(results);
            }

            function noManufacturers(error) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for manufacturers' query list
        function createFilterForManufacturers(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                item = angular.lowercase(item);
                return (item.indexOf(lcQuery) === 0);
            }
        }

        //  query search for model [autocomplete]
        function modelQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.vehicle.model ? vm.models.filter(createFilterForModel(vm.vehicle.model)) : vm.models);

            if (results.length > 0)
                return results;

            amServices.getModels(vm.vehicle.manuf).then(allotModels).catch(noModels);
            return tracker.promise;

            function allotModels(res) {
                vm.models = res;
                results = (vm.vehicle.model ? vm.models.filter(createFilterForModel(vm.vehicle.model)) : vm.models);
                tracker.resolve(results);
            }

            function noModels(err) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for models' query list
        function createFilterForModel(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                item = angular.lowercase(item);
                return (item.indexOf(lcQuery) === 0);
            }
        }

        //  vehicle manufacturer is updated from UI, clear model list to populate new list w.r.t. manufacturer
        function searchVehicleChange() {
            if (!autofillVehicle) {
                vm.models = [];
                vm.vehicle.model = '';
                autofillVehicle = false;
            }
        }

        //  replace all the treatment values with updated vehicle type
        function changeVehicleType() {
            vm.service.problems.forEach(iterateProblem);
            
            function iterateProblem(problem) {
                var found = $filter('filter')(vm.treatments, {
                    name: problem.details
                });
                if (found.length == 1) {
                    var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                    var defaultRate = found[0].rate['default'];
                    problem.rate = (rate == '' ? (defaultRate == '' ? 0 : defaultRate) : rate);
                }
            }
        }

        //  return boolean response to different configurations [BEGIN]
        function isAddOperation() {
            return false;
        }
        //  return boolean response to different configurations [END]

        //  change vehicle tab selector variable
        function changeVehicleTab(bool) {
            vm.vehicleTab = bool;
        }
        
        //  change service tab selector variable
        function changeServiceTab(bool) {
            vm.serviceTab = bool;
        }

        //  listen to changes in input fields [BEGIN]
        function changeUserMobileLabel(force) {
            vm.largeUserMobileLabel = (force != undefined || vm.user.mobile != ''); 
            vm.label_userMobile = vm.largeUserMobileLabel ? 'Mobile:' : 'Enter Mobile Number:';
        }
        function changeUserEmailLabel(force) {
            vm.largeUserEmailLabel = (force != undefined || vm.user.email != ''); 
            vm.label_userEmail = vm.largeUserEmailLabel ? 'Email:' : 'Enter Email:';
        }
        function changeUserAddressLabel(force) {
            vm.isUserAddress = (force != undefined || vm.user.address != '');
            vm.label_userAddress = vm.isUserAddress ? 'Address:' : 'Enter Address:';
        }
        function changeVehicleRegLabel(force) {
            vm.largeVehicleRegLabel = (force != undefined || vm.vehicle.reg != ''); 
            vm.label_vehicleReg = vm.largeVehicleRegLabel ? 'Vehicle Registration Number:' : 'Enter Vehicle Registration Number:';
        }
        //  listen to changes in input fields [END]

        //  populate regular treatment list
        function getRegularTreatments(existingProblems) {
            amServices.getRegularTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res;
                loadTreatmentIntoProblems(existingProblems);
            }

            function failure(err) {
                vm.treatments = [];
                loadTreatmentIntoProblems(existingProblems);
            }
        }

        //  load treatment list into problem list
        function loadTreatmentIntoProblems(existingProblems) {
            vm.treatments.forEach(iterateTreatment);
            existingProblems.forEach(iterateProblem);
            
            function iterateProblem(problem) {
                var found = $filter('filter')(vm.service.problems, {
                    details: problem.details
                });
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = problem.rate;
                    vm.selectedProblems.push(found[0]);
                } else {
                    vm.service.problems.push({
                        details: problem.details,
                        rate: problem.rate,
                        checked: true
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
            }

            function iterateTreatment(treatment) {
                vm.service.problems.push({
                    details: treatment.name,
                    rate: treatment.rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')],
                    checked: false
                });
            }
        }

        //  problem table listeners [BEGIN]
        function onProblemSelected(item) {
            item.checked = true;
        }
        function onProblemDeselected(item) {
            item.checked = false;
        }
        //  problem table listeners [END]
        
        //  query search for problems [autocomplete]
        function treatmentsQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.problem.details ? vm.treatments.filter(createFilterForTreatments(vm.problem.details)) : vm.treatments);
            
            return results;
        }

        //  create filter for treatments' query list
        function createFilterForTreatments(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) >= 0);
            }
        }
        
        function calculateCost() {
            var totalCost = 0;
            vm.service.problems.forEach(iterateProblem);
            if (vm.serviceType == vm.serviceTypeList[1]) {
                //  packages
                vm.packages.forEach(iteratePackages);
            }
            if (vm.serviceType == vm.serviceTypeList[2]) {
                vm.membershipChips.forEach(iterateMemberships);
            }
            // totalCost += vm.problem.cost;
            vm.service.cost = totalCost;
            return totalCost;

            function iterateProblem(element) {
                totalCost += (element.rate ? element.rate * (element.checked ? 1 : 0) : 0);
            }
            function iteratePackages(package) {
                if (!package.checked)
                    return;
                package.selectedTreatments.forEach(iterateTreatments);
            }
            function iterateMemberships(membership) {
                if (!membership.checked)
                    return;
                membership.selectedTreatments.forEach(iterateTreatments);
            }
            function iterateTreatments(treatment) {
                totalCost += treatment.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
            }
        }

        //  show edit dialog box to edit problem details in run time
        function editProblemDetails(event, item) {
            event.stopPropagation();
            $mdEditDialog.small({
                messages: {
                   test: 'Write your product or issue!'
                },
                modelValue: item.details,
                placeholder: 'Enter Product or Issue',
                save: function(input) {
                    item.details = input.$modelValue;
                },
                targetEvent: event
            });
        }
        
        //  show edit dialog box to edit problem rate in run time
        function editProblemRate(event, item) {
            event.stopPropagation();
            $mdEditDialog.small({
                messages: {
                   test: 'Enter Rate for ' + item.details + '!'
                },
                modelValue: item.rate,
                placeholder: 'Enter Rate',
                save: function(input) {
                    item.rate = input.$modelValue;                 
                },
                type: 'number',
                targetEvent: event
            });
        }
        
        function finalizeNewProblem() {
            vm.problem.details = vm.problem.details.trim();
            if (vm.problem.details != '') {
                var found = $filter('filter')(vm.service.problems, {
                    details: vm.problem.details
                });
                if (found.length == 1) {
                    found[0].checked = true;
                    vm.selectedProblems.push(found[0]);
                } else {
                    vm.service.problems.push({
                        details: vm.problem.details,
                        rate: vm.problem.rate,
                        checked: true
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
                vm.problem.details = '';
                vm.problem.cost = '';
                vm.problem.rate = '';
                $('#new-problem-details').focus();
            }
        }

        function updateTreatmentDetails() {
            var found = $filter('filter')(vm.treatments, {
                name: vm.problem.details
            });
            if (found.length == 1) {
                var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                var defaultRate = found[0].rate['default'];
                vm.problem.rate = (rate == '' ? (defaultRate == '' ? 0 : defaultRate) : rate);
            } else
                vm.problem.rate = '';
            vm.problem.cost = (vm.problem.rate == '') ? 0 : vm.problem.rate;
        }
        
        function validate() {
            var isVehicleBlank = (vm.vehicle.manuf == undefined || vm.vehicle.manuf == '') && (vm.vehicle.model == undefined || vm.vehicle.model == '') && (vm.vehicle.reg == undefined || vm.vehicle.reg == '');
            var isServiceBlank = (vm.service.problems.length == 0) && (vm.service.cost == undefined || vm.service.cost == 0) && (vm.service.odo == undefined || vm.service.odo == 0);
            
            if (!isServiceBlank && isVehicleBlank) {
                changeVehicleTab(true);
                utils.showSimpleToast('Please Enter At Least One Vehicle Detail');
                return false;
            }
            return true;
        }
        
        //  save to database
        function save() {
            if (!validate()) return;
            vm.service.date = moment(vm.service.date).format();
            vm.service.problems = vm.selectedProblems;
            vm.service.problems.forEach(iterateProblems);
            vm.service.status = vm.servicestatus ? 'paid' : 'billed';
            if (vm.membershipChips)
                vm.user.memberships = vm.membershipChips;
            switch (vm.serviceType) {
                case vm.serviceTypeList[1]:
                    vm.packages.forEach(addPkToService);
                    break;
                case vm.serviceTypeList[2]:
                    vm.membershipChips.forEach(addMsToService);
                    break;
            }
            amServices.saveService(vm.user, vm.vehicle, vm.service).then(success).catch(failure);
            
            function addMsToService(membership) {
                if (!membership.checked)
                    return;
                if (!vm.service.memberships)
                    vm.service.memberships = [];
                vm.service.memberships.push({
                    name: membership.name,
                    treatments: membership.treatments,
                    rate: membership.total
                });
            }
            function addPkToService(package) {
                if (!package.checked)
                    return;
                if (!vm.service.packages)
                    vm.service.packages = [];
                vm.service.packages.push({
                    name: package.name,
                    treatments: package.treatments,
                    rate: package.total
                });
            }
            function iterateProblems(problem) {
                delete problem.checked;
                delete problem['$$hashKey'];
            }
        }

        //  (save successfull)
        function success(res) {
            $state.go('restricted.services.all');
            utils.showSimpleToast('Successfully Updated!');
        }

        //  !(save successfull)
        function failure(err) {
            utils.showSimpleToast('Failed to update. Please Try Again!');
        }
    }
})();
/**
 * Controller for View Invoice component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.6.1 
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    //  import node dependencies and other automint modules
    const ammPrint = require('./automint_modules/print/am-print.js');
    const ammMailApi = require('./automint_modules/am-mailer.js');
    const eIpc = require("electron").ipcRenderer;

    //  angular code 
    angular.module('automintApp').controller('amCtrlIvRI', InvoicesViewController);

    InvoicesViewController.$inject = ['$q', '$log', '$state', '$window', 'utils', 'amInvoices'];

    function InvoicesViewController($q, $log, $state, $window, utils, amInvoices) {
        //  initialize view model
        var vm = this;

        //  named assignments to keep track of UI elements
        vm.isFabOpen = true;
        vm.fabClass = '';

        //  function maps
        vm.test = test;
        vm.printInvoice = printInvoice;
        vm.mailInvoice = mailInvoice;
        vm.goBack = goBack;
        vm.editWorkshopInfo = editWorkshopInfo;
        vm.openFab = openFab;
        vm.closeFab = closeFab;
        vm.calculateServiceTax = calculateServiceTax;
        vm.editService = editService;
        vm.isRoundOff = false;
        vm.isDiscountApplied = false;

        //  default execution steps
        if ($state.params.userId == undefined || $state.params.vehicleId == undefined || $state.params.serviceId == undefined) {
            utils.showSimpleToast('Something went wrong. Please try again!')
            $state.go('restricted.services.all');
            return;
        }
        fillInvoiceDetails();
        loadInvoiceWLogo();
    
        //  electron watchers
        eIpc.on('am-invoice-mail-sent', OnInvoiceMailSent);

        //  function definitions
        
        function OnInvoiceMailSent(event, arg) {
            var message = (arg) ? 'Mail has been sent!' : 'Could not sent email. Please Try Again!'; 
            utils.showSimpleToast(message);
        }

        function openFab() {
            if (vm.fabClass == '')
                vm.fabClass = 'md-scale';
            vm.isFabOpen = true;
            vm.showFabTooltip = true;
        }

        function closeFab() {
            vm.isFabOpen = false;
            vm.showFabTooltip = false;
        }

        //  edit workshop info
        function editWorkshopInfo() {
            $state.go('restricted.settings', {
                openTab: 'invoice'
            });
        }
        
        function editService() {
            $state.go('restricted.services.edit', {
                userId: $state.params.userId,
                vehicleId: $state.params.vehicleId,
                serviceId: $state.params.serviceId,
                fromState: 'invoice'
            });
        }

        //  fill invoice details
        function fillInvoiceDetails() {
            amInvoices.getWorkshopDetails().then(fillWorkshopDetails).catch(failure);
            amInvoices.getServiceDetails($state.params.userId, $state.params.vehicleId, $state.params.serviceId).then(fillServiceDetails).catch(failure);

            function fillWorkshopDetails(res) {
                vm.workshop = res;
                vm.workshop.label_phone = (vm.workshop.phone || vm.workshop.phone != '') ? '(M)' : '&nbsp;';
                getDisplaySettings();
            }

            function fillServiceDetails(res) {
                vm.user = res.user;
                vm.vehicle = res.vehicle;
                vm.service = res.service;
                vm.isRoundOff = (vm.service.roundoff != undefined);
                vm.isDiscountApplied = (vm.service.discount != undefined);
                vm.sTaxSettings = {
                    applyTax: res.service.serviceTax.applyTax,
                    inclusive: (res.service.serviceTax.taxIncType == 'inclusive'),
                    tax: res.service.serviceTax.tax
                };
            }

            function failure(err) {
                getDisplaySettings();
                $log.info('Could not load details');
            }
        }
        
        function calculateServiceTax() {
            var tax = 0;
            if (!vm.service.serviceTax.applyTax)
                return 0;
            vm.service.problems.forEach(iterateProblems);
            if (vm.service.packages)
                vm.service.packages.forEach(iteratePackages);
            return tax;
            
            function iterateProblems(problem) {
                tax += problem.tax;
            }
            
            function iteratePackages(package) {
                package.treatments.forEach(iterateTreatments);
                
                function iterateTreatments(treatment) {
                    tax += treatment.tax;
                }
            }
        }

        //  load workshop logo in invoice settings
        function loadInvoiceWLogo() {
            var source = localStorage.getItem('invoice-w-pic');
            vm.invoiceWLogo = source;
        }

        //  load display settings
        function getDisplaySettings() {
            amInvoices.getIvSettings().then(success).catch(failure);

            function success(res) {
                if (!res.display.workshopDetails) {
                    vm.workshop = {};
                }
                if (res.display.workshopLogo)
                    addInvoiceWLogo();
                vm.ivSettings = res;
            }

            function failure(err) {
                $log.info('Could not load display settings!');
            }
        }

        //  print receipt
        function printInvoice() {
            var printObj = document.getElementById('am-invoice-body');
            ammPrint.doPrint(printObj.innerHTML);
        }

        //  send email
        function mailInvoice() {
            if (vm.user.email == undefined || vm.user.email == '') {
                utils.showSimpleToast(vm.user.name + '\'s email has not been set. Email can not be sent!');
                return;
            }
            removeInvoiceWLogo();
            var elem = document.getElementsByClassName('am-blank-padding');
            for (var i = 0; i < elem.length; i++) {
                var e = elem[i];
                e.innerHTML = '';
            }
            var printObj = document.getElementById('am-invoice-mail-body');
            utils.showSimpleToast('Sending Mail...');
            ammMailApi.send(printObj.innerHTML, vm.user, (vm.workshop) ? vm.workshop.name : undefined, (vm.ivSettings) ? vm.ivSettings.emailsubject : undefined);
            for (var i = 0; i < elem.length; i++) {
                var e = elem[i];
                e.innerHTML = '&nbsp;';
            }
            if (vm.ivSettings.display.workshopLogo)
                addInvoiceWLogo();
        }

        function goBack() {
            var transitState = 'restricted.services.all';
            var transitParams = undefined;
            if ($state.params.fromState) {
                switch ($state.params.fromState) {
                    case 'dashboard':
                        transitState = 'restricted.dashboard';
                        break;
                    case 'customers.edit.services':
                        transitState = 'restricted.customers.edit';
                        transitParams = {
                            id: $state.params.userId,
                            openTab: 'services'
                        }
                        break;
                }
            }
            $state.go(transitState, transitParams);
        }

        function addInvoiceWLogo() {
            var elem = document.getElementById('am-invoice-w-logo-holder');
            if (elem.hasChildNodes())
                return;
            var x = document.createElement("IMG");
            x.setAttribute("src", vm.invoiceWLogo);
            x.setAttribute("width", "250");
            x.setAttribute("height", "125");
            elem.appendChild(x);
        }

        function removeInvoiceWLogo() {
            var elem = document.getElementById('am-invoice-w-logo-holder');
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
        }

        //  test zone [BEGIN]
        function test() {
            console.log('You have reached test');
        }
        //  test zone [END]
    }
})();
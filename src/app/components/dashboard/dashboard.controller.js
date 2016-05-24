/**
 * Controller for dashboard view
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('dashboardCtrl', DashboardController);

    DashboardController.$inject = ['$state', '$filter', 'amDashboard'];

    function DashboardController($state, $filter, amDashboard) {
        //  initialize view model
        var vm = this;

        //  named assignments to keep track of UI
        vm.totalCustomersServed = 0;
        vm.totalRevenueEarned = 0;
        vm.totalNewCustomers = 0;
        vm.totalPendingPayments = 0;
        vm.perDayServiceChart = {};
        vm.perDayServiceChart.type = "AnnotationChart";
        vm.perDayServiceChart.options = {
            displayAnnotations: true,
            displayZoomButtons: false,
            displayRangeSelector: false,
            thickness: 2,
            colors: ['03A9F4'],
            displayLegendDots: false,
            min: 0
        };
        vm.perDayServiceChart.data = {
            cols: [{
                id: "date",
                label: "Date",
                type: "date"
            }, {
                id: "nos",
                label: "Services",
                type: "number"
            }],
            rows: []
        };
        vm.topTreatmentsChart = {};
        vm.topTreatmentsChart.type = "PieChart";
        vm.topTreatmentsChart.data = {
            cols: [{
                id: "t",
                label: "Treatments",
                type: "string"
            }, {
                id: "n",
                label: "Number",
                type: "number"
            }],
            rows: []
        };
        vm.topVtChart = {};
        vm.topVtChart.type = "PieChart";
        vm.topVtChart.data = {
            cols: [{
                id: "t",
                label: "Vehicle Type",
                type: "string"
            }, {
                id: "n",
                label: "Number",
                type: "number"
            }],
            rows: []
        };

        //  function maps
        vm.addNewService = addNewService;
        vm.viewAllServices = viewAllServices;

        //  default execution steps
        amDashboard.getTotalCustomerServed().then(generateTcsData).catch(failure);
        amDashboard.getNewCustomers().then(generateNcpData).catch(failure);
        amDashboard.getProblemsAndVehicleTypes().then(sortProblemsAndVehicleTypes).catch(failure);

        //  function definitions

        function addNewService() {
            $state.go('restricted.services.add');
        }

        function viewAllServices() {
            $state.go('restricted.services.all');
        }

        function sortProblemsAndVehicleTypes(res) {
            var sp = [], sortedProblems = [], svt = [], sortedVehicleTypes = [];
            if (res.problems) {
                Object.keys(res.problems).forEach(iterateProblems);
                sp.sort(sortByCount);
                for (var i = 0; i < sp.length; i++) {
                    if (i == 4) {
                        sortedProblems.push({
                            name: "Others",
                            count: sp[i].count
                        });
                    } else if (i > 4)
                        sortedProblems[4].count += sp[i].count;
                    else
                        sortedProblems.push(sp[i]);
                }
                sortedProblems.forEach(ip);
            }
            if (res.vehicletypes) {
                Object.keys(res.vehicletypes).forEach(iterateVehicleTypes);
                svt.sort(sortByCount);
                for (var i = 0; i < svt.length; i++) {
                    if (i == 4) {
                        sortedVehicleTypes.push({
                            name: "Others",
                            count: 1
                        });
                    } else if (i > 4)
                        sortedVehicleTypes[4].count += svt[i].count;
                    else
                        sortedVehicleTypes.push(svt[i]);
                }
                sortedVehicleTypes.forEach(ivt);
            }
            
            function ivt(vt) {
                vm.topVtChart.data.rows.push({
                    c:[{
                        v: vt.name
                    }, {
                        v: vt.count
                    }]
                })
            }
            
            function iterateVehicleTypes(vt) {
                svt.push({
                    name: vt,
                    count: res.vehicletypes[vt]
                });
            }
            
            function ip(p) {
                vm.topTreatmentsChart.data.rows.push({
                    c:[{
                        v: p.name
                    }, {
                        v: p.count
                    }]
                })
            }
            
            function sortByCount(lhs, rhs) {
                return (rhs.count - lhs.count);
            }
            
            function iterateProblems(problem) {
                sp.push({
                    name: problem,
                    count: res.problems[problem]
                });
            }
        }

        function generateNcpData(res) {
            vm.totalNewCustomers = res.newCustomers.length;
            vm.totalPendingPayments = 0;
            res.unbilledServices.forEach(iterateUnbilledServices);

            function iterateUnbilledServices(ubs) {
                vm.totalPendingPayments += ubs.srvc_cost;
            }
        }

        function generateTcsData(res) {
            var uids = [],
                spd = {};
            vm.totalCustomersServed = 0;
            vm.totalRevenueEarned = 0;
            res.forEach(iterateServices);
            if (spd)
                Object.keys(spd).forEach(calculateSpd);

            function calculateSpd(d) {
                vm.perDayServiceChart.data.rows.push({
                    c: [{
                        v: new Date(moment(d, 'DD MMM YYYY').format('YYYY'), moment(d, 'DD MMM YYYY').format('MM') - 1, moment(d, 'DD MMM YYYY').format('DD'))
                    }, {
                        v: spd[d]
                    }]
                })
            }

            function iterateServices(service) {
                vm.totalRevenueEarned += service.srvc_cost;
                var d = moment(service.srvc_date).format('DD MMM YYYY');
                if (!spd[d]) {
                    spd[d] = 0;
                }
                spd[d]++;
                var found = $filter('filter')(uids, service.cstmr_id, true);

                if (found.length == 0) {
                    uids.push(service.cstmr_id);
                    ++vm.totalCustomersServed;
                }
            }
        }

        function failure(err) {
            console.log(err);
        }
    }
})();
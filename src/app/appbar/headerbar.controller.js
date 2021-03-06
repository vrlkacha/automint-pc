/**
 * Controller for Header Bar
 * @author ndkcha
 * @since 0.7.0
 * @version 0.9.0
 */

(function() {
    const ipcRenderer = require('electron').ipcRenderer;

    angular.module('automintApp').controller('amCtrlHeaderbar', HeaderBarController);

    HeaderBarController.$inject = ['$rootScope', '$scope', '$state', '$timeout', '$mdSidenav', '$amRoot', '$filter', 'amAppbar', 'utils'];

    function HeaderBarController($rootScope, $scope, $state, $timeout, $mdSidenav, $amRoot, $filter, amAppbar, utils) {
        var vm = this;

        //  named assignments for view model
        vm.franchiseChannels = [];
        vm.currentFranchiseChannel = undefined;
        vm.allFrenchiseObject = {
            id: 'all',
            name: 'All'
        };

        //  temporary named assignments for this instance
        

        //  map functions to view model
        vm.toggleSideNavbar = buildDelayedToggler('main-nav-left');
        vm.openLockScreen = openLockScreen;
        vm.addService = addService;
        vm.relaunch = relaunch;
        vm.IsPasscodeEnabled = IsPasscodeEnabled;

        //  default execution steps
        $rootScope.hidePreloader = true;
        amAppbar.getPasscode().then(gps).catch(failure);

        //  function definitions

        function relaunch() {
            ipcRenderer.send('am-do-restart', true);
        }

        function addService() {
            $state.go('restricted.services.add');
        }

        function IsPasscodeEnabled() {
            return ($rootScope.isPasscodeEnabled);
        }

        function gps(res) {
            $rootScope.isPasscodeEnabled = (res && res.enabled);
            console.log($rootScope.isPasscodeEnabled);
            $rootScope.isAutomintLocked = res.enabled;
        }

        function failure(err) {
            $rootScope.isPasscodeEnabled = false;
        }

        function openLockScreen() {
            $rootScope.isAutomintLocked = true;
        }

        //  Supplies a function that will continue to operate until the time is up.
        function debounce(func, wait, context) {
            var timer;
            return function debounced() {
                var context = $scope,
                    args = Array.prototype.slice.call(arguments);
                $timeout.cancel(timer);
                timer = $timeout(function() {
                    timer = undefined;
                    func.apply(context, args);
                }, wait || 10);
            };
        }

        //  Build handler to open/close a SideNav; when animation finishes report completion in console
        function buildDelayedToggler(navID) {
            return debounce(function() {
                $mdSidenav(navID).toggle();
            }, 200);
        }
    }
})();
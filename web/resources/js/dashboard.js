'use strict';

var app = angular.module('myApp.dashboard', ['ngRoute']);

app.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider.when('/dashboard', {
        templateUrl: 'dashboard/dashboard.html',
        controller: 'DashboardCtrl'
    });
}]);

app.controller('DashboardCtrl', ['$rootScope', '$scope', '$http', 'PubNub', '$interval', '$timeout', '$routeParams', function ($rootScope, $scope, $http, PubNub, $interval, $timeout, $routeParams) {

    $scope.params = {
        ui: {
            tagsUpdateInterval: 3000,
            noOwner: "No Owner",
            notificationsLimit: 50,
            grid: {
                row: parseInt($routeParams.row) || 4,
                col: parseInt($routeParams.col) || 4,
                width: "25%",
                height: "25%"
            }
        }
    };
    angular.extend($scope.params, $rootScope.params);

    $scope.params.ui.grid.width = Math.floor(100 / $scope.params.ui.grid.col) + "%";
    $scope.params.ui.grid.height = Math.floor(100 / $scope.params.ui.grid.row) + "%";

    $scope.Math = window.Math;
    $scope.alerts = [];
    $scope.alertsDict = {};
    $scope.notifications = [];
    $scope.users = {};
    $scope.alertStatusArr = ["open", "unacked"];
    $scope.alertCounts = {
        initialized: false,
        statusDict: {}
    };

    $scope.PubNubInit = function () {
        PubNub.init({
            subscribe_key: $scope.params.PubNub.SubscribeKey,
            ssl: (('https:' == document.location.protocol) ? true : false)
        });

        $scope.PubNubSubscribe();
    };

    $scope.PubNubSubscribe = function () {
        PubNub.ngSubscribe({channel: $scope.params.PubNub.Channel});

        $rootScope.$on(PubNub.ngMsgEv($scope.params.PubNub.Channel), function (event, payload) {
            if (angular.isUndefined(payload.message)) {
                return;
            }

            console.log(payload.message); // TODO delete

            if (payload.message.action == "Create") {
                $scope.createAlert(payload.message.alert, payload.message);
            } else if (payload.message.action == "Acknowledge") {
                $scope.acknowledgeAlert(payload.message);
            } else if (payload.message.action == "AddNote") {
                $scope.addNote(payload.message);
            } else if (payload.message.action == "Close" || payload.message.action == "Delete") {
                $scope.closeAlert(payload.message);
            }
        });
    };

    $scope.makeApiRequest = function (dataObj) {
        var res = $http({
            method: 'OPTIONS',
            dataType: "json",
            headers: {
                "Content-Type": "application/json"
            },
            url: $scope.params.api.url,
            data: dataObj
        });

        res.error(function (data, status, headers, config) {
            console.log("failure message: " + JSON.stringify({data: data})); // TODO handle
        });

        return res;
    };

    $scope.loadUsers = function () {
        var dataObj = {
            lambdaOperation: $scope.params.api.lambda_operations.users.operation,
            apiKey: $scope.params.api.key
        };

        var res = $scope.makeApiRequest(dataObj);

        res.success(function (data, status, headers, config) {
            if (angular.isDefined(data.users)) {
                angular.forEach(data.users, function (user, index) {
                    $scope.users[user.username] = user;
                });
            } else {
                $scope.users = {};
            }
        });
    };

    $scope.loadAlerts = function () {
        var dataObj = {
            lambdaOperation: $scope.params.api.lambda_operations.alerts.operation,
            apiKey: $scope.params.api.key,
            query: "status%3A" + $scope.params.api.lambda_operations.alerts.status,
            limit: $scope.params.api.lambda_operations.alerts.limit,
            sort: "createdAt"
        };

        var res = $scope.makeApiRequest(dataObj);

        res.success(function (data, status, headers, config) {
            if (angular.isDefined(data.data)) {
                angular.forEach(data.data, function (alert, index) {
                    $scope.createAlert(alert);
                });
            } else {
                $scope.alerts = [];
                $scope.alertsDict = {};
            }
        });
    };

    $scope.loadAlertCount = function (alertStatus) {
        var dataObj = {
            lambdaOperation: $scope.params.api.lambda_operations.counts.operation,
            apiKey: $scope.params.api.key,
            status: alertStatus
        };

        var res = $scope.makeApiRequest(dataObj);

        res.success(function (data, status, headers, config) {
            if (angular.isDefined(data.count)) {
                $scope.alertCounts.statusDict[alertStatus] = data.count;

                var initialized = true;
                angular.forEach($scope.alertStatusArr, function (alertStatus, index) {
                    if (!(alertStatus in $scope.alertCounts.statusDict)) {
                        initialized = false;
                    }
                });
                $scope.alertCounts.initialized = initialized;
            }
        });
    };

    $scope.loadAlertCounts = function () {
        $scope.alertCounts.initialized = false;
        $scope.alertCounts.statusDict = {};

        angular.forEach($scope.alertStatusArr, function (alertStatus, index) {
            $scope.loadAlertCount(alertStatus);
        });
    };

    $scope.init = function () {
        $scope.PubNubInit();
        $scope.loadUsers();
        $scope.loadAlerts();
        $scope.loadAlertCounts();

        $interval($scope.updateTags, $scope.params.ui.tagsUpdateInterval);
    };

    $scope.updateTags = function () {
        angular.forEach($scope.alerts, function (alert, index) {
            alert.tagIndex++;
            if (alert.tagIndex >= alert.tags.length) {
                alert.tagIndex = 0;
            }
        });
    };

    $scope.getFullName = function (username) {
        return username in $scope.users ? $scope.users[username].fullname : $scope.params.ui.noOwner;
    };

    $scope.getOwnerFullName = function (alert) {
        return $scope.getFullName(alert.owner);
    };

    $scope.toggleAlertBg = function (alert, className) {
        alert.ui_bg_class = alert.ui_bg_class == "" ? className : "";
    };

    $scope.flashAlert = function (alert, className, interval, timeoutInterval, timeoutFunc) {
        var isAlertFlashing = alert.ui_is_flashing;
        if (!isAlertFlashing) {
            alert.ui_is_flashing = true;
            alert.ui_bg_class_interval = $interval($scope.toggleAlertBg, interval, 0, true, alert, className);
        }

        var args = [$scope.flashAlertTimeout, !isAlertFlashing ? timeoutInterval : 0, true, alert, timeoutFunc];

        if (angular.isDefined(timeoutFunc)) {
            // use splice to get all the arguments after 'timeoutFunc'
            var timeoutArgs = Array.prototype.splice.call(arguments, 5);

            args = args.concat(timeoutArgs);
        }

        $timeout.apply(null, args);
    };

    $scope.flashAlertTimeout = function (alert, timeoutFunc) {
        $interval.cancel(alert.ui_bg_class_interval);
        alert.ui_bg_class = "";
        alert.ui_is_flashing = false;

        if (angular.isDefined(timeoutFunc)) {
            // use splice to get all the arguments after 'timeoutFunc'
            var timeoutArgs = Array.prototype.splice.call(arguments, 2);

            timeoutFunc.apply(null, timeoutArgs);
        }
    };

    $scope.selectAlert = function (alert) {
        $scope.flashAlert(alert, "bg-white", 400, 700);
    };

    $scope.addNotification = function (notification) {
        notification.templateUrl = 'dashboard/notification/' + notification.action + '.html';
        $scope.notifications.unshift(notification);

        notification.alert.updatedAt = Math.floor(notification.alert.updatedAt / 1000000); // TODO WebHook createdAt fix

        if ($scope.notifications.length > $scope.params.ui.notificationsLimit) {
            $scope.notifications.pop();
        }
    };

    $scope.updateAlertsData = function (alert) {
        if (alert.tinyId in $scope.alertsDict) {
            angular.forEach($scope.alerts, function (existingAlert, index) {
                if (existingAlert.tinyId == alert.tinyId) {
                    alert = angular.merge(existingAlert, alert);
                }
            });
        } else {
            $scope.alerts.push(alert);
            $scope.alertsDict[alert.tinyId] = alert;
        }

        return alert;
    };

    $scope.createAlert = function (alert, notification) {
        alert.ui_deleted = false;
        alert.ui_bg_class = "";
        alert.ui_is_flashing = false;
        alert.tagIndex = 0;

        if (angular.isUndefined(notification)) {
            alert.createdAt = Date.parse(alert.createdAt);
            alert.updatedAt = Date.parse(alert.updatedAt);
        }

        $scope.updateAlertsData(alert);

        if (angular.isDefined(notification)) {
            $scope.addNotification(notification);
            $scope.loadAlertCounts();

            $scope.flashAlert(alert, "bg-blue", 400, 3000);
        }
    };

    $scope.acknowledgeAlert = function (notification) {
        notification.alert = $scope.updateAlertsData(notification.alert);

        var alert = notification.alert;
        if (!("owner" in alert) || alert.owner.length == 0) {
            alert.owner = alert.username; // TODO WebHook owner fix
        }

        $scope.addNotification(notification);
        $scope.loadAlertCounts();

        $scope.flashAlert(alert, "bg-green", 400, 3000);
    };

    $scope.addNote = function (notification) {
        notification.alert = $scope.updateAlertsData(notification.alert);
        $scope.addNotification(notification);

        $scope.flashAlert(notification.alert, "bg-yellow", 400, 3000);
    };

    $scope.closeAlert = function (notification) {
        var alert = notification.alert;

        if (alert.tinyId in $scope.alertsDict) {
            var existingAlert = $scope.alertsDict[alert.tinyId];

            $scope.flashAlert(existingAlert, "bg-red", 400, 3000, $scope.closeAlertFinally, notification);
        } else {
            $scope.closeAlertFinally(notification);
        }
    };

    $scope.closeAlertFinally = function (notification) {
        notification.alert = $scope.updateAlertsData(notification.alert);
        $scope.addNotification(notification);

        notification.alert.ui_deleted = true;

        $scope.loadAlertCounts();
    };

    $scope.init();
}]);

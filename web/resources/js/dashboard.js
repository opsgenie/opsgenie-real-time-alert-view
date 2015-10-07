'use strict';

var app = angular.module('myApp.dashboard', ['ngRoute']);

app.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider.when('/dashboard', {
        templateUrl: 'dashboard/dashboard.html',
        controller: 'DashboardCtrl'
    });
}]);

app.controller('DashboardCtrl', ['$rootScope', '$scope', '$http', 'PubNub', '$interval', '$timeout', function ($rootScope, $scope, $http, PubNub, $interval, $timeout) {

    $scope.params = {
        ui: {
            tagsUpdateInterval: 3000,
            noOwner: "No Owner",
            notificationsLimit: 50
        }
    };
    angular.extend($scope.params, $rootScope.params);

    $scope.Math = window.Math;
    $scope.alerts = [];
    $scope.alertsDict = {};
    $scope.notifications = [];
    $scope.users = {};

    $scope.PubNubInit = function () {
        PubNub.init({
            subscribe_key: $scope.params.PubNub.SubscribeKey
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

    $scope.loadUsers = function () {
        var dataObj = {
            apiKey: $scope.params.api.key
        };

        var res = $http({
            method: 'OPTIONS',
            dataType: "json",
            headers: {
                "Content-Type": "application/json"
            },
            url: $scope.params.api.urls.users.url,
            data: dataObj
        });

        res.success(function (data, status, headers, config) {
            if (angular.isDefined(data.users)) {
                angular.forEach(data.users, function (user, index) {
                    $scope.users[user.username] = user;
                });
            } else {
                $scope.users = {};
            }
        });

        res.error(function (data, status, headers, config) {
            console.log("failure message: " + JSON.stringify({data: data})); // TODO handle
        });
    };

    $scope.loadAlerts = function () {
        var dataObj = {
            apiKey: $scope.params.api.key,
            limit: $scope.params.api.urls.alerts.limit
        };

        var res = $http({
            method: 'OPTIONS',
            dataType: "json",
            headers: {
                "Content-Type": "application/json"
            },
            url: $scope.params.api.urls.alerts.url,
            data: dataObj
        });

        res.success(function (data, status, headers, config) {
            if (angular.isDefined(data.alerts)) {
                angular.forEach(data.alerts, function (alert, index) {
                    $scope.createAlert(alert);
                });
            } else {
                $scope.alerts = [];
                $scope.alertsDict = {};
            }
        });

        res.error(function (data, status, headers, config) {
            console.log("failure message: " + JSON.stringify({data: data})); // TODO handle
        });
    };

    $scope.init = function () {
        $scope.PubNubInit();
        $scope.loadUsers();
        $scope.loadAlerts();

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

    $scope.addNotification = function (notification) {
        notification.templateUrl = 'dashboard/notification/' + notification.action + '.html';
        $scope.notifications.unshift(notification);

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

    $scope.updateWebHookAlertsDataWithFixes = function (alert) {
        alert = $scope.updateAlertsData(alert);

        if ("createdAt" in alert) {
            alert.createdAt *= 1000000; // TODO WebHook createdAt fix
        }

        return alert;
    };

    $scope.createAlert = function (alert, notification) {
        alert.ui_deleted = false;
        alert.ui_bg_class = "";
        alert.tagIndex = 0;

        if (angular.isDefined(notification)) {
            if (angular.isDefined(alert.insertedAt)) {
                alert.createdAt = alert.insertedAt; // TODO WebHook createdAt fix
            }

            $scope.addNotification(notification);
        }

        $scope.updateAlertsData(alert);
    };

    $scope.acknowledgeAlert = function (notification) {
        notification.alert = $scope.updateWebHookAlertsDataWithFixes(notification.alert);

        var alert = notification.alert;
        if (!("owner" in alert) || alert.owner.length == 0) {
            alert.owner = alert.username; // TODO WebHook owner fix
        }

        $scope.addNotification(notification);
    };

    $scope.addNote = function (notification) {
        notification.alert = $scope.updateWebHookAlertsDataWithFixes(notification.alert);
        $scope.addNotification(notification);
    };

    $scope.closeAlert = function (notification) {
        var alert = notification.alert;

        if (alert.tinyId in $scope.alertsDict) {
            var existingAlert = $scope.alertsDict[alert.tinyId];

            existingAlert.ui_bg_class_interval = $interval($scope.toggleAlertBg, 800, 0, true, existingAlert, "bg-red");
            $timeout($scope.closeAlertFinally, 4000, true, notification, existingAlert);
        } else {
            $scope.closeAlertFinally(notification);
        }
    };

    $scope.toggleAlertBg = function (alert, className) {
        alert.ui_bg_class = alert.ui_bg_class == "" ? className : "";
    };

    $scope.closeAlertFinally = function (notification, existingAlert) {
        if (angular.isDefined(existingAlert)) {
            $interval.cancel(existingAlert.ui_bg_class_interval);
        }

        notification.alert = $scope.updateWebHookAlertsDataWithFixes(notification.alert);
        $scope.addNotification(notification);

        notification.alert.ui_deleted = true;
    };

    $scope.init();
}]);

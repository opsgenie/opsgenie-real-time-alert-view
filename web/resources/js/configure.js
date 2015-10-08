'use strict';

var app = angular.module('myApp');

app.run(['$rootScope', function ($rootScope) {
    $rootScope.params = {
        api: {
            key: "opsgenie-web-api-key",
            url: "aws-gateway-url",
            lambda_operations: {
                alerts: {
                    operation: "Alerts",
                    status: "open",
                    limit: 16
                },
                users: {
                    operation: "Users"
                },
                counts: {
                    operation: "Counts"
                }
            }
        },
        PubNub: {
            SubscribeKey: "pubnub-subscribe-key",
            Channel: "pubnub-channel"
        }
    };
}]);

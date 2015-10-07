'use strict';

var app = angular.module('myApp');

app.run(['$rootScope', function ($rootScope) {
    $rootScope.params = {
        api: {
            key: "opsgenie-web-api-key",
            urls: {
                alerts: {
                    url: "aws-gateway-url-for-alerts",
                    limit: 16
                },
                users: {
                    url: "aws-gateway-url-for-users"
                }
            }
        },
        PubNub: {
            SubscribeKey: "pubnub-subscribe-key",
            Channel: "pubnub-channel"
        }
    };
}]);

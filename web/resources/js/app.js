'use strict';

var app = angular.module('myApp', [
    'ngRoute',
    'ui.bootstrap',
    'pubnub.angular.service',
    'myApp.dashboard'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/dashboard'});
}]);

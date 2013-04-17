'use strict';


// Declare app level module which depends on filters, and services
angular.module('mapugo', ['mapugo.filters', 'mapugo.services', 'mapugo.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/cards', {templateUrl: 'partials/cards.html', controller: MyCtrl1});
    $routeProvider.when('/create', {templateUrl: 'partials/create.html', controller: MyCtrl2});
    $routeProvider.when('/details/:id', {templateUrl: 'partials/details.html', controller: DetailCtrl});
    $routeProvider.otherwise({redirectTo: '/cards'});
  }]);

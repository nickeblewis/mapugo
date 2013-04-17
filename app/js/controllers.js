'use strict';

/* Controllers */


function MyCtrl1() {}
MyCtrl1.$inject = [];


function MyCtrl2() {
}
MyCtrl2.$inject = [];

function DetailCtrl($scope, $routeParams, Place, $resource) {
  $scope.place = Place.get({_id: $routeParams.id}, function(place) {
        $scope.place.name = place.name;
        $scope.place.synopsis = place.synopsis;
        $scope.place.categoryId = place.categoryId;
        $scope.place.date = place.date;
        $scope.place.author = place.author;
        $scope.place.image = place.image;
    });
}

function AppController($scope,Place,$resource) {
	$scope.images = [];
	$scope.theplace = "";
	
	// Display the most recent 200 markers on the map by default
    var locationDetails = Place.query({
        limit : 200,
        sort  : '_id',
        order : 'desc'
    }, function () {
        // Plot the marker data on the map once the response has been returned

        $scope.images = locationDetails;
        $scope.pointsFromController = locationDetails;
    });

	$scope.loadMore = function() {
    var last = $scope.images[$scope.images.length - 1];
    for(var i = 1; i <= 8; i++) {
      $scope.images.push(last + i);
    }
  };

  $scope.mouseover = function(item) {  	
  	// $scope.theplace = item.name;

  };

  $scope.ifimagenotnull = function(image) {
  	if (image === undefined) 
  		return false;
  	
  	return true;
  };

   // When the user clicks on a location that we wish to pan them to on the map, this is the function for you!
    $scope.panToLocation = function(item) {
        $scope.center.lat = item.lat;
        $scope.center.lng = item.lng;
        $scope.zoom = 16;
        $scope.theplace = item.name;
    };

    $scope.locationAdd = function () {
        $scope.theplace = "Saving!";
        Place.save({},
            {
                name       : $scope.marker.name,
                lat        : $scope.marker.lat,
                lng        : $scope.marker.lng,
                synopsis   : $scope.marker.synopsis,
                categoryId : '50ccadfa7879a9eac3000660',
                date       : new Date() //,
                // author     : $scope.user.username
            },
            function (req, res) {
                if (res.length === 1) {
                    $scope.items = Place.query({
                        sort  : '_id',
                        order : 'desc',
                        limit : 200
                    });
                    // $location.path('/');
                    // $scope.$emit('onCategorySelectedEmit', {message : '50ccadfa7879a9eac3000660'});
                    //$scope

                }
            })
    };

    // Add the blue marker to the map, that we can drag around to be able to add new places to Journog
    angular.extend($scope, {
        center  : { lat:51.28481, lng:-0.76115 },
        marker  : { lat:51.28481, lng:-0.76115 },
        message : "Drag me to your node position",
        zoom    : 14
    });
}
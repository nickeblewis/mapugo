var module = angular.module('mapugo.directives', []);
module.directive('leaflet', function() {
    return {
        restrict: 'E',
        replace: true,
        template: '<div id="map"></div>',
        transclude: true,
        scope: {
            center: "=center",
            marker: "=marker",
            message: "=message",
            zoom: "=zoom",
            pointsource: "=pointsource"
        },
        link: function(scope, element, attrs) {

            // custom marker's icon styles
            var tinyIcon = L.Icon.extend({
                options: {
                    shadowUrl: 'img/marker-shadow.png',
                    iconSize: [25, 39],
                    iconAnchor:   [12, 36],
                    shadowSize: [41, 41],
                    shadowAnchor: [12, 38],
                    popupAnchor: [0, -30]
                }
            });

            var redIcon = new tinyIcon({ iconUrl: 'img/marker-red.png' });
            var yellowIcon = new tinyIcon({ iconUrl: 'img/marker-yellow.png' });
            var parkIcon = new tinyIcon({ iconUrl: 'img/parks.png' });

            
            //create a CloudMade tile layer and add it to the map
            //leaflet API key tiler
            // var mainMapLayer = L.tileLayer('http://{s}.tile.cloudmade.com/6e02bcea0e6c437499ad737a8c26bb4a/997/256/{z}/{x}/{y}.png');
            var mainMapLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            // var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
           
            var map = L.map(attrs.id, {
                center: [51.28481,  -0.76115],
                zoom: 14,
                scrollWheelZoom: true,
                layers: [mainMapLayer]
            });

            function imagePath(path) {
                if (path) {
                   
                    return '<img src="' + path + '_thumb.jpg">';
                } else {
                     // return '<img src="http://placehold.it/250x200">';
                     return '';
                }
            }

            // Clear markers, all of those on the map!
            function clearPoints() {
                 map.removeLayer('mainMapLayer');
            }

            //plot markers, this will add them, it doesn't care about what is already there
            function plotPoints(pts) {
               for (var p in pts) {
                  L.marker([pts[p].lat, pts[p].lng],{ icon: yellowIcon })
                    .bindPopup(imagePath(pts[p].image) + '<h3>' + pts[p].name + '</h3><p>' + pts[p].synopsis + '</p>')
                    .addTo(map);
               }
            }
            
            // Default center of the map
                
            //map.setView(point, 5);
             scope.$watch("center", function(center) {
                    if (center === undefined) return;

                    // Center of the map
                    center = new L.LatLng(scope.center.lat, scope.center.lng);
                    var zoom = scope.zoom || 8;
                    map.setView(center, zoom);

                    var marker = new L.marker(scope.center, { draggable: attrs.markcenter ? false:true });
                    if (attrs.markcenter || attrs.marker) {
                        map.addLayer(marker);

                        if (scope.message) {
                            marker.bindPopup("<strong>" + scope.message + "</strong>", { closeButton: false });
                            marker.openPopup();
                        }
                        if (attrs.marker) {
                            scope.marker.lat = marker.getLatLng().lat;
                            scope.marker.lng = marker.getLatLng().lng;
                        }
                    }

                    // Listen for map drags
                    var dragging_map = false;
                    map.on("dragstart", function(e) {
                        dragging_map = true;
                    });

                    map.on("drag", function (e) {
                        scope.$apply(function (s) {
                            s.center.lat = map.getCenter().lat;
                            s.center.lng = map.getCenter().lng;
                        });
                    });

                    map.on("dragend", function(e) {
                        dragging_map= false;
                    });

                    scope.$watch("center.lng", function (newValue, oldValue) {
                        if (dragging_map) return;
                        map.setView(new L.LatLng(map.getCenter().lat, newValue), map.getZoom());
                    });

                    scope.$watch("center.lat", function (newValue, oldValue) {
                        if (dragging_map) return;
                        map.setView(new L.LatLng(newValue, map.getCenter().lng), map.getZoom());
                    });

                    // Listen for zoom
                    scope.$watch("zoom", function (newValue, oldValue) {
                        map.setZoom(newValue);
                    });

                    map.on("zoomend", function (e) {
                        scope.zoom = map.getZoom();
                        scope.$apply();
                    });

                    if (attrs.marker) {   

                        var dragging_marker = false;

                        // Listen for marker drags
                        (function () {                      

                            marker.on("dragstart", function(e) {
                                dragging_marker = true;
                            });

                            marker.on("drag", function (e) {
                                scope.$apply(function (s) {
                                    s.marker.lat = marker.getLatLng().lat;
                                    s.marker.lng = marker.getLatLng().lng;
                                });
                            });

                            marker.on("dragend", function(e) {
                                marker.openPopup();
                                dragging_marker = false;
                            });

                            map.on("click", function(e) {
                                marker.setLatLng(e.latlng);
                                marker.openPopup();
                                scope.$apply(function (s) {
                                    s.marker.lat = marker.getLatLng().lat;
                                    s.marker.lng = marker.getLatLng().lng;
                                });
                            });

                            scope.$watch("marker.lng", function (newValue, oldValue) {
                                if (dragging_marker) return;
                                marker.setLatLng(new L.LatLng(marker.getLatLng().lat, newValue));
                            });

                            scope.$watch("marker.lat", function (newValue, oldValue) {
                                if (dragging_marker) return;
                                marker.setLatLng(new L.LatLng(newValue, marker.getLatLng().lng));
                            });

                        }());

                    }               

                });

            //Keep an eye on the Map control and its "pointsource", as whenever this changes we have new markers to place on the map
            scope.$watch("pointsource", function(pointsource) {
                clearPoints();
                plotPoints(pointsource);
            });

            var popup = L.popup();
            function onMapClick(e) {

             popup
                 .setLatLng(e.latlng)
                 .setContent("You clicked the map at " + e.latlng.toString())
                 .openOn(map);
        }

        function positionSuccess(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var acr = position.coords.accuracy;

            // mark user's position
            var userMarker = L.marker([lat, lng], {
                icon: redIcon
            }); 

            // set map bounds
            //map.fitWorld();

            // TODO - trying out something here. This was the red marker that shows you where you are but instead
            // show a blue marker that enables you to record your current location on the database
            userMarker.addTo(map);
            userMarker.bindPopup('<p>Place 1</p>').openPopup();
            var popup = L.popup();

            var point = new L.LatLng(lat, lng);

            scope.marker.lat = position.coords.latitude;
            scope.marker.lng = position.coords.longitude;
        }

        // handle geolocation api errors
        function positionError(error) {
            var errors = {
                1: 'Authorization fails', // permission denied
                2: 'Can\'t detect your location', //position unavailable
                3: 'Connection timeout' // timeout
            };
            showError('Error:' + errors[error.code]);
        }

        map.on('click', onMapClick);

        // check whether browser supports geolocation api
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
        } else {
            $('.map').text('Your browser is out of fashion, there\'s no geolocation!');
            }
        }
    };
});
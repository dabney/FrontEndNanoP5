// constants
var INITIAL_LATITUDE = 37.7833; //initial position set to San Francisco
var INITIAL_LONGITUDE = -122.4167;
var NUMBER_OF_PHOTOS_TO_SHOW = 3; // number of Flickr thumbnails to show

// A class to manage the map related functions including the infoWindow and marker behavior
var BasicGoogleMapManager = function(theViewModel) {
  this.currentlySelectedMarker=null;
  this.currentInfoWindowContentString='';
  this.mapOptions = {
    center: {
      lat: INITIAL_LATITUDE,
      lng: INITIAL_LONGITUDE
    },
    zoom: 12,
    zoomControl: true,
    disableDefaultUI: true
  };
  this.map = new google.maps.Map(document.getElementById('map-canvas'), this.mapOptions);
  this.infoWindow = new google.maps.InfoWindow({maxWidth: 260,});
  this.infoWindow.context = theViewModel;
}

BasicGoogleMapManager.prototype.centerMap = function(googleLatLng) {
  this.map.setCenter(googleLatLng);
}

BasicGoogleMapManager.prototype.panMap = function(xOffset, yOffset) {
  this.map.panBy(xOffset, yOffset);
}

BasicGoogleMapManager.prototype.resetInfoWindowContent = function(contentString) {
  this.currentInfoWindowContentString=contentString;
  this.infoWindow.setContent(contentString);
}

BasicGoogleMapManager.prototype.appendInfoWindowContent = function(contentString) {
  this.currentInfoWindowContentString=this.currentInfoWindowContentString + contentString;
  this.infoWindow.setContent(this.currentInfoWindowContentString);
}

BasicGoogleMapManager.prototype.openInfoWindow = function(mapMarker) {
  this.infoWindow.open(this.map, mapMarker);
}

BasicGoogleMapManager.prototype.closeInfoWindow = function(mapMarker) {
  this.infoWindow.close();
}

BasicGoogleMapManager.prototype.createMarker = function(lat, lng, customData) {
  var googleLatLng = new google.maps.LatLng(lat, lng);
  var marker = new google.maps.Marker({
                                       map: this.map,
                                       draggable: false,
                                       position: googleLatLng,
                                       optimized: false, //required to use gif
                                       icon: 'images/carrot_in_ground.png'
                                      });
  marker.customData = customData;
  return (marker);
}

BasicGoogleMapManager.prototype.showMarker = function(marker) {
  marker.setVisible(true);
}

BasicGoogleMapManager.prototype.hideMarker = function(marker) {
  marker.setVisible(false);
}

BasicGoogleMapManager.prototype.selectMarker = function(marker) {
  // reset previously selected marker's icon
  if (this.currentlySelectedMarker) {
    this.currentlySelectedMarker.setIcon('images/carrot_in_ground.png');
  }
  this.currentlySelectedMarker = marker;
  this.currentlySelectedMarker.setIcon('images/carrot_picked_with_face.gif');
}

BasicGoogleMapManager.prototype.deselectMarker = function() {
  if (this.currentlySelectedMarker) {
    this.currentlySelectedMarker.setIcon('images/carrot_in_ground.png');
    this.currentlySelectedMarker = null;
  }
}

// Our ViewModel with our Knockout observables and enclosing our other functions
var ViewModel = function() {
  var self = this;
  var filteredOutPlaces = [];
  var googlePlacesSearch;
  var mapManager;
  var FarmersMarketAJAXSuccess = false;

  self.placesList = ko.observableArray([]);
  self.filterInput = ko.observable();
  self.toggleMenuBoolean = ko.observable(true);

// This function sends an AJAX request for the farmers' markets closest to the lat, lng
// from the USDA Farmers' Market API.  More details about the API can be found at 
// (http://search.ams.usda.gov/farmersmarkets/v1/svcdesc.html).  The API seems to 
// always return exactly 19 markets.  The data returned is an integer ID and a marketname
// string that contains the distance from the lat lng and the name of the market.  We will
// create a place object to store the ID and marketName and then must make a second
// AJAX request for each market to get further details including its lat, lng
  function getFarmersMarketsByLatLng(lat, lng) {

    $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat="
                  + lat + "&lng=" + lng,
            dataType: 'jsonp'
            })
     .done(function(searchResults) {
            // the call to the USDA website worked, so set our success flag to true
            // when our timeout completes no error message will be displayed
            FarmersMarketAJAXSuccess = true;
            for (var i = 0; i < searchResults.results.length; i++) {
              var place = {
                // parse the market name from the market name string; do not need the distance
                marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ') + 1),
                marketID: searchResults.results[i].id
              };
              getFarmersMarketDetails(place);
            }
          })
      .fail(function() {
              alert("fail: Error getting farmers market data from usda.gov");
            });
  }


// This function sends an AJAX request to the USDA Farmers' Market API for the details of
// a particular farmers' market.  The detailed info includes a Google link string from which
// we parse the lat, lng, plus the schedule, the address, and the products available.  This 
// additional info will be added to our place object which was passed as the context of the AJAX
// request.  We create and add a map marker with event listener to each place object, then push
// the place onto our placesList
  function getFarmersMarketDetails(place) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service mktDetail.
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id="
               + place.marketID,
        context: place,
        dataType: 'jsonp',
        cache: false
          })
      // In the done function 'this' will be the context which is set to the 'place'
      // that was created in getFarmersMarketsByLatLng
      .done(function(detailResults) {
        if (detailResults) {
          var marketDetails = detailResults.marketdetails;
          var googleLink = marketDetails.GoogleLink;
          var latStringStart = googleLink.indexOf('?q=') + 3;
          var latStringEnd = googleLink.indexOf('%2C%20');
          var lngStringStart = latStringEnd + 6;
          var lngStringEnd = googleLink.lastIndexOf('%20');
          this.lat = googleLink.substring(latStringStart, latStringEnd);
          this.lng = googleLink.substring(lngStringStart, lngStringEnd);
          this.address = marketDetails.Address;
          this.schedule = marketDetails.Schedule;
          this.products = marketDetails.Products;
          this.mapMarker = mapManager.createMarker(this.lat, this.lng, this);
          self.placesList.push(this);
          addMapMarkerEventListener(this.mapMarker);
        }
      })
      .fail(function() {
        alert("Error getting farmers market detail data from usda.gov");
      });
  }

// This functions makes an AJAX request to the Flickr Photos Search API 
// (https://www.flickr.com/services/api/flickr.photos.search.html) for 
// any photos matching the market name of a farmers' market.  If successful
// it calls the function to add the photos to the infowindow on the map
  var addFlickrPhotos = function(marketName) {
    // Remove apostrophes from the market name for the Flickr photo search
    var marketNameSimplified = marketName.replace(/'/g, '');
    // Construct the API URL to search for the simplified market name
    var apiURLPartOne = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=376b144109ffe90065a254606c9aae3d&&tags=';
    var apiURLPartTwo = '&tag_mode=all&sort=interestingness-desc&safe_search=1&extras=date_taken&format=json&nojsoncallback=1';
    var apiURLCombined = apiURLPartOne + marketNameSimplified + apiURLPartTwo;

    // Make the AJAX call
    $.ajax({
        type: "GET",
        url: apiURLCombined,
        dataType: 'json',
        success: function(data) {
            showFlickrPhotosInInfoWindow(data.photos.photo);
          },
        error: function() {
            errorGettingFlickrPhotosHandler();
        }
    });
  } //end addFlickrPhotos

// This function processes the data returned from the Flickr AJAX request and makes
// a call to the mapManager to display them (or an appropriate message if no photos
// are available) in the map infoWindow
  var showFlickrPhotosInInfoWindow = function(photoArray) {
    var currentPhoto;
    var currentPhotoThumbnailURL;
    var currentPhotoURL;

    if (photoArray.length > 0) {
      mapManager.appendInfoWindowContent('Flickr Photos (click to open photo in new window)<br>');
      for (var i = 0; i < NUMBER_OF_PHOTOS_TO_SHOW; i++) {
        if (photoArray[i]) {
          currentPhoto = photoArray[i];
          currentPhotoThumbnailURL = "https://farm" + 
                currentPhoto.farm + ".staticflickr.com/" + 
                currentPhoto.server + "/" + 
                currentPhoto.id + "_" + 
                currentPhoto.secret + "_s.jpg";
          currentPhotoURL = "https://farm" + 
                currentPhoto.farm + ".staticflickr.com/" + 
                currentPhoto.server + "/" + 
                currentPhoto.id + "_" + 
                currentPhoto.secret + ".jpg";
          mapManager.appendInfoWindowContent("<a href=" + currentPhotoURL + 
                " target=\"_blank\"" + 
                "><img class=\"photo\" src=" + 
                currentPhotoThumbnailURL + ">");
        }
      }
    } 
    else {
      mapManager.appendInfoWindowContent("No Flickr Photos Found<br>");
    }
  }

  var errorGettingFlickrPhotosHandler = function() {
    mapManager.appendInfoWindowContent("Error retrieving Flickr photos<br>");
  }

// This function handles a user input in a text box to filter/search the list of markets
// for keywords such as market name, address, days open, and products sold
  filterInputHandler = function() {
    var inputString;
    var listLength;
    var currentPlace;
    var currentPlaceStringMashup;

    // get the string from the text box and continue if value is returned
    if (inputString = self.filterInput()) {
      // deselect currently selected map marker and close its infowindow
      mapManager.deselectMarker();
      mapManager.closeInfoWindow();
      // restore places list to unfiltered state
      restorePlacesList();
      //make the input lower case for matching
      inputString = inputString.toLowerCase();
      // go through the placesList looking for matches; remove non-matching places and push to filteredOutPlaces
      listLength = self.placesList().length;
      for (var i = listLength - 1; i >= 0; i--) {
        currentPlace = self.placesList()[i];
        currentPlaceStringMashup = currentPlace.marketName + ' ' + currentPlace.address +   ' ' + currentPlace.products + ' ' + currentPlace.schedule;
        currentPlaceStringMashup = currentPlaceStringMashup.toLowerCase();
        if (currentPlaceStringMashup.indexOf(inputString) == -1) {
          mapManager.hideMarker(currentPlace.mapMarker);
          self.placesList.remove(currentPlace);
          filteredOutPlaces.push(currentPlace);
        }
      }
    }
    // if nothing was entered, filter by nothing and restore list to original
    else {
      restorePlacesList();
    }
  }

  restorePlacesList = function() {
    var listLength;
    var currentPlace;
        // restore the placesList to prefiltered state
    listLength = filteredOutPlaces.length;
    for (var i = listLength - 1; i >= 0; i--) {
      currentPlace = filteredOutPlaces.pop();
      mapManager.showMarker(currentPlace.mapMarker);
      self.placesList.push(currentPlace);
    }
  }

  // The callback when the user enters a new location in the Google Places SearchBox
  // if a valid new location has been entered, the placesList is cleared, the map markers
  // and infowindow are reset, the map is recentered on the new lat, lng and the farmers'
  // market data is requested and processed
  locationInputHandler = function() {
    var googlePlaces;
    var currentMapLatLng;

    googlePlaces = self.googlePlacesSearch.getPlaces();
    if (googlePlaces.length > 0) {
      clearPlacesList();
      mapManager.deselectMarker();
      mapManager.closeInfoWindow();
      currentMapLatLng = googlePlaces[0].geometry.location;
      mapManager.centerMap(currentMapLatLng);
      getFarmersMarketsByLatLng(currentMapLatLng.lat(), currentMapLatLng.lng());
    } 
    else {
      alert("No matching locations");
    }
  }

  clearPlacesList = function() {
    var listLength;
    listLength = self.placesList().length;
    for (var i = listLength - 1; i >= 0; i--) {
      currentPlace = self.placesList.pop();
      currentPlace.mapMarker.setMap(null);
    }
  }

  menuToggleHandler = function() {
    if (self.toggleMenuBoolean()) {
      self.toggleMenuBoolean(false);
    } 
    else {
      self.toggleMenuBoolean(true);
    }
  }

// A function to update the map items when the user selects a 
// market by clicking the list or a map marker
  function placePickedHandler(place) {
    showDetailedInfo(place);
    mapManager.selectMarker(place.mapMarker);
    mapManager.centerMap(place.mapMarker.getPosition());
    // Pan the map for short windows
    if (window.innerHeight <= 720) {
      mapManager.panMap(-60, -150);
    }
    // Hide the menu for narrow windows
    if (window.innerWidth <= 1020) {
      self.toggleMenuBoolean(false);
    }
  }

// The handler for when the list is clicked
  self.listClickHandler = function(clickedPlace) {
    placePickedHandler(clickedPlace);
  }

// Create an event listener for a map marker.  The customData for the marker
// stores the place object associated with the marker
  function addMapMarkerEventListener(marker) {
    google.maps.event.addListener(marker, 'click', function() {
                                         placePickedHandler(marker.customData);
    });
  }

// A function to show the market details and Flickr photo thumbnails in the
// map infoWindow
  function showDetailedInfo(place) {
    var contentString;

    // Construct different strings for different heights
    // Future fix: use icons instead of text for Products
    if (window.innerHeight > 720) {
      contentString =
        '<h4>' + place.marketName + '</h4><br>' +
        '<h4>' + place.address + '</h4><br>' +
        'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br>' +
        'Products: ' + place.products + '<br><br>';
    } 
    else {
      contentString =
        '<h4>' + place.marketName + '</h4><br>' +
        '<h4>' + place.address + '</h4><br>' +
        'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br><br>';
    }
    mapManager.resetInfoWindowContent(contentString);
    addFlickrPhotos(place.marketName);
    mapManager.openInfoWindow(place.mapMarker);
  }

// A function to initialize the map and markets for the lat, lng specified in
// the INITIAL_LATITUDE, INITIAL_LONGITUDE constants
  function initialize() {
    mapManager = new BasicGoogleMapManager(self);
    if (mapManager.map) { 
      google.maps.event.addListener(mapManager.infoWindow, 'closeclick', 
                                       function() {
                                          mapManager.deselectMarker();
                                       });
      self.googlePlacesSearch = new google.maps.places.SearchBox(document.getElementById('location-box'));
      google.maps.event.addListener(self.googlePlacesSearch, 'places_changed', 
                                        locationInputHandler);
      // set up a timeout that runs a function that will check whether or not
      // our AJAX call to the Farmers' Market API was successful and will alert
      // the user if it was not
      setTimeout(function() {
            if (!FarmersMarketAJAXSuccess) {
              alert("Error getting farmers market data from usda.gov");}
            }, 8000);
      getFarmersMarketsByLatLng(INITIAL_LATITUDE, INITIAL_LONGITUDE);
    }
    else {
      alert("failed to load Google map - check your internet connection or firewall settings")
    }
  }

// Call to initialize
  if (window.google) {
    google.maps.event.addDomListener(window, 'load', initialize);
  } 
  else {
    alert('Google maps unavailable - check your internet connection or firewall settings and reload');
  }

}; //end ViewModel

// Apply the Knockout Bindings
ko.applyBindings(new ViewModel());
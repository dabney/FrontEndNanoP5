var INITIAL_LATITUDE = 37.7833; //initial position set to San Francisco
var INITIAL_LONGITUDE = -122.4167;
var NUMBER_OF_PHOTOS_TO_SHOW = 3; // number of Flickr thumbnails to show


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
      optimized: false, //required to use gif when marker selected
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

var ViewModel = function() {
  var self = this;
  var filteredOutPlaces = [];
  var googlePlacesSearch;
  var mapManager;

  self.placesList = ko.observableArray([]);
  self.filterInput = ko.observable();
  self.toggleMenuBoolean = ko.observable(true);


  function getFarmersMarketsByLatLng(lat, lng) {
    var myRequest = $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat="
                 + lat + "&lng=" + lng,
        dataType: 'jsonp'
      })
      .done(function(searchResults) {
        for (var i = 0; i < searchResults.results.length; i++) {
          var place = {
            marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ') + 1),
            marketID: searchResults.results[i].id
          };
          getFarmersMarketDetails(place);
        }
      })
      .fail(function() {
        alert("Error getting farmers market data from usda.gov");
      });
  }


  function getFarmersMarketDetails(place) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service mktDetail.
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + place.marketID,
        context: place,
        dataType: 'jsonp',
        cache: false
      })
      // In the success function this will be the context which is set to 'place'
      .done(function(detailResults) {
        if (detailResults) {
          var marketDetails = detailResults.marketdetails;
          var googleLink = marketDetails.GoogleLink;
          var latStringStart = googleLink.indexOf('?q=') + 3;
          var latStringEnd = googleLink.indexOf('%2C%20')
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


  var addFlickrPhotos = function(marketName) {
    // Remove apostrophes from the market name for the Flickr photo search
    var marketNameSimplified = marketName.replace(/'/g, '');
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
  };

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
  locationInputHandler = function() {
    var googlePlaces;
    var currentMapLatLng;

    googlePlaces = self.googlePlacesSearch.getPlaces();
    if (googlePlaces.length > 0) {
      clearPlacesList();
      mapManager.centerMap(googlePlaces[0].geometry.location);
      currentMapLatLng = googlePlaces[0].geometry.location;
      getFarmersMarketsByLatLng(currentMapLatLng.lat(), currentMapLatLng.lng());
    } else {
      alert("No matching locations");
    }
  };

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
    } else {
      self.toggleMenuBoolean(true);
    }
  }

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


self.listClickHandler = function(clickedPlace) {
    placePickedHandler(clickedPlace);
  }

function addMapMarkerEventListener(marker) {
       google.maps.event.addListener(marker, 'click', function() {
        placePickedHandler(marker.customData);
  
    });
}

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
    } else {
      contentString =
        '<h4>' + place.marketName + '</h4><br>' +
        '<h4>' + place.address + '</h4><br>' +
        'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br><br>';
    }
    mapManager.resetInfoWindowContent(contentString);
    addFlickrPhotos(place.marketName);
    mapManager.openInfoWindow(place.mapMarker);

  }

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


      getFarmersMarketsByLatLng(INITIAL_LATITUDE, INITIAL_LONGITUDE);
    } else {
      alert("failed to load Google map - check your internet connection or firewall settings")
    }
  };

  if (window.google) {
    google.maps.event.addDomListener(window, 'load', initialize);
  } else {
    alert('Google maps unavailable - check your internet connection or firewall settings and reload');
  }

}; //end ViewModel
ko.applyBindings(new ViewModel());
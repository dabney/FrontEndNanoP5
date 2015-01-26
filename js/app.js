var INITIAL_LATITUDE = 37.7833;
var INITIAL_LONGITUDE = -122.4167;
var NUMBER_OF_PHOTOS_TO_SHOW = 3;

var BasicGoogleMap = function(theViewModel) {
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

BasicGoogleMap.prototype.resetInfoWindowContent = function(contentString) {
        this.currentInfoWindowContentString=contentString;
        this.infoWindow.setContent(contentString);
}

BasicGoogleMap.prototype.appendInfoWindowContent = function(contentString) {
        this.currentInfoWindowContentString=this.currentInfoWindowContentString + contentString;
        this.infoWindow.setContent(this.currentInfoWindowContentString);
}

BasicGoogleMap.prototype.openInfoWindow = function(mapMarker) {
    this.infoWindow.open(this.map, mapMarker);
}

BasicGoogleMap.prototype.createMarker = function(lat, lng, customData) {
    console.log('in createMarker');
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

var ViewModel = function() {
  var self = this;
  var map;
  var selectedMarker;
  var filteredOutPlaces = [];
  var googlePlacesSearch;
  var infoWindowContentString;
  var infoWindow;

  self.placesList = ko.observableArray([]);
  self.searchInput = ko.observable();
  self.toggleMenuBoolean = ko.observable(true);

  searchInputHandler = function() {
    var inputString;
    var listLength;
    var currentPlace;
    var currentPlaceStringMashup;

    // get the string from the text box and continue if value is returned
    if (inputString = self.searchInput()) {
    //then make it lower case for matching
     inputString = inputString.toLowerCase();
     // restore places list to unfiltered state
     resetPlacesList();
    // go through the placesList looking for matches; remove non-matching places and push to filteredOutPlaces
      listLength = self.placesList().length;
      for (var i = listLength - 1; i >= 0; i--) {
        currentPlace = self.placesList()[i];
        currentPlaceStringMashup = currentPlace.marketName + ' ' + currentPlace.address +   ' ' + currentPlace.products + ' ' + currentPlace.schedule;
        currentPlaceStringMashup = currentPlaceStringMashup.toLowerCase();
        if (currentPlaceStringMashup.indexOf(inputString) == -1) {
          currentPlace.mapMarker.setVisible(false);
          self.placesList.remove(currentPlace);
          filteredOutPlaces.push(currentPlace);
        }
      }
    }
    // if nothing was entered restore list to original
    else {
      resetPlacesList();
    }
  };

resetPlacesList = function() {
        var listLength;
    var currentPlace;
        // restore the placesList to prefiltered state
      listLength = filteredOutPlaces.length;
      for (var i = listLength - 1; i >= 0; i--) {
        currentPlace = filteredOutPlaces.pop();
        currentPlace.mapMarker.setVisible(false);
        self.placesList.push(currentPlace);
      }
}


  locationInputFormSubmitHandler = function() {
    alert('locationInputForm submit');
  }


  // The callback when the user enters a new location in the Google Places SearchBox
  locationInputHandler = function() {
    var googlePlaces;
    var currentMapLatLng;

    googlePlaces = self.googlePlacesSearch.getPlaces();
    if (googlePlaces.length > 0) {
      clearPlacesList();
      map.setCenter(googlePlaces[0].geometry.location);
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

  self.listClickHandler = function(clickedPlace) {
    showDetailedInfo(clickedPlace);
    self.toggleMenuBoolean(false);
    if (selectedMarker) {
      selectedMarker.setIcon('images/carrot_in_ground.png');
    };
    selectedMarker = clickedPlace.mapMarker;
    selectedMarker.setIcon('images/carrot_picked_with_face.gif');
    map.setCenter(selectedMarker.getPosition());
    map.panBy(-60, -150);
  }

  menuToggleHandler = function() {
    console.log(self.toggleMenuBoolean());
    if (self.toggleMenuBoolean()) {
      self.toggleMenuBoolean(false);
    } else {
      self.toggleMenuBoolean(true);
    }
  }

// Retrieve the farmers market data by zip code
// Not used in current implementation; leaving in for future use...
  function getFarmersMarketsByZip(zip) {
    $.ajax({
      type: "GET",
      contentType: "application/json; charset=utf-8",
      url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
      dataType: 'jsonp',
      success: function(searchResults) {
        for (var i = 0; i < searchResults.results.length; i++) {
          var place = {
            marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ') + 1),
            marketID: searchResults.results[i].id
          };
          getFarmersMarketDetails(place);

          self.placesList.push(place);
        }
      },
      error: function() {
        alert("Error getting data");
      }
    });
  }

  function getFarmersMarketsByLatLng(lat, lng) {
    var myRequest = $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
        dataType: 'jsonp'
      })
      .done(function(searchResults) {
        for (var i = 0; i < searchResults.results.length; i++) {
          var place = {
            marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ') + 1),
            marketID: searchResults.results[i].id
          };
          getFarmersMarketDetails(place);
          self.placesList.push(place);

        }
      })
      .fail(function() {
        alert("Error getting farmers market data from usda.gov");
      });
  }


  function getFarmersMarketsByLatLng_OLD(lat, lng) {
    $.ajax({
      type: "GET",
      contentType: "application/json; charset=utf-8",
      url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
      dataType: 'jsonp',
      success: function(searchResults) {
        for (var i = 0; i < searchResults.results.length; i++) {
          var place = {
            marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ') + 1),
            marketID: searchResults.results[i].id
          };
          getFarmersMarketDetails(place);
          self.placesList.push(place);

        }
      },
      error: function() {
        alert("Error getting farmers market data from usda.gov");
      }
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
          this.mapMarker = myMapObject.createMarker(this.lat, this.lng, this);
          addMapMarkerEventListener(this.mapMarker);
          //this.mapInfoWindow = createInfoWindow(this);

          //      console.dir(this);
        }
      })
      .fail(function() {
        alert("Error getting farmers market detail data from usda.gov");
      });
  }

function addMapMarkerEventListener(marker) {
       google.maps.event.addListener(marker, 'click', function() {
      if (selectedMarker) {
        selectedMarker.setIcon('images/carrot_in_ground.png'); // reset previously selected marker's icon
      }
      showDetailedInfo(marker.customData);
      marker.setIcon('images/carrot_picked_with_face.gif');
      selectedMarker = marker;
      this.map.setCenter(selectedMarker.getPosition());
      if (window.innerHeight <= 720) {
        self.toggleMenuBoolean(false);
        this.map.panBy(-60, -150);
      }
    });
}

  function showDetailedInfo(place) {

    if (window.innerHeight > 480) {
      infoWindowContentString =
        '<h4>' + place.marketName + '</h4><br>' +
        '<h4>' + place.address + '</h4><br>' +
        'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br>' +
        'Products: ' + place.products + '<br><br>';
    } else {
      infoWindowContentString =
        '<h4>' + place.marketName + '</h4><br>' +
        '<h4>' + place.address + '</h4><br>' +
        'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br><br>';
    }
myMapObject.resetInfoWindowContent(infoWindowContentString);
    addFlickrPhotos(place.marketName);
    myMapObject.openInfoWindow(place.mapMarker);
  }

  function initialize() {

    myMapObject = new BasicGoogleMap(self);
    map = myMapObject.map;
    if (map) {

infoWindow = myMapObject.infoWindow;
    //  infoWindow.context = self;
 
      google.maps.event.addListener(infoWindow, 'closeclick', function() {
        selectedMarker.setIcon('images/carrot_in_ground.png');
      });

      var locationInputBox = (document.getElementById('location-box'));
      self.googlePlacesSearch = new google.maps.places.SearchBox(locationInputBox);
      google.maps.event.addListener(self.googlePlacesSearch, 'places_changed', locationInputHandler);


      //getFarmersMarketsByZip(35223);
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
      myMapObject.appendInfoWindowContent('Flickr Photos (click to open photo in new window)<br>');
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
          myMapObject.appendInfoWindowContent("<a href=" + currentPhotoURL + 
                " target=\"_blank\"" + 
                "><img class=\"photo\" src=" + 
                currentPhotoThumbnailURL + ">");
        }
      }
    } 
    else {
      myMapObject.appendInfoWindowContent("No Flickr Photos Found<br>");
    }
  }

  var errorGettingFlickrPhotosHandler = function() {
    myMapObject.appendInfoWindowContent("Error retrieving Flickr photos<br>");
  }

}; //end ViewModel

ko.applyBindings(new ViewModel());
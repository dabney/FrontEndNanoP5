var ViewModel = function() {
  var self = this;
  var map;
  var selectedMarker;
  var filteredOutPlaces = [];
  var googlePlacesSearch;
  var currentMapLatLng;
  var infoWindowContentString;
  var infoWindow;

 self.placesList = ko.observableArray([]);
  self.searchInput = ko.observable();
    self.searchInput = ko.observable();

  self.toggleListValue = ko.observable(true);

searchInputHandler = function() { 
  var inputString;
  var listLength;
  var currentPlace;
  var currentPlaceStringMashup;

// restore the placesList to prefiltered state
  listLength = filteredOutPlaces.length;
  for (var i=listLength-1; i>=0; i--) {
    currentPlace = filteredOutPlaces.pop();
    currentPlace.mapMarker.setVisible(false);
    self.placesList.push(currentPlace);
  }

// get the string from the text box and make it lower case for matching
  inputString = self.searchInput().toLowerCase();

// go through the placesList looking for matches; remove non-matching places and push to filteredOutPlaces
  listLength = self.placesList().length;
  for (var i=listLength-1; i>=0; i--) {
    currentPlace = self.placesList()[i];
    currentPlaceStringMashup = currentPlace.marketName + ' ' + currentPlace.address + ' ' + currentPlace.products + ' ' + currentPlace.schedule;
    currentPlaceStringMashup = currentPlaceStringMashup.toLowerCase();
    if (currentPlaceStringMashup.indexOf(inputString) == -1) {
      currentPlace.mapMarker.setVisible(false);
      self.placesList.remove(currentPlace);
      filteredOutPlaces.push(currentPlace);
    }
  }
};

locationInputFormSubmitHandler = function() {
    alert('locationInputForm submit');
}


// The callback when the user enters a new location in the Google Places SearchBox
locationInputHandler = function() {
  var googlePlaces;

  googlePlaces = self.googlePlacesSearch.getPlaces();
  if (googlePlaces.length > 0) {
    clearPlacesList();
    map.setCenter(googlePlaces[0].geometry.location);
    currentMapLatLng = googlePlaces[0].geometry.location;
    getFarmersMarketsByLatLng(googlePlaces[0].geometry.location.lat(), googlePlaces[0].geometry.location.lng());
  }
  else {
    alert("No matching locations");
  }
};

clearPlacesList = function() {
  var listLength;
  listLength = self.placesList().length;

  for (var i=listLength-1; i>=0; i--) {
    currentPlace = self.placesList.pop();
    currentPlace.mapMarker.setMap(null);
  }
   
}

self.setPlace = function(clickedPlace) {
  showInfoWindow(clickedPlace);
  self.toggleListValue(false);
  if (selectedMarker) {
    selectedMarker.setIcon('images/carrot_in_ground.png');
  };
  selectedMarker = clickedPlace.mapMarker;
  selectedMarker.setIcon('images/carrot_picked.png');
  map.setCenter(selectedMarker.getPosition());
  map.panBy(0, -150);
}

placeListToggleHandler = function() {
    console.log(self.toggleListValue());
   // alert('togglePlaceListHandler');
    if (self.toggleListValue()) {
    self.toggleListValue(false);
}
  else {
    self.toggleListValue(true);
}
}

 function getFarmersMarketsByZip(zip) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
        dataType: 'jsonp',
        success: function(searchResults) {
          for (var i = 0; i < searchResults.results.length; i++) {
            var place = {
                marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1),
                marketID: searchResults.results[i].id
            };
            getFarmersMarketDetails(place);

            self.placesList.push(place);
            }
          },
        error: function() {alert("Error getting data");}
    });
}

function getFarmersMarketsByLatLng(lat, lng) {
    var myRequest = $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
        dataType: 'jsonp'})
        .done(function(searchResults) {
                   for (var i = 0; i < searchResults.results.length; i++) {
                     var place = {
                       marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1),
                       marketID: searchResults.results[i].id
                     };
                     getFarmersMarketDetails(place);
                     self.placesList.push(place);

                   }
                 })
        .fail(function() {
            alert("Error getting farmers markets from usda.gov");
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
                       marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1),
                       marketID: searchResults.results[i].id
                     };
                     getFarmersMarketDetails(place);
                     self.placesList.push(place);

                   }
                 },
        error: function() {alert("Error getting data");}
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
        cache: false})
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
        this.mapMarker = createMapMarker(this.lat, this.lng, this);
        //this.mapInfoWindow = createInfoWindow(this);

  //      console.dir(this);
    }
    })
    .fail(function() {
        alert("Error getting market detail data from usda.gov");
    });
}


function createMapMarker (lat, lng, customData) {
  var googleLatLng = new google.maps.LatLng(lat, lng);
  var marker = new google.maps.Marker({
               map: map,
               draggable: false,
               position: googleLatLng,
               icon: 'images/carrot_in_ground.png'
                });
  marker.customData = customData;
  google.maps.event.addListener(marker, 'click', function() {
            if (selectedMarker) {
              selectedMarker.setIcon('images/carrot_in_ground.png'); // reset previously selected marker's icon
          }
            showInfoWindow(marker.customData);
            self.toggleListValue(false);
            marker.setIcon('images/carrot_picked.png');
            selectedMarker = marker;
            map.setCenter(selectedMarker.getPosition());
            map.panBy(0, -150);
  });
        return(marker);
}


function showInfoWindow (place) {
  // Remove apostrophes from the market name for the Flickr photo search
  var marketNameFixed = place.marketName.replace(/'/g, '');
    if (window.innerHeight > 480) {
  infoWindowContentString = 
    '<h4>' + place.marketName + '</h4><br>' + 
    '<h4>' +place.address + '</h4><br>' +
    'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br>' +
    'Products: ' + place.products + '<br><br>' +
    'Flickr Photos (click to open photo in new window):<br>';
}
else {
  infoWindowContentString = 
    '<h4>' + place.marketName + '</h4><br>' + 
    '<h4>' +place.address + '</h4><br>' +
    'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br><br>' +
    'Flickr Photos (click to open photo in new window):<br>';
}

  infoWindow.setContent(infoWindowContentString );
  addFlickrPhotos(marketNameFixed);
  infoWindow.open(map, place.mapMarker);
}

function initialize() {
       var mapOptions = {
          center: { lat: 37.7833, lng: -122.4167},
          zoom: 13,
          disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
        if (map) {
        currentMapLatLng={ lat: 37.7833, lng: -122.4167};
infoWindow = new google.maps.InfoWindow(

    {
     // disableAutoPan: false,
      maxWidth: 260,
      zIndex: 500
  }
    );
infoWindow.context = self;

google.maps.event.addListener(window, 'resize', function() {
    map.setCenter(currentMapLatLng);
});
google.maps.event.addListener(infoWindow, 'closeclick', function() {
selectedMarker.setIcon('images/carrot_in_ground.png');
 });


          var locationInputBox = (document.getElementById('location-box'));
   self.googlePlacesSearch = new google.maps.places.SearchBox(locationInputBox);
// set bounds to prioritize conus - still messes up zip codes :(
var southWest = new google.maps.LatLng(18.00,-125.00);
var northEast = new google.maps.LatLng(49.00,-62.00);
var CONUSBounds = new google.maps.LatLngBounds(southWest,northEast);
  self.googlePlacesSearch.setBounds(CONUSBounds);
  google.maps.event.addListener(self.googlePlacesSearch, 'places_changed',   locationInputHandler);


//getFarmersMarketsByZip(35223);
getFarmersMarketsByLatLng(37.7833, -122.4167);
}
else {alert("failed to load Google map - check your internet connection or firewall settings")}
      };

  if (window.google) {
      google.maps.event.addDomListener(window, 'load', initialize);
  }
  else {
    alert('Google maps unavailable - check your internet connection or firewall settings and reload');
  }


var addFlickrPhotos = function(marketName) {
    var apiURLPartOne = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=376b144109ffe90065a254606c9aae3d&&tags=';
    var apiURLPartTwo = '&tag_mode=all&sort=interestingness-desc&safe_search=1&extras=date_taken&format=json&nojsoncallback=1';
    var apiURLCombined = apiURLPartOne + marketName + apiURLPartTwo;
    $.ajax({
        type: "GET",
        url: apiURLCombined,
        dataType: 'json',
        success: function(data) {
                   if (data.photos.photo.length > 0) {
                     showFlickrPhotosInInfoWindow(data.photos.photo);
                    }
                   else {
                     infoWindowContentString = infoWindowContentString.replace('Flickr Photos (click to open photo in new window):<br>', '');
                     infoWindowContentString = infoWindowContentString + "No Flickr Photos Found :(<br>";
                      infoWindow.setContent(infoWindowContentString);
                    }
                 },
        error: function() {alert("Error getting Flickr data");}
    });

} //end addFlickrPhotos

var showFlickrPhotosInInfoWindow = function(photoArray) {
    var currentPhoto;
    var currentPhotoThumbnailURL;
    var currentPhotoURL;


  for (var i=0; i<3; i++) {
    if (photoArray[i]){
      currentPhoto = photoArray[i];
      currentPhotoThumbnailURL = "https://farm" + currentPhoto.farm + ".staticflickr.com/" + currentPhoto.server
           + "/" + currentPhoto.id + "_" + currentPhoto.secret + "_s.jpg";
      currentPhotoURL = "https://farm" + currentPhoto.farm + ".staticflickr.com/" + currentPhoto.server
           + "/" + currentPhoto.id + "_" + currentPhoto.secret + ".jpg";
      infoWindowContentString = infoWindowContentString +
            "<a href=" + currentPhotoURL + " target=\"_blank\"" + "><img class=\"photo\" src=" + currentPhotoThumbnailURL + ">";
      infoWindow.setContent(infoWindowContentString);
    }
  }
}

}; //end ViewModel

ko.applyBindings(new ViewModel());

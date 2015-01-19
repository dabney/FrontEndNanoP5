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

searchInputHandler = function() { 
  var inputString;
  var listLength;
  var currentPlace;
  var currentPlaceStringMashup;

// restore the placesList to prefiltered state
  listLength = filteredOutPlaces.length;
  for (var i=listLength-1; i>=0; i--) {
    currentPlace = filteredOutPlaces.pop();
    currentPlace.mapMarker.setVisible(true);
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
  if (selectedMarker) {
    selectedMarker.setIcon('images/carrot_in_ground.png');
  };
  selectedMarker = clickedPlace.mapMarker;
  selectedMarker.setIcon('images/carrot_picked.png');
  map.setCenter(selectedMarker.getPosition());
  map.panBy(0, -150);
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
        cache: false,
        // In the success function this will be the context which is set to 'place'
       success: function(detailResults) {
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
    },
        error: function() {alert("Error getting data");}
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
            if (selectedMarker) selectedMarker.setIcon('images/carrot_in_ground.png'); // reset previously selected marker's icon
            showInfoWindow(marker.customData);
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
    /*
    infoWindowContentString = 
        '<h4>' + place.marketName + '</h4>' +
                '<p>' + place.address + '</p>' +
                '<p> Hours: ' + place.schedule.replace(/\<br\>/g, '') + '</p>' +
                '<p> Products: ' + place.products + '</p>' +
                '<input type=\"image\" src=\"https://s.yimg.com/pw/images/goodies/white-flickr.png\" onclick=\"showFlickrPhotos('
                    +'\''+marketNameFixed+'\','+place.lat+','+place.lng+')\" />';
    */
    infoWindowContentString = 
        '<h4>' + place.marketName + '</h4><br>' +
                '<h4>' + place.address + '</h4><br>' +
'Schedule: ' + place.schedule.replace(/\<br\>/g, '') + '<br>' +
'Products: ' + place.products + '<br>' +
                'Flickr Photos (click to open photo in new window):<br>' +
                /*
                '<li>' + '<input type=\"image\" src=\"https://s.yimg.com/pw/images/goodies/white-flickr.png\" onclick=\"showFlickrPhotos('
                    +'\''+marketNameFixed+'\','+place.lat+','+place.lng+')\" /> Click to show Flickr photos!' + '</li>' + */
                '</ul>';

           infoWindow.setContent(infoWindowContentString );
                    //  infoWindow.setContent(document.getElementById('photo-album'));
showFlickrPhotos(marketNameFixed, place.lat, place.lng);
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
        currentMapLatLng={ lat: 37.7833, lng: -122.4167};
infoWindow = new google.maps.InfoWindow(
    /*
    {
      disableAutoPan: false,
      maxWidth: 310
  }*/
    );
infoWindow.context = self;

google.maps.event.addListener(window, 'resize', function() {
    map.setCenter(currentMapLatLng);
});
google.maps.event.addListener(infoWindow, 'closeclick', function() {
selectedMarker.setIcon('images/carrot_in_ground.png');
//closeFlickrPhotoAlbum();

  });


          var locationInputBox = (document.getElementById('location-box'));
 // map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationInputBox);
var locationSearchOptions = {
  componentRestrictions: {country: 'us'}
};
  self.googlePlacesSearch = new google.maps.places.SearchBox((locationInputBox), locationSearchOptions);
  google.maps.event.addListener(self.googlePlacesSearch, 'places_changed',   locationInputHandler);


//getFarmersMarketsByZip(35223);
getFarmersMarketsByLatLng(37.7833, -122.4167);
      };
      google.maps.event.addDomListener(window, 'load', initialize);


var showFlickrPhotos = function(marketName, lat, lon) {
    /* with lat lon 
    var apiURLPartOne = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=376b144109ffe90065a254606c9aae3d&&tags=';
    var apiURLPartTwo = '&tag_mode=all&sort=interestingness-desc&safe_search=1&extras=date_taken&lat=';
    var apiURLPartThree = '&radius=.2&format=json&nojsoncallback=1';
    var apiURLCombined = apiURLPartOne + marketName + apiURLPartTwo + lat + '&lon=' + lon + apiURLPartThree;
    */
    var apiURLPartOne = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=376b144109ffe90065a254606c9aae3d&&tags=';
    var apiURLPartTwo = '&tag_mode=all&sort=interestingness-desc&safe_search=1&extras=date_taken&format=json&nojsoncallback=1';
    var apiURLCombined = apiURLPartOne + marketName + apiURLPartTwo;
  //  console.log('Show Flickr photos: ' + marketName + ',' + lat + ',' + lon);
  //  var photoAlbum = document.getElementById('photo-album');
  //  photoAlbum.style.display = 'block';
    //$.getJSON( "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=376b144109ffe90065a254606c9aae3d&&tags=farmers market&tag_mode='all'&sort=interestingness-desc&safe_search=1&extras=date_taken&lat=37.786250&lon=-122.404883&radius=.2&format=json&nojsoncallback=1",

  $.getJSON( apiURLCombined,

function(data) {
    var currentPhoto;
    var currentPhotoThumbnailURL;
   // var currentPhotoURL;

    console.log('number of photos: ' + data.photos.photo.length);
    if (data.photos.photo.length > 0) {
    for (var i=0; i<8; i++) {
        if (data.photos.photo[i]){
    currentPhoto = data.photos.photo[i];
  //  console.dir(currentPhoto);
    currentPhotoThumbnailURL = "https://farm" + currentPhoto.farm + ".staticflickr.com/" + currentPhoto.server
         + "/" + currentPhoto.id + "_" + currentPhoto.secret + "_s.jpg";
    currentPhotoURL = "https://farm" + currentPhoto.farm + ".staticflickr.com/" + currentPhoto.server
         + "/" + currentPhoto.id + "_" + currentPhoto.secret + ".jpg";
  //  $( "<img class=\"photo\">" ).attr( "src", currentPhotoThumbnailURL ).appendTo( "#photo-album" );
    infoWindowContentString = infoWindowContentString +
    "<a href=" + currentPhotoURL + " target=\"_blank\"" + "><img class=\"photo\" src=" + currentPhotoThumbnailURL + ">";
    infoWindow.setContent(infoWindowContentString);
    console.log(currentPhotoThumbnailURL);
}
}
}
else {
    console.log('no photos found');
        infoWindowContentString = infoWindowContentString + "No Flickr Photos Found :(<br>";
                infoWindow.setContent(infoWindowContentString);

}

}

  );
}
}; //end ViewModel

var closeFlickrPhotoAlbum = function() {
//    console.log('in close flickr album');
    $("#photo-album").hide();
    $( ".photo" ).remove();
}

ko.applyBindings(new ViewModel());

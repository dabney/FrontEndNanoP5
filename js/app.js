




      /*
detailResultHandler(getFarmersMarketDetails(1004066));
detailResultHandler(getFarmersMarketDetails(1002610));
detailResultHandler(getFarmersMarketDetails(1004625));
getFarmersMarketDetails(1003371);
getFarmersMarketDetails(1004624);
getFarmersMarketDetails(1003197);
getFarmersMarketDetails(1006492);
getFarmersMarketDetails(1005895);
getFarmersMarketDetails(1006885);
getFarmersMarketDetails(1005173);
getFarmersMarketDetails(1002443);
*/

var ViewModel = function() {
    var self = this;
    var map;

    self.placesList = ko.observableArray([]);

   // initialPlaces.forEach(function(placeItem) {
    //    self.placesList.push(new Place(placeItem));
    //});
    this.currentPlace = ko.observable(this.placesList()[0]);

    this.searchInput = ko.observable('Enter Search Term');
    searchInputHandler = function() {
    console.log('searchInputHandler: ' + self
        .searchInput());
};
self.setPlace = function(clickedPlace) {
    console.dir(clickedPlace);
    console.log('in setPlace: ' + clickedPlace.marketName);
}

 function getFarmersMarketsByZip(zip) {
    // or
    // function getResults(lat, lng) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service zipSearch or locSearch.
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
        // or
        // url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
        dataType: 'jsonp',
        success: function(searchResults) {
          for (var i = 0; i < searchResults.results.length; i++) {
            var place = {
                marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1),
                marketID: searchResults.results[i].id
            };
            getFarmersMarketDetails(place);
            self.placesList.push(place);
            //createMapMarker(33.5250+i, -86.8130, place);
            }
          }
    });
}

function getFarmersMarketsByLatLng(lat, lng) {
    // or
    // function getResults(lat, lng) {
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

            //createMapMarker(33.5250+i, -86.8130, place);
            }
                        console.log('placesList: ' + self.placesList());

          }
    });
}

//iterate through the JSON result object.
function searchResultsHandler(searchResults) {
    console.log('in searchResultsHandler');
    console.dir(searchResults);
    for (var key in searchResults) {
        console.log('key: ' + key);
        var results = searchResults[key];
        for (var i = 0; i < searchResults.results.length; i++) {
            var place = {
                marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1),
                marketID: searchResults.results[i].id
            };
            self.placesList.push(place);
            //createMapMarker(33.5250+i, -86.8130, place);

            console.log('Distance Market Name: ' + searchResults.results[i].marketname);
            console.log('Market Name: ' + searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1));
            console.log('Market ID: ' + searchResults.results[i].id);
           //detailResultHandler(getFarmersMarketDetails(searchResults.results[i].id));

            }
            console.log('placesList: ' + self.placesList);
        }
    }

function getFarmersMarketDetails(place) {
    console.log('getting market details: ' + place.marketID);
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service mktDetail.
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + place.marketID,
        context: place,
        dataType: 'jsonp',
        cache: false,
       success: function(detailResults) {
        console.log('this.marketName: ' + this.marketName);
        if (detailResults) {
        var marketDetails = detailResults.marketdetails;
        var googleLink = marketDetails.GoogleLink;
        console.log('Google Link: ' + googleLink);
        var latStringStart = googleLink.indexOf('?q=') + 3;
        var latStringEnd = googleLink.indexOf('%2C%20')
                var lngStringStart = latStringEnd + 6;
                var lngStringEnd = googleLink.lastIndexOf('%20');
        console.log('Latitude: ' + googleLink.substring(latStringStart, latStringEnd));   
        console.log('Longitude: ' + googleLink.substring(lngStringStart, lngStringEnd));
        console.log('Address: ' + marketDetails.Address);
        console.log('Schedule: ' + marketDetails.Schedule);
        console.log('Products ' + marketDetails.Products);
    }
    }
        //jsonpCallback: 'detailResultHandler'
    });
}



//iterate through the JSON result object.
function detailResultHandler(detailresults) {
        console.log('detailed results:' + detailresults);

    console.dir(detailresults);
    if (detailresults) {
        var results = detailresults.marketdetails;
        var googleLink = results.GoogleLink;
        console.log('Google Link: ' + googleLink);
        var latStringStart = googleLink.indexOf('?q=') + 3;
        var latStringEnd = googleLink.indexOf('%2C%20')
        console.log('Latitude: ' + googleLink.substring(latStringStart, latStringEnd));
                var lngStringStart = latStringEnd + 6;
                var lngStringEnd = googleLink.lastIndexOf('%20');
        console.log('Longitude: ' + googleLink.substring(lngStringStart, lngStringEnd));
        console.log('Address: ' + results.Address);
        console.log('Schedule: ' + results.Schedule);
        console.log('Products ' + results.Products);
    }
}


function createMapMarker (lat, lng, customData) {
            var googleLatLng = new google.maps.LatLng(lat, lng);
        var marker = new google.maps.Marker({
            map: map,
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: googleLatLng
        });
        marker.customData = customData;
        console.log('created map marker at: ' + lat + ', ' + lng);
        google.maps.event.addListener(marker, 'click', function() {
    map.setZoom(8);
    map.setCenter(marker.getPosition());
            console.log('marker clicked: ', marker.customData);

  });
}

      function initialize() {
        var mapOptions = {
          center: { lat: 33.5250, lng: -86.8130},
          zoom: 8
        };
        map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
        var myLatLng = new google.maps.LatLng(33.5250, -86.8130);
        var marker = new google.maps.Marker({
            map: map,
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: myLatLng
        });
        marker.customData = {marketName: "Test Market", marketID: "12345"};
        google.maps.event.addListener(marker, 'click', function() {
    map.setZoom(8);
    map.setCenter(marker.getPosition());
            console.log('marker Name: ', marker.customData.marketName);
            console.log('marker ID: ', marker.customData.marketID);

  });
getFarmersMarketsByZip(35223);
getFarmersMarketsByLatLng(37.81778516606761, -122.34374999999999);
console.log('placesList length: ' + self.placesList().length);
             for (var i = 0; i < self.placesList.length; i++) {
                console.log('getting detailed results for: ' + i);

                           detailResultHandler(getFarmersMarketDetails(self.placesList[i]));
                       }

      };
      google.maps.event.addDomListener(window, 'load', initialize);
     // getFarmersMarketsByZip(35223);

      //initialize();
}; //end ViewModel
var showFlickrPhotos = function() {
  $.getJSON( "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=376b144109ffe90065a254606c9aae3d&&tags=farmers market&tag_mode='all'&sort=interestingness-desc&safe_search=1&extras=date_taken&lat=37.786250&lon=-122.404883&radius=.2&format=json&nojsoncallback=1",
    /*flickrAPI, {
    //method: "flickr.photos.search",
    //api_key: "b96723b2a5af6cf4427f3af91b908836",
    tags: "pepper, place, market, alabama",
    tagmode: "all",
    format: "json",
    media: "photos",
    sort: "interestingness-desc",
    */
    //extras: "geo",
    //place_url: "/United+States/California/Berkeley"
   // bbox: "37.81778516606761, -122.34374999999999, 37.92619056937629, -122.17208862304686"
    //lat: "33.5405",
    //lon: "-86.836",
    //bbox: "-74.0336278869122,40.7060308677937,-73.9551416443378,40.7655020263878",
    //bbox: "33.26, -86.40, 33.36, -86.57",
    //radius: "2"
    //accuracy: "16"
  //},
//ajaxCallBack


function(data) {
    var currentPhoto;
    var currentPhotoURL;
    console.log('number of photos: ' + data.photos.photo.length);
    for (var i=0; i<20; i++) {
        if (data.photos.photo[i]){
    currentPhoto = data.photos.photo[i];
    console.dir(currentPhoto);
    currentPhotoURL = "https://farm" + currentPhoto.farm + ".staticflickr.com/" + currentPhoto.server + "/" + currentPhoto.id + "_" + currentPhoto.secret + ".jpg";
    $( "<img>" ).attr( "src", currentPhotoURL ).appendTo( "#images" );
    console.log(currentPhotoURL);
}
}
  }
  );
}


//showFlickrPhotos();
/*

 function getFarmersMarketsByZip(zip) {
    // or
    // function getResults(lat, lng) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service zipSearch or locSearch.
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
        // or
        // url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
        dataType: 'jsonp',
        jsonpCallback: 'searchResultsHandler'
    });
}

function getFarmersMarketsByLatLng(lat, lng) {
    // or
    // function getResults(lat, lng) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
       url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
        dataType: 'jsonp',
        //success: 'searchResultsHandler'

        jsonpCallback: 'searchResultsHandler'
    });
}

//iterate through the JSON result object.
function searchResultsHandler(searchResults) {
    console.log('in searchResultsHandler');
    console.dir(searchResults);
    for (var key in searchResults) {
        console.log('key: ' + key);
        var results = searchResults[key];
        for (var i = 0; i < searchResults.results.length; i++) {
            var place = {
                marketName: searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1),
                marketID: searchResults.results[i].id
            };
            self.placesList.push(place);
            //createMapMarker(33.5250+i, -86.8130, place);

            console.log('Distance Market Name: ' + searchResults.results[i].marketname);
            console.log('Market Name: ' + searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1));
            console.log('Market ID: ' + searchResults.results[i].id);
           //detailResultHandler(getFarmersMarketDetails(searchResults.results[i].id));

            }
            console.log('placesList: ' + self.placesList);
        }
    }
searchResultsHandler(getFarmersMarketsByZip(35223));

*/
ko.applyBindings(new ViewModel());

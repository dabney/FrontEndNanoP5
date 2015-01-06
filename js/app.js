var ViewModel = function() {
    var self = this;

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
        jsonpCallback: 'searchResultsHandler'
    });
}

//iterate through the JSON result object.
function searchResultsHandler(searchResults) {
    console.dir(searchResults);
    for (var key in searchResults) {
        console.log('key: ' + key);
        var results = searchResults[key];
        for (var i = 0; i < searchResults.results.length; i++) {
            console.log('Distance Market Name: ' + searchResults.results[i].marketname);
            console.log('Market Name: ' + searchResults.results[i].marketname.substring(searchResults.results[i].marketname.indexOf(' ')+1));
            console.log('Market ID: ' + searchResults.results[i].id);
           detailResultHandler(getFarmersMarketDetails(searchResults.results[i].id));
            }
        }
    }

function getFarmersMarketDetails(id) {
    console.log('getting market details: ' + id);
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service mktDetail.
        url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + id,
        dataType: 'jsonp',
        cache: false,
       success: detailResultHandler
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
        var latlngPosition = googleLink.indexOf('?q=') + 3;
        console.log('Latitude: ' + googleLink.substring(latlngPosition, latlngPosition+7));
        console.log('Longitude: ' + googleLink.substring(latlngPosition+13, latlngPosition+21));
        console.log('Address: ' + results.Address);
        console.log('Schedule: ' + results.Schedule);
        console.log('Products ' + results.Products);
    }
}

      function initialize() {
        var mapOptions = {
          center: { lat: 33.5250, lng: -86.8130},
          zoom: 8
        };
        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
        var myLatLng = new google.maps.LatLng(33.5250, -86.8130);
        var marker = new google.maps.Marker({
            map: map,
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: myLatLng
        });
        marker.customData = "test";
        google.maps.event.addListener(marker, 'click', function() {
    map.setZoom(8);
    map.setCenter(marker.getPosition());
            console.log('marker clicked: ', marker.customData);

  });
       // searchResultsHandler(getFarmersMarketsByZip(35223));
   //     searchResultsHandler(getFarmersMarketsByLatLng(33.5250, -86.8130));
      };
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


    self.placesList = ko.observableArray([
        {
            id: 1,
            name: 'Tabby'
        },
        {
            id: 2,
            name: 'Tiger'
        },
        {
            id: 3,
            name: 'Scaredy'
        },
        {
            id: 4,
            name: 'Shadow'
        },
        {
            id: 5,
            name: 'Sleepy'
        }
        ]);

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
    console.log('in setPlace: ' + clickedPlace.name);
}
      google.maps.event.addDomListener(window, 'load', initialize);
};
ko.applyBindings(new ViewModel());

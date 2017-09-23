let map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 18.894363, lng: -96.935292 },
    zoom: 16
  });
  /*let point = {lat: 18.894363, lng: -96.935292};
  let marker = new google.maps.Marker({
    position: point,
    map: map,
    title:'Hola Marcador!'
  });
  let infoWindow = new google.maps.InfoWindow({
    content:"Dummy content! Hey!"
  });

  marker.addListener('click', function() {
    infoWindow.open(map, marker);
  });*/

  let locations = [
    {title:'Punto 1', location: {lat: 18.894363, lng: -96.935292}},
    {title:'Punto 2', location: {lat: 18.894553, lng: -96.932282}},
    {title:'Punto 3', location: {lat: 18.895183, lng: -96.930291}},
    {title:'Punto 4', location: {lat: 18.893093, lng: -96.933222}},
    {title:'Punto 5', location: {lat: 18.895613, lng: -96.931232}},
    {title:'Punto 6', location: {lat: 18.894723, lng: -96.934262}}
  ];

  let markers = [];

  let polygon = null;

  let largeInfoWindow = new google.maps.InfoWindow();

  let drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes: [ google.maps.drawing.OverlayType.POLYGON ]
    }
  });

  for (let i = locations.length - 1; i >= 0; i--) {
    let marker = new google.maps.Marker({
      position: locations[i].location,
      title: locations[i].title,
      animation: google.maps.Animation.DROP,
      id: i
    });

    markers.push(marker);

    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfoWindow);
    });
  }

  document.getElementById('show-listings').addEventListener('click', showListings);
  document.getElementById('hide-listings').addEventListener('click', hideListings);

  document.getElementById('toggle-drawing').addEventListener('click', function() {
    toggleDrawing(drawingManager);
  });

  drawingManager.addListener('overlaycomplete', function(event) {
    if(polygon) {
      polygon.setMap(null);
      hideListings();
    }

    drawingManager.setDrawingMode(null);
    polygon = event.overlay;
    polygon.setEditable(true);

    if(document.getElementById('calcArea').checked) {
      calculateArea();

      polygon.getPath().addListener('set_at', calculateArea);
      polygon.getPath().addListener('insert_at', calculateArea);
    } else {
      searchWithinPolygon();

      polygon.getPath().addListener('set_at', searchWithinPolygon);
      polygon.getPath().addListener('insert_at', searchWithinPolygon);
    }
  });


  function showListings() {
    let bounds = new google.maps.LatLngBounds();
    for (let i = markers.length - 1; i >= 0; i--) {
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
  }

  function hideListings() {
    for (let i = markers.length - 1; i >= 0; i--) {
      markers[i].setMap(null);
    }
  }

  function toggleDrawing(drawingmanager) {
    if(drawingmanager.map) {
      drawingmanager.setMap(null);

      if(polygon) {
        polygon.setMap(null);
      }
    } else {
      drawingmanager.setMap(map);
    }
  }

  function searchWithinPolygon() {
    for (var i = markers.length - 1; i >= 0; i--) {
      if(google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
        markers[i].setMap(map);
      } else {
        markers[i].setMap(null);
      }
    }
  }

  function calculateArea() {
    let area = google.maps.geometry.spherical.computeArea(polygon.getPath());
    window.alert(`${ area } m2`);
  }
}

function populateInfoWindow(marker, infoWindow) {
  if(infoWindow.marker != marker) {
    infoWindow.marker = marker;
    infoWindow.addListener('closeclick', function() {
      infoWindow.marker = null;
    });
    let streetViewService = new google.maps.StreetViewService();
    let radius = 50;

    function getStreetView(data, status) {
      if(status == google.maps.StreetViewStatus.OK) {
        let nearStreetViewLocation = data.location.latLng;
        let heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
        infoWindow.setContent(`<div>${ marker.title }</div><div id="pano"></div>`);
        let panoramaOptions = {
          position: nearStreetViewLocation,
          pov: { heading: heading, pitch: 30}
        };
        let panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
      } else {
        infoWindow.setContent(`<div>${ marker.title }</div><div>No Street View Found</div>`);
      }
    }

    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    infoWindow.open(map, marker);
  }
}

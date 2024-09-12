function initMap() {
    // Initialize the map centered at UCF
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 28.601927982431244, lng: -81.20067608488577 }, // UCF Coordinates
        zoom: 17
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the search results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];

    // Event fired when the user selects a place from the search box.
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];

        // Get the details for each selected place.
        places.forEach(function (place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }

            var bounds = new google.maps.LatLngBounds();

            // Create a marker for each place.
            var marker = new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location
            });

            markers.push(marker);

            // If the place has a geometry, then present it on the map.
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
            map.fitBounds(bounds);
        });
    });

    // Add custom markers for buildings
    addBuildingMarker(map, { lat: 28.601978432864776, lng: -81.2003125998634 }, "UCF Student Union", "images/studentUnionMap.png", "images/MapIcon.png"); 
}

// Function to add a clickable marker for buildings with floor plans and a custom icon
function addBuildingMarker(map, position, buildingName, floorPlanUrl, customIcon) {
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: buildingName,
        icon: {
            url: customIcon,        // Custom icon URL
            scaledSize: new google.maps.Size(18, 18),  // Scale the icon to 18x18 pixels
            origin: new google.maps.Point(0, 0),       // Origin of the image (top-left corner)
            anchor: new google.maps.Point(16, 32)      // Anchor point (bottom center of the icon)
        }
    });

    // Add click event to open the modal with the floor plan
    marker.addListener('click', function () {
        openModal(floorPlanUrl, buildingName);
    });
}


// Function to open the modal and display the floor plan
function openModal(imageUrl, captionText) {
    var modal = document.getElementById("imageModal");
    var modalImg = document.getElementById("modalImage");
    var caption = document.getElementById("caption");

    modal.style.display = "block";  // Show the modal
    modalImg.src = imageUrl;        // Set the image source
    caption.innerHTML = captionText; // Set the caption text
}

// Ensure DOM is loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    var modal = document.getElementById("imageModal");
    var span = document.getElementsByClassName("close")[0];

    // Close the modal when the user clicks on the close button (x)
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Close the modal if the user clicks anywhere outside the image
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

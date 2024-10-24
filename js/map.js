// js/map.js

"use strict";

let map;

function initMap() {
    // Default location (e.g., University of Central Florida)
    const defaultLocation = { lat: 28.601927982431244, lng: -81.20067608488577 };

    // Initialize the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 17
    });

    // Add a marker at the default location
    const marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        title: 'University of Central Florida'
    });

    // Initialize the search box
    const input = document.getElementById('pac-input');
    const searchBox = new google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds());
    });

    let markers = [];

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();

        if (places.length === 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach(marker => marker.setMap(null));
        markers = [];

        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds();
        places.forEach(place => {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }

            // Create a marker for each place.
            const newMarker = new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location
            });
            markers.push(newMarker);

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });

    // Add custom markers for buildings
    addBuildingMarker(map, { lat: 28.601978432864776, lng: -81.2003125998634 }, "UCF Student Union", "images/studentUnionMap.png", "images/MapIcon.png"); 
}

// Function to add a clickable marker for buildings with floor plans and a custom icon
function addBuildingMarker(map, position, buildingName, floorPlanUrl, customIcon) {
    const marker = new google.maps.Marker({
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
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const caption = document.getElementById("caption");

    if (modal && modalImg && caption) { // Check if elements exist
        modal.style.display = "flex";  // Show the modal using flex
        caption.innerHTML = captionText; // Set the caption text

        // Show loading spinner (if implemented)
        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        modal.appendChild(spinner);

        // Load the image
        modalImg.src = imageUrl;
        modalImg.onload = () => {
            spinner.remove(); // Remove spinner once image is loaded
            modalImg.focus(); // Shift focus to the image for accessibility
        };
        modalImg.onerror = () => {
            spinner.remove(); // Remove spinner
            alert("Failed to load the floor plan image.");
        };

        // Prevent background scrolling
        document.body.style.overflow = "hidden";
    } else {
        console.warn("Modal elements not found in the DOM.");
    }
}

// Function to close the modal and re-enable background scrolling
function closeModal() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "none";
        // Re-enable background scrolling
        document.body.style.overflow = "auto";
    }
}

// Ensure DOM is loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("imageModal");
    const closeBtn = document.querySelector(".close"); // Corrected selector to class

    if (closeBtn && modal) { // Check if elements exist
        // Close the modal when the user clicks on the close button (x)
        closeBtn.onclick = function() {
            closeModal();
        };
    } else {
        console.warn('Close button or modal not found.');
    }

    // Close the modal if the user clicks anywhere outside the image
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };

    // Close the modal when the user presses the Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === "Escape" && modal.style.display === "flex") {
            closeModal();
        }
    });
});

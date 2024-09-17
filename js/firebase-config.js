// js/firebase-config.js

// Ensure that Firebase SDKs are loaded
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Make sure the Firebase scripts are included before this script.');
} else {
    // Check if Firebase has already been initialized to prevent duplicate initialization
    if (!firebase.apps.length) {
        const firebaseConfig = {
            apiKey: "AIzaSyBzjEJEYUaRs1hZlHaNkr2WwfXC7BDKs6M",
            authDomain: "knightways-bd8f6.firebaseapp.com",
            databaseURL: "https://knightways-bd8f6-default-rtdb.firebaseio.com",
            projectId: "knightways-bd8f6",
            storageBucket: "knightways-bd8f6.appspot.com",
            messagingSenderId: "919345718145",
            appId: "1:919345718145:web:b66eead5807784b054fe80",
            measurementId: "G-B7VSSRHF8W"
        };

        try {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase Initialized');

            // Expose Firebase services globally for access in other scripts
            window.firebaseAuth = firebase.auth();
            window.firebaseDB = firebase.firestore();
            window.firebaseStorage = firebase.storage();
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    } else {
        console.log('Firebase already initialized');
        // Reassign services globally if Firebase has already been initialized
        if (!window.firebaseAuth) {
            window.firebaseAuth = firebase.auth();
        }
        if (!window.firebaseDB) {
            window.firebaseDB = firebase.firestore();
        }
        if (!window.firebaseStorage) {
            window.firebaseStorage = firebase.storage();
        }
    }
}

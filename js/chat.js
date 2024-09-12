// Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Authentication references
const auth = firebase.auth();
const db = firebase.database().ref("chat");

// Sign-up
document.getElementById('signup-btn').addEventListener('click', () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Account created successfully');
            toggleAuthSection(userCredential.user);
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Sign-in
document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Signed in successfully');
            toggleAuthSection(userCredential.user);
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => {
        toggleAuthSection(null);
    });
});

// Toggle visibility of sections based on user authentication state
function toggleAuthSection(user) {
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('chat-section').style.display = 'block';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('user-email').textContent = `Logged in as: ${user.email}`;
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('chat-section').style.display = 'none';
        document.getElementById('user-info').style.display = 'none';
    }
}

// Monitor authentication state changes
auth.onAuthStateChanged((user) => {
    toggleAuthSection(user);
});

// Forum threads management
document.getElementById('create-thread-btn').addEventListener('click', () => {
    const threadName = document.getElementById('thread-name').value;
    if (threadName) {
        db.child('threads').push({ name: threadName });
    }
});

// Load forum threads
db.child('threads').on('child_added', (snapshot) => {
    const thread = snapshot.val();
    const threadElement = document.createElement('li');
    threadElement.textContent = thread.name;
    document.getElementById('threads-list').appendChild(threadElement);

    threadElement.addEventListener('click', () => {
        loadChatForThread(snapshot.key);
    });
});

// Function to load chat for a specific thread
function loadChatForThread(threadId) {
    document.getElementById('chatForm').style.display = 'block';
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';

    const threadRef = db.child('threads').child(threadId).child('messages');
    
    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const message = document.getElementById('message').value;
        threadRef.push({ user: auth.currentUser.email, message: message, timestamp: Date.now() });
        document.getElementById('message').value = '';
    });

    threadRef.on('child_added', (snapshot) => {
        const msg = snapshot.val();
        const messageElement = document.createElement('p');
        messageElement.textContent = `${msg.user}: ${msg.message}`;
        chatBox.appendChild(messageElement);
    });
}
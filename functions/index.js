/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Firestore Trigger: Update previous messages when user data is updated
exports.updatePreviousMessages = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const userId = context.params.userId;

        // Get the updated user data
        const newUserData = change.after.data();
        const newUsername = newUserData.username || 'Anonymous';
        const newProfileImage = newUserData.profileImage || 'images/default-avatar.png';

        try {
            // Get all channels
            const channelsSnapshot = await db.collection('channels').get();

            // Batch update for efficiency
            const batch = db.batch();

            // Iterate through each channel
            for (const channelDoc of channelsSnapshot.docs) {
                const messagesRef = db.collection('channels').doc(channelDoc.id).collection('messages');
                const userMessagesSnapshot = await messagesRef.where('userId', '==', userId).get();

                userMessagesSnapshot.forEach((messageDoc) => {
                    // Update each message where the userId matches the updated user
                    batch.update(messageDoc.ref, {
                        username: newUsername,
                        profileImage: newProfileImage
                    });
                });
            }

            // Commit the batch update
            await batch.commit();
            console.log(`Updated all previous messages for user: ${userId}`);
        } catch (error) {
            console.error("Error updating previous messages: ", error);
        }
    });

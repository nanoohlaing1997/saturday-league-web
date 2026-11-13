/* Live score sharing.
 *
 * These values identify the Firebase project. They are not secrets — every
 * Firebase web app ships them to the browser. Access is controlled by the
 * database rules in database.rules.json, not by hiding them.
 *
 * Clear the league code in Setup and the app simply runs on one phone.
 */
window.LEAGUE_FIREBASE = {
  apiKey: "AIzaSyDTJy19TUtu8aCFpdRmMNAWDQvkFbTAvro",
  authDomain: "saturday-league-20e39.firebaseapp.com",
  databaseURL: "https://saturday-league-20e39-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "saturday-league-20e39",
  storageBucket: "saturday-league-20e39.firebasestorage.app",
  messagingSenderId: "992973256497",
  appId: "1:992973256497:web:7264edf75460ac8597e210",

  /* Firebase console -> Project settings -> Cloud Messaging -> Web Push
   * certificates -> Generate key pair. Public, like the rest of this file. */
  vapidKey: "YOUR_VAPID_PUBLIC_KEY"
};

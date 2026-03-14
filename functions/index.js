const { beforeUserCreated, beforeUserSignedIn } = require("firebase-functions/v2/identity");
const { HttpsError } = require("firebase-functions/v2/https");

/**
 * Blocking function that runs before a user is created in Firebase Auth.
 * Rejects any user whose email does not end with @neu.edu.ph.
 */
exports.beforeCreate = beforeUserCreated((event) => {
  const user = event.data;
  const email = user.email;

  if (!email || !email.toLowerCase().endsWith("@neu.edu.ph")) {
    throw new HttpsError(
      "permission-denied",
      "Only NEU institutional emails (@neu.edu.ph) are allowed to sign up."
    );
  }
});

/**
 * Blocking function that runs before a user signs in to Firebase Auth.
 * Rejects any user whose email does not end with @neu.edu.ph.
 * This acts as a second layer of defense for existing accounts.
 */
exports.beforeSignIn = beforeUserSignedIn((event) => {
  const user = event.data;
  const email = user.email;

  if (!email || !email.toLowerCase().endsWith("@neu.edu.ph")) {
    throw new HttpsError(
      "permission-denied",
      "Only NEU institutional emails (@neu.edu.ph) are allowed to sign in."
    );
  }
});

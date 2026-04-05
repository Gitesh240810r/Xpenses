const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const whenLoggedIn  = document.querySelectorAll(".whenLoggedIn");
const whenLoggedOut = document.querySelectorAll(".whenLoggedOut");
const userDetails   = document.getElementById("userDetails");

const signInBtn  = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");

const provider = new firebase.auth.GoogleAuthProvider();
signInBtn.onclick  = () => auth.signInWithPopup(provider);
signOutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
    if (user) {
        whenLoggedIn.forEach(el  => el.classList.remove("hidden"));
        whenLoggedOut.forEach(el => el.classList.add("hidden"));
        userDetails.textContent = `Logged in as ${user.displayName}`;
        renderExpenses();
    } else {
        whenLoggedIn.forEach(el  => el.classList.add("hidden"));
        whenLoggedOut.forEach(el => el.classList.remove("hidden"));
        if (unsubscribe) unsubscribe();
    }
});
import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";

//Web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjXNuA4TJxoyvD9PvJB55mUv9nHJMI7V8",
    authDomain: "personal-website-de16c.firebaseapp.com",
    projectId: "personal-website-de16c",
    storageBucket: "personal-website-de16c.firebasestorage.app",
    messagingSenderId: "556687835593",
    appId: "1:556687835593:web:f53a9e86bbf4398baa6818",
    measurementId: "G-BW7ZWM6779"
};

//Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export {auth};
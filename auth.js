import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {auth} from "./firebase.js";

    //register function
    export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User signed up:", userCredential.user);
        return userCredential.user;
    }   catch(error) {
        console.error("Error during sign-up:", error.message);
        throw error; //Passes back to caller
    }
    };

    //login function
    export const signInUser = async (email, password) =>{
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
        return userCredential.user;
    }   catch(error) {
        console.error("Error during log-in:", error.message);
        throw error;  //Passes back to caller
    }
};
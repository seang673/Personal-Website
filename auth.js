import {createUserWithEmailAndPassword, sendPasswordResetEmail} from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import {auth} from "./firebase.js";

    export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User signed up:", userCredential.email);
        return userCredential.email;
    }   catch(error) {
        console.error("Error during sign-up:", error.message);
        throw error; //Passes back to caller
    }
    };

    export const signInUser = async (email, password) =>{
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.email);
        return userCredential.email;
    }   catch(error) {
        console.error("Error during logged-in:", error.message);
        throw error;  //Passes back to caller
    }
};
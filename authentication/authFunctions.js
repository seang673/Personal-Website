import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "../firebase.js"

     //register function
        export const registerUser = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User signed up:", userCredential.user);
            return userCredential.user;
        }   catch(error) {
            console.error("Error during sign-up:", error.message);
            throw error;
        }
        };

        //login function
        export const loginUser = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User logged in:", userCredential.user);
            return userCredential.user;
        }   catch(error) {
            console.error("Error during log-in:", error.message);
            throw error;
        }
    };
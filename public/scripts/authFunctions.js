export const registerUser = async (email, password) => {
    try {
        const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
        console.log("User signed up:", userCredential.user);
        return userCredential.user;
    } catch (error) {
        console.error("Error during sign-up:", error.message);
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
        console.log("User logged in:", userCredential.user);
        return userCredential.user;
    } catch (error) {
        console.error("Error during log-in:", error.message);
        throw error;
    }
};


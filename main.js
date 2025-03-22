import {registerUser, signInUser} from "./auth.js";

const signupForm = document.getByElementId("signupForm");
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await registerUser(email, password);
        alert("Sign-up is successful!!");
    } catch (error) {
        alert("Sign-up unsuccessful:", error.message);
    }
});

const loginForm = document.getByElementId("loginForm");
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await signInUser(email, password);
        alert("Login is successful!!");
    } catch (error) {
        alert("Login unsuccessful:", error.message);
    }
});


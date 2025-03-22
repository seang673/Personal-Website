import {registerUser, signInUser} from "./auth.js";

//Handle signup
const signupForm = document.getElementById("signupForm");
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault(); //Prevents page reload
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    if (!email || !password) {
        alert("Please fill out both fields.");
        return;
    }

    try {
        const user = await registerUser(email, password);
        alert("Sign-up is successful!!");
    } catch (error) {
        alert("Sign-up unsuccessful: " + error.message);
    }
});

//Handle login
const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();  //Prevents page reload
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if(!email || !password) {
        alert("Please fill out both fields.");
        return;
    }

    try {
        const user = await signInUser(email, password);
        alert("Login is successful!!");
    } catch (error) {
        alert("Login unsuccessful: " + error.message);
    }
});


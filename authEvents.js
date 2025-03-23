import {registerUser, loginUser} from "./authFunctions.js";

//Handle registration form
document.getElementById("signupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    registerUser(email, password);
});

//Handle login form
document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    loginUser(email, password);
});
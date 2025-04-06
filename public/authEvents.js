import {registerUser, loginUser} from "./authFunctions.js";

//DOM Elements
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

//Handle registration form
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
        const user = await registerUser(email, password);
        alert(`Signup successful! Welcome, ${user.email}`);
      } catch (error) {
        alert("Error: " + error.message);
      }
});

//Handle login form
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    try {
      const user = await loginUser(email, password);
      alert(`Login successful! Welcome back, ${user.email}`);
    } catch (error) {
      alert("Error: " + error.message);
    }
  });

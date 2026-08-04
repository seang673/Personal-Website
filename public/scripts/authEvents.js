import {registerUser, loginUser} from "./authFunctions.js";

document.addEventListener("DOMContentLoaded", () => {
    //DOM Elements
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");
    const authSection = document.getElementById("authSection");
    const logoutButton = document.getElementById("logoutButton");
    const centerContainer = document.querySelector(".center-container");
    const feedbackSection = document.getElementById("feedbackSection");

    if (!authSection || !logoutButton || !feedbackSection){
      console.error("Error: Could not find the authentication section or logoutButton or feedback section in the DOM");
      return;
    }

    feedbackSection.style.display = "none";

    const originalContainerJustify = centerContainer.style.justifyContent;

    //Handle registration form
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        try {
            const user = await registerUser(email, password);
            alert(`Signup successful! Welcome, ${user.email}`);
          } catch (error) {
            console.error("Login error:", error.message);
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

          // authSection/feedbackSection/logoutButton visibility is driven by
          // feedbackFunctions.js's onAuthStateChanged listener, not here — that
          // keeps a single source of truth for "are we actually signed in".
          centerContainer.style.justifyContent = "center"; //Keeps logout button and feedback section centered
        } catch (error) {
          console.error("Login error:", error.message);
          alert("Error: " + error.message);
        }
      });

      //Handle clicking the logout button
      logoutButton.addEventListener("click", async () => {
        try{
            await window.auth.signOut();
            alert("Logged out successfully");

            // authSection/feedbackSection/logoutButton visibility is driven by
            // feedbackFunctions.js's onAuthStateChanged listener, not here.
            centerContainer.style.justifyContent = originalContainerJustify;
        } catch(error){
          console.error("Logout error:", error.message);
            alert("Error: " + error.message);
        }
      });
});

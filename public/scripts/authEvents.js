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

    const originalAuthDisplay = authSection.style.display;
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

          //Hide authentication and show logout button
          authSection.style.display = "none";
          logoutButton.style.display = "block";
          feedbackSection.style.display= "block";
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

            //displays register and login forms again
            authSection.style.display = originalAuthDisplay;
            logoutButton.style.display="none";
            feedbackSection.style.display = "none";
            centerContainer.style.justifyContent = originalContainerJustify;
        } catch(error){
          console.error("Logout error:", error.message);
            alert("Error: " + error.message);
        }
      });
});

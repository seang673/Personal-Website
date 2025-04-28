import { getFirestore, where, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
const auth = getAuth(window.app);
const db = getFirestore(window.app);
const feedbackCollection = collection(db, "feedbacks");

//  Ensure User is Authenticated Before Showing Feedback Section
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("feedbackSection").style.display = "block"; // Show feedback section

        //  Handle Feedback Submission
        document.getElementById("submitFeedback").addEventListener("click", async () => {
            const feedbackInput = document.getElementById("feedbackInput").value;

            if (!feedbackInput.trim()) {
                alert("Please enter feedback.");
                return;
            }

            try {
                await addDoc(feedbackCollection, {
                    feedback: feedbackInput,
                    timestamp: serverTimestamp(),
                    userId: user.uid // Store user's UID
                });

                document.getElementById("feedbackInput").value = "";  // Clear input after submission
            } catch (error) {
                console.error("Error submitting feedback:", error);
                alert("Error submitting feedback.");
            }
        });

        // Fetch & Display Feedback in Real Time
        const feedbackContainer = document.getElementById("feedbackContainer");
        const feedbackQuery = query(
            feedbackCollection,
            where("userId", "==", user.uid), // Only fetch feedback for the logged-in user
            orderBy("timestamp", "desc")
        );

        getDocs(feedbackQuery).then((snapshot) => {
            console.log("Firestore snapshot (manual check):", snapshot.docs.map(doc => doc.data()));
        }).catch(error => console.error("Error fetching documents:", error));

        onSnapshot(feedbackQuery, (snapshot) => {
            feedbackContainer.innerHTML = ""; // Clear old feedback

            snapshot.forEach((doc) => {
                console.log("Fetched feedback:", snapshot.docs.map(doc => doc.data()));  //Debugging
                const data = doc.data();
                const feedbackItem = document.createElement("li");
                const time = data.timestamp?.seconds 
                ? new Date(data.timestamp.seconds * 1000).toLocaleString()
                : "Pending timestamp";
                feedbackItem.innerHTML = `<pre>                                       <button class="deleteFeedback" style="background-color: red;
                                          color:white; font-size: 12px; border: none; padding: 8px 12 px; cursor:pointer; transform: translateY(-15px);
                                           border-radius:5px;">✖</button></pre>
                                          <strong>${data.feedback}</strong><br>
                                         <pre style="font-family: 'Courier New', monospace;" >            ${time}</pre>`;
                feedbackItem.querySelector(".deleteFeedback").addEventListener("click", () => {
                    deleteDoc(doc.ref);
                });
                feedbackContainer.appendChild(feedbackItem);
            });
        });
    //if user is not logged in
    } else {
        document.getElementById("feedbackSection").style.display = "none"; // Hide feedback section if no user is logged in
    }
});

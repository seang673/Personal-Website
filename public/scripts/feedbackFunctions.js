import { getFirestore, where, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const auth = getAuth(window.app);
const db = getFirestore(window.app);
const feedbackCollection = collection(db, "feedbacks");

const feedbackSection = document.getElementById("feedbackSection");
const feedbackContainer = document.getElementById("feedbackContainer");
const feedbackInput = document.getElementById("feedbackInput");
const submitButton = document.getElementById("submitFeedback");

if (!feedbackSection || !feedbackContainer || !feedbackInput || !submitButton) {
    console.error("feedbackFunctions: feedback DOM is missing; the feature is disabled.");
}

/**
 * Handle for the live Firestore query. This MUST be torn down on sign-out:
 * leaving it attached meant a snapshot arriving after logout would render a
 * signed-out user's comments back into the page, and signing in as a second
 * account left both listeners writing to the same list.
 */
let unsubscribeFeedback = null;

function clearFeedbackList() {
    if (feedbackContainer) feedbackContainer.replaceChildren();
}

function stopListening() {
    if (unsubscribeFeedback) {
        unsubscribeFeedback();
        unsubscribeFeedback = null;
    }
}

/** Build one row with DOM APIs — feedback text is user input and must never be
 *  interpolated into innerHTML. */
function buildFeedbackItem(docSnap) {
    const data = docSnap.data();

    const item = document.createElement("li");
    item.id = docSnap.id;
    item.className = "feedback-item";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "deleteFeedback";
    deleteButton.setAttribute("aria-label", "Delete this feedback");
    deleteButton.textContent = "✖";
    deleteButton.addEventListener("click", async () => {
        deleteButton.disabled = true;
        try {
            await deleteDoc(docSnap.ref);
        } catch (error) {
            console.error("Error deleting feedback:", error);
            deleteButton.disabled = false;
        }
    });

    const body = document.createElement("strong");
    body.className = "feedback-text";
    body.textContent = data.feedback;

    const time = document.createElement("time");
    time.className = "feedback-time";
    time.textContent = data.timestamp?.seconds
        ? new Date(data.timestamp.seconds * 1000).toLocaleString()
        : "Pending timestamp";

    item.append(deleteButton, body, time);
    return item;
}

/** Renders only if the signed-in user still matches the account this snapshot
 *  was requested for — a late or stale delivery is dropped, not displayed. */
function renderFeedback(snapshot, uid) {
    const current = auth.currentUser;
    if (!current || current.uid !== uid) {
        clearFeedbackList();
        return;
    }
    feedbackContainer.replaceChildren(...snapshot.docs.map(buildFeedbackItem));
}

// Bound once, not per auth change. Re-binding inside onAuthStateChanged stacked
// a duplicate submit handler onto the button on every sign-in.
if (submitButton) {
    submitButton.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("Please log in before submitting feedback.");
            return;
        }

        const text = feedbackInput.value;
        if (!text.trim()) {
            alert("Please enter feedback.");
            return;
        }

        submitButton.disabled = true;
        try {
            await addDoc(feedbackCollection, {
                feedback: text,
                timestamp: serverTimestamp(),
                userId: user.uid
            });
            feedbackInput.value = "";
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert("Error submitting feedback.");
        } finally {
            submitButton.disabled = false;
        }
    });
}

onAuthStateChanged(auth, (user) => {
    // Always drop the previous session's listener and rendered rows first, so
    // no state can survive across a sign-out or an account switch.
    stopListening();
    clearFeedbackList();

    if (!user) {
        if (feedbackSection) feedbackSection.style.display = "none";
        return;
    }

    if (feedbackSection) feedbackSection.style.display = "block";

    const feedbackQuery = query(
        feedbackCollection,
        where("userId", "==", user.uid), // only this user's docs
        orderBy("timestamp", "desc")
    );

    unsubscribeFeedback = onSnapshot(
        feedbackQuery,
        (snapshot) => renderFeedback(snapshot, user.uid),
        (error) => {
            console.error("Feedback listener error:", error);
            clearFeedbackList();
        }
    );
});

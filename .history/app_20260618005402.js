// app.js
import { db, doc, onSnapshot, runTransaction } from "./firebase-config.js";

const businesses = {
    clinic: [
        { id: "clinic_aiu", name: "Clinic AIU" },
        { id: "clinic_medicare", name: "MediCare Health Clinic" },
        { id: "clinic_wellness", name: "Wellness Family Clinic" }
    ],
    bank: [
        { id: "bank_maybank", name: "Maybank" },
        { id: "bank_cimb", name: "CIMB Bank" },
        { id: "bank_public", name: "Public Bank" }
    ],
    restaurant: [
        { id: "restaurant_mamak", name: "Mamak Restaurant" },
        { id: "restaurant_bistro", name: "Spice Bistro" },
        { id: "restaurant_cafe", name: "Central Cafe" }
    ],
    salon: [
        { id: "salon_beauty", name: "Beauty Salon" },
        { id: "salon_cuts", name: "Pro Cuts Barber" },
        { id: "salon_spa", name: "Serenity Spa Lounge" }
    ]
};

const categorySelect = document.getElementById("categorySelect");
const businessSelect = document.getElementById("businessSelect");
const getTicketBtn = document.getElementById("getTicketBtn");
const ticketDisplay = document.getElementById("ticketDisplay");
const myNumberDoc = document.getElementById("myNumber");
const currentServingDoc = document.getElementById("currentServing");
const peopleAheadDoc = document.getElementById("peopleAhead");
const waitTimeDoc = document.getElementById("waitTime");

let currentBusinessId = "";
let myQueueNumber = null;
let prefix = "";
let unsubscribeLive = null;

// Dynamic Dropdown Logic
categorySelect.addEventListener("change", (e) => {
    const cat = e.target.value;
    businessSelect.innerHTML = '<option value="">-- Choose Business --</option>';
    
    if (cat && businesses[cat]) {
        businesses[cat].forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.id;
            opt.textContent = b.name;
            businessSelect.appendChild(opt);
        });
        businessSelect.disabled = false;
    } else {
        businessSelect.disabled = true;
        getTicketBtn.disabled = true;
    }
});

businessSelect.addEventListener("change", (e) => {
    currentBusinessId = e.target.value;
    getTicketBtn.disabled = !currentBusinessId;
});

// Atomic Transaction to generate Ticket Number (Prevents Duplication Bugs)
getTicketBtn.addEventListener("click", async () => {
    if (!currentBusinessId) return;

    const docRef = doc(db, "queues", currentBusinessId);

    try {
        const generatedNumber = await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) {
                throw "Document does not exist!";
            }
            
            let nextNum = sfDoc.data().next;
            let currentPrefix = sfDoc.data().prefix || "X";
            
            // Advance the next ticket count safely in DB
            transaction.update(docRef, { next: nextNum + 1 });
            
            return { nextNum, currentPrefix };
        });

        myQueueNumber = generatedNumber.nextNum;
        prefix = generatedNumber.currentPrefix;
        
        myNumberDoc.textContent = `${prefix}${String(myQueueNumber).padStart(3, '0')}`;
        ticketDisplay.classList.remove("d-none");
        
        // Listen to Real-Time Updates for this specific selection
        startLiveUpdates(currentBusinessId);

    } catch (e) {
        console.error("Transaction failed: ", e);
    }
});

// Setup continuous live updater 
function startLiveUpdates(businessId) {
    if (unsubscribeLive) unsubscribeLive(); // Kill old listener if switching

    unsubscribeLive = onSnapshot(doc(db, "queues", businessId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const current = data.current;
            
            // Display Current Serving Number
            currentServingDoc.textContent = current === 0 ? "None" : `${data.prefix}${String(current).padStart(3, '0')}`;
            
            // Calculate Wait list metrics
            if (myQueueNumber) {
                const ahead = myQueueNumber - current - 1;
                peopleAheadDoc.textContent = ahead < 0 ? "Served/Passed" : ahead;
                waitTimeDoc.textContent = ahead < 0 ? "0 mins" : `${(ahead + 1) * 5} mins`;
            }
        }
    });
}
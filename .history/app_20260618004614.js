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

const navItems = document.querySelectorAll(".nav-item-custom");
const businessSelect = document.getElementById("businessSelect");
const getTicketBtn = document.getElementById("getTicketBtn");
const ticketDisplay = document.getElementById("ticketDisplay");
const displayBusinessName = document.getElementById("displayBusinessName");
const myNumberDoc = document.getElementById("myNumber");
const currentServingDoc = document.getElementById("currentServing");
const peopleAheadDoc = document.getElementById("peopleAhead");
const waitTimeDoc = document.getElementById("waitTime");

let selectedCategory = "clinic";
let currentBusinessId = "";
let myQueueNumber = null;
let prefix = "";
let unsubscribeLive = null;

// Handle Top Category Tabs
navItems.forEach(item => {
    item.addEventListener("click", () => {
        navItems.forEach(nav => nav.classList.remove("active"));
        item.classList.add("active");
        selectedCategory = item.getAttribute("data-category");
        renderBusinesses();
    });
});

function renderBusinesses() {
    businessSelect.innerHTML = "";
    const list = businesses[selectedCategory];
    list.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = b.name;
        businessSelect.appendChild(opt);
    });
    currentBusinessId = businessSelect.value;
}

businessSelect.addEventListener("change", (e) => {
    currentBusinessId = e.target.value;
});

// Initial load
renderBusinesses();

getTicketBtn.addEventListener("click", async () => {
    if (!currentBusinessId) return;
    const docRef = doc(db, "queues", currentBusinessId);
    const selectedName = businessSelect.options[businessSelect.selectedIndex].text;

    try {
        const generatedNumber = await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) throw "Doc missing!";
            
            let nextNum = sfDoc.data().next;
            let currentPrefix = sfDoc.data().prefix || "X";
            
            transaction.update(docRef, { next: nextNum + 1 });
            return { nextNum, currentPrefix };
        });

        myQueueNumber = generatedNumber.nextNum;
        prefix = generatedNumber.currentPrefix;
        
        displayBusinessName.textContent = selectedName;
        myNumberDoc.textContent = `${prefix}${String(myQueueNumber).padStart(3, '0')}`;
        ticketDisplay.classList.remove("d-none");
        
        startLiveUpdates(currentBusinessId);
    } catch (e) {
        console.error(e);
    }
});

function startLiveUpdates(businessId) {
    if (unsubscribeLive) unsubscribeLive();
    unsubscribeLive = onSnapshot(doc(db, "queues", businessId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const current = data.current;
            
            currentServingDoc.textContent = current === 0 ? "None" : `${data.prefix}${String(current).padStart(3, '0')}`;
            
            if (myQueueNumber) {
                const ahead = myQueueNumber - current - 1;
                peopleAheadDoc.textContent = ahead < 0 ? "0" : ahead;
                waitTimeDoc.textContent = ahead < 0 ? "0m" : `${(ahead + 1) * 5}m`;
            }
        }
    });
}
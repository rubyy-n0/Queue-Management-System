// admin.js
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

const adminCategory = document.getElementById("adminCategory");
const adminBusiness = document.getElementById("adminBusiness");
const callNextBtn = document.getElementById("callNextBtn");
const adminCurrent = document.getElementById("adminCurrent");
const adminNext = document.getElementById("adminNext");

let activeBusinessId = "";
let unsubscribeAdmin = null;

adminCategory.addEventListener("change", (e) => {
    const cat = e.target.value;
    adminBusiness.innerHTML = '<option value="">-- Choose Business --</option>';
    if (cat && businesses[cat]) {
        businesses[cat].forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.id;
            opt.textContent = b.name;
            adminBusiness.appendChild(opt);
        });
        adminBusiness.disabled = false;
    } else {
        adminBusiness.disabled = true;
        callNextBtn.disabled = true;
    }
});

adminBusiness.addEventListener("change", (e) => {
    activeBusinessId = e.target.value;
    if (activeBusinessId) {
        callNextBtn.disabled = false;
        listenToQueueData(activeBusinessId);
    } else {
        callNextBtn.disabled = true;
    }
});

function listenToQueueData(id) {
    if (unsubscribeAdmin) unsubscribeAdmin();

    unsubscribeAdmin = onSnapshot(doc(db, "queues", id), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const prefix = data.prefix;
            
            adminCurrent.textContent = data.current === 0 ? "None" : `${prefix}${String(data.current).padStart(3, '0')}`;
            adminNext.textContent = `${prefix}${String(data.next).padStart(3, '0')}`;
        }
    });
}

// Atomic increment processing to switch to the next customer safely
callNextBtn.addEventListener("click", async () => {
    if (!activeBusinessId) return;
    const docRef = doc(db, "queues", activeBusinessId);

    try {
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) return;

            const current = sfDoc.data().current;
            const next = sfDoc.data().next;

            // Stop calling if we have caught up to the generated tickets
            if (current + 1 >= next) {
                alert("No customers waiting in line!");
                return;
            }

            transaction.update(docRef, { current: current + 1 });
        });
    } catch (e) {
        console.error("Error advancing desk line: ", e);
    }
});
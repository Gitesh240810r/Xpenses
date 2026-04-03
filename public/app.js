const auth = firebase.auth();
const db = firebase.firestore();
const user = auth.currentUser;
let unsubscribe;

const whenLoggedIn = document.querySelectorAll(".whenLoggedIn");
const whenLoggedOut = document.querySelectorAll(".whenLoggedOut");
const userDetails = document.getElementById("userDetails");
const submitBtn = document.getElementById("submitBtn");

const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");

const provider = new firebase.auth.GoogleAuthProvider();
signInBtn.onclick = () => auth.signInWithPopup(provider);
signOutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(user =>{
    if(user){
        whenLoggedIn.forEach(el => el.classList.remove("hidden"));
        whenLoggedOut.forEach(el => el.classList.add("hidden"));
        userDetails.textContent = `Logged in as ${user.displayName} `;
        renderExpenses();
    }
    else{
        whenLoggedIn.forEach(el => el.classList.add("hidden"));
        whenLoggedOut.forEach(el => el.classList.remove("hidden"));
        if (unsubscribe) unsubscribe();
    }
});

const categories = ["Food", "Transport", "Entertainment", "Utilities", "Healthcare", "Shopping", "Other"];
const paymentModes = ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet"];

const categorySelect = document.getElementById("category");
const categoryFilter = document.getElementById("categoryFilter");
const paymentModeSelect = document.getElementById("paymentMode");

for (category of categories) categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
for (mode of paymentModes) paymentModeSelect.innerHTML += `<option value="${mode}">${mode}</option>`;
for (category of categories) categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;

function addExpense(){
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value;
    const MoP = document.getElementById("paymentMode").value;

    if(!amount || !category || !description || !date || !MoP) {window.alert("Please fill in all fields"); return;}

    const user = auth.currentUser;
    if (user){
            db.collection("expenses").add({
            uid: user.uid,
            amount: parseFloat(amount),
            category,
            description,
            date,
            paymentMode: MoP
        });
    }

    document.getElementById("amount").value = "";
    document.getElementById("category").value = "";
    document.getElementById("description").value = "";
    document.getElementById("date").value = "";
    document.getElementById("paymentMode").value = "";

}

function renderExpenses() {
    const user = auth.currentUser;
    if (!user) return;

    unsubscribe = db.collection("expenses")
        .where("uid", "==", user.uid)
        .onSnapshot(snapshot => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const expensesList = document.getElementById("expensesList");
        const today  = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        expensesList.innerHTML = "";

        //filter inputs - to add: filter by date range and amount
        const search = document.getElementById("search").value.toLowerCase();
        const category = document.getElementById("categoryFilter").value;

        const filtered = expenses.filter(expense => {
            return (search === "" ||expense.description.toLowerCase().includes(search)) &&
                   (category === "" || expense.category === category) &&
                   (new Date(expense.date) >= weekAgo);});

        document.getElementById("noExpenses").classList.toggle("hidden", filtered.length > 0);


        for (const expense of filtered) {
            const card = document.createElement("div");
            card.className = "flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 shadow-lg transition-all duration-200";
            card.innerHTML = `
                <div class="flex justify-between items-center w-full gap-4">
                    <div class="flex items-center gap-3">
                        <p class="font-semibold text-gray-900 ">${expense.description}</p>
                        <p class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">${expense.category}</p>
                        <p class="text-xs text-gray-400 mt-0.5">${expense.paymentMode} · ${expense.date}</p>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                        <span class="font-semibold text-blue-600 whitespace-nowrap">₹${expense.amount.toFixed(2)}</span>
                        <button onclick="db.collection('expenses').doc('${expense.id}').delete()"
                            class="px-4 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors duration-150 text-sm whitespace-nowrap">
                            Delete
                        </button>
                    </div>
                </div>
            `;
            expensesList.appendChild(card);
        }

        const totalAmount = filtered.reduce((sum, expense)=> sum + expense.amount, 0);
        document.getElementById("totalAmount").textContent = ` ₹${totalAmount}`;   
    });

}

function clearFilters(){
    document.getElementById("search").value = "";
    document.getElementById("categoryFilter").value = "";
    renderExpenses();
}
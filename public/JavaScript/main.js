function createExpenseCard(expense) {
    const badgeClass = categoryColors[expense.category] || categoryColors["Other"];
    const card = document.createElement("div");
    card.className = "expense-card flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white";
    card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
            <div class="min-w-0">
                <p class="font-medium text-sm text-slate-800 truncate">${expense.description}</p>
                <p class="text-xs text-slate-400 mt-0.5">${expense.paymentMode} · ${expense.date}</p>
            </div>
            <span class="text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badgeClass}">${expense.category}</span>
        </div>
        <div class="flex items-center gap-3 shrink-0 ml-3">
            <span class="font-semibold text-sm text-slate-800 whitespace-nowrap">₹${expense.amount}</span>
            <button onclick="db.collection('expenses').doc('${expense.id}').delete()"
                class="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors whitespace-nowrap">
                Delete
            </button>
        </div>
    `;
    return card;
}

const categories   = ["Food", "Transport", "Entertainment", "Utilities", "Healthcare", "Shopping", "Other"];
const paymentModes = ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet"];

const categorySelect    = document.getElementById("category");
const categoryFilter    = document.getElementById("categoryFilter");
const paymentModeSelect = document.getElementById("paymentMode");

if (categorySelect)    for (const cat  of categories)   categorySelect.innerHTML  += `<option value="${cat}">${cat}</option>`;
if (paymentModeSelect) for (const mode of paymentModes) paymentModeSelect.innerHTML += `<option value="${mode}">${mode}</option>`;
if (categoryFilter)    for (const cat  of categories)   categoryFilter.innerHTML  += `<option value="${cat}">${cat}</option>`;

// Category badge colours
const categoryColors = {
    Food:          "bg-orange-100 text-orange-700",
    Transport:     "bg-blue-100 text-blue-700",
    Entertainment: "bg-purple-100 text-purple-700",
    Utilities:     "bg-emerald-100 text-emerald-700",
    Healthcare:    "bg-red-100 text-red-700",
    Shopping:      "bg-yellow-100 text-yellow-700",
    Other:         "bg-slate-100 text-slate-600",
};

function clearFilters() {
    document.getElementById("search").value = "";
    document.getElementById("categoryFilter").value = "";
    renderExpenses();
}
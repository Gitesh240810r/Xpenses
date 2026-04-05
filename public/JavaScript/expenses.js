function addExpense() {
    const amount      = document.getElementById("amount").value;
    const category    = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const date        = document.getElementById("date").value;
    const MoP         = document.getElementById("paymentMode").value;

    if (!amount || !category || !description || !date || !MoP) {
        window.alert("Please fill in all fields");
        return;
    }

    const user = auth.currentUser;
    if (user) {
        db.collection("expenses").add({
            uid: user.uid,
            amount: parseFloat(amount),
            category,
            description,
            date,
            paymentMode: MoP,
        });
    }

    ["amount", "category", "description", "date", "paymentMode"]
        .forEach(id => document.getElementById(id).value = "");
}

function renderExpenses() {
    const user = auth.currentUser;
    if (!user) return;

    unsubscribe = db.collection("expenses")
        .where("uid", "==", user.uid)
        .onSnapshot(snapshot => {
            const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            expenses.sort((a,b) => new Date(b.date) - new Date(a.date));
            const expensesList = document.getElementById("expensesList");
            const dbContainer  = document.getElementById("dbContainer");

            if (expensesList) {
                const today   = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                expensesList.innerHTML = "";

                const search   = document.getElementById("search")?.value.toLowerCase() ?? "";
                const category = document.getElementById("categoryFilter")?.value ?? "";

                const filtered = expenses.filter(expense =>
                    (search === "" || expense.description.toLowerCase().includes(search)) &&
                    (category === "" || expense.category === category) &&
                    (new Date(expense.date) >= weekAgo)
                );

                document.getElementById("noExpenses").classList.toggle("hidden", filtered.length > 0);

                for (const expense of filtered) {
                    const card = createExpenseCard(expense);
                    expensesList.appendChild(card);
                }

                // Total
                const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);
                document.getElementById("totalAmount").textContent = `₹${totalAmount.toFixed(2)}`;

                // Chart
                const categoryTotals = filtered.reduce((totals, expense) => {
                    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
                    return totals;
                }, {});

                const ctx = document.getElementById("myChart").getContext("2d");
                if (window.expenseChart) window.expenseChart.destroy();

                window.expenseChart = new Chart(ctx, {
                    type: "pie",
                    data: {
                        labels: Object.keys(categoryTotals),
                        datasets: [{
                            label: "Expenses by Category",
                            data: Object.values(categoryTotals),
                            backgroundColor: [
                                "#fb923c", "#60a5fa", "#a78bfa",
                                "#34d399", "#f87171", "#fbbf24", "#94a3b8"
                            ],
                            borderWidth: 1,
                            borderColor: "#ffffff",
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: "right",
                                labels: {
                                    font: { family: "Poppins", size: 15 },
                                    color: "#000000",
                                    padding: 5,
                                    usePointStyle: false,
                                    pointStyleWidth: 2,
                                }
                            },
                            title: { display: false },
                        }
                    }
                });
            }

            // Database page
            if (dbContainer) {
                dbContainer.innerHTML = "";
                for (const expense of expenses) {
                    const card = createExpenseCard(expense);
                    dbContainer.appendChild(card);
                }
            }
        });
}
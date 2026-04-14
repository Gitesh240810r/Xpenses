let unsubscribeExpenses = null;
let unsubscribeReports = null;

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

    if (unsubscribeExpenses) unsubscribeExpenses();

    unsubscribeExpenses = db.collection("expenses")
        .where("uid", "==", user.uid)
        .onSnapshot(snapshot => {
            const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            expenses.sort((a,b) => new Date(b.date) - new Date(a.date));
            const expensesList = document.getElementById("expensesList");
            const dbContainer  = document.getElementById("dbContainer");

            if (expensesList) {
                const filtered = getFiltered(expenses, expensesList, {
                    weeklyOnly: true,
                });
                updateDashboard(filtered);
                
                for (const expense of filtered) {
                    const card = createExpenseCard(expense);
                    expensesList.appendChild(card);
                }
            }

            if (dbContainer) {
                const filtered = getFiltered(expenses, dbContainer, {
                    searchId: "dbSearch",
                    categoryId: "dbCategoryFilter",
                    weeklyOnly: false,
                });
            
                for (const expense of filtered) {
                    const card = createExpenseCard(expense);
                    dbContainer.appendChild(card);
                }
            }            
        });
}

function getFiltered(expenses, container, options={}){

    const {
        searchId = "search",
        categoryId = "categoryFilter",
        weeklyOnly = false,
    } = options;

    const today   = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    container.innerHTML = "";

    const search   = document.getElementById(searchId).value.toLowerCase();
    const category = document.getElementById(categoryId).value;

    return filtered = expenses.filter(expense =>
        (search === "" || expense.description.toLowerCase().includes(search)) &&
        (category === "" || expense.category === category) &&
        (weeklyOnly ? new Date(expense.date) >= weekAgo : true)
    );
}

function updateDashboard(filtered){
    document.getElementById("noExpenses").classList.toggle("hidden", filtered.length > 0);
    getSummary(filtered);
    // Total
    const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById("totalAmount").textContent = `₹${totalAmount}`;

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

function getSummary(filtered){
    const mostExpensiveDiv = document.getElementById("mostExpensive");
    const mostExpCatDiv = document.getElementById("mostExpCat");
    const freqCategoryDiv = document.getElementById("freqCategory");
    const freqMoP = document.getElementById("freqMoP");
    if (!filtered.length) {
        mostExpensiveDiv.textContent = "—";
        mostExpCatDiv.textContent = "—";
        freqCategoryDiv.textContent = "—";
        freqMoP.textContent = "—";
        return;
    }

    const mostExpensive = [...filtered].sort((a,b) => b.amount - a.amount)[0];

    mostExpensiveDiv.textContent = `(${mostExpensive.description}) - ₹${mostExpensive.amount}`;
    mostExpCatDiv.textContent = mostExpensive.category;

}

function updateReports() {
    const monthPicker = document.getElementById("monthPicker");
    const repTableBody = document.getElementById("repTableBody");
    const user = auth.currentUser;

    if (!monthPicker || !repTableBody || !user) return;

    if (!monthPicker.value) {
        const now = new Date();
        monthPicker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    const month = monthPicker.value;

    if (unsubscribeReports) unsubscribeReports();

    unsubscribeReports = db.collection("expenses").where("uid", "==", user.uid).onSnapshot(snapshot => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        const monthlyExpenses = expenses.filter(expense => expense.date.startsWith(month));

        repTableBody.innerHTML = "";

        for (const expense of monthlyExpenses) {
            const badgeClass = categoryColors[expense.category] || categoryColors["Other"];
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 pr-4 font-medium text-slate-800">${expense.description}</td>
                <td class="py-3 pr-4 text-slate-500">${expense.date}</td>
                <td class="py-3 pr-4">
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}">${expense.category}</span>
                </td>
                <td class="py-3 pr-4 text-slate-500">${expense.paymentMode}</td>
                <td class="py-3 text-right font-semibold text-slate-800">₹${expense.amount}</td>
            `;
            repTableBody.appendChild(tr);
        }
        reportsSummary(monthlyExpenses);
        reportsGraph(monthlyExpenses);
        reportsComparison(expenses, month);
    });
}

function reportsSummary(expenses){
    if (!expenses.length) {
        document.getElementById("repTotal").textContent = "₹0";
        document.getElementById("repCount").textContent = "0 expenses";
        document.getElementById("repHighestAmt").textContent = "—";
        document.getElementById("repHighestDesc").textContent = "—";
        document.getElementById("repDailyAvg").textContent = "—";
        document.getElementById("repTopCat").textContent = "—";
        document.getElementById("repTopCatAmt").textContent = "—";
        document.getElementById("momTotal").textContent = "—";
        document.getElementById("momCount").textContent = "—";
        document.getElementById("momHighest").textContent = "—";
        document.getElementById("momMop").textContent = "—";
        reportsGraph(expenses);
        return;
    }
    const repTotal = document.getElementById("repTotal");
    const repCount = document.getElementById("repCount");
    const repHighestAmt = document.getElementById("repHighestAmt");
    const repHighestDesc = document.getElementById("repHighestDesc");
    const repDailyAvg = document.getElementById("repDailyAvg");
    const repTopCat = document.getElementById("repTopCat");
    const repTopCatAmt = document.getElementById("repTopCatAmt");

    repTotal.textContent = `₹${expenses.reduce((sum, e) => sum + e.amount, 0) }`;
    repCount.textContent = `${expenses.length} expenses`;
    repHighestAmt.textContent = `₹${expenses.sort((a,b) => b.amount - a.amount)[0].amount}`;
    repHighestDesc.textContent = `${expenses.sort((a,b) => b.amount - a.amount)[0].description}`;
    repDailyAvg.textContent = `₹${expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length}`;
    repTopCat.textContent = `${expenses.sort((a,b) => b.amount - a.amount)[0].category}`;

    const monthlyCategoryTotals = expenses.reduce((totals, expense) => {
        totals[expense.category] = ( totals[expense.category] || 0) + expense.amount;
        return totals;
    }, {});

    const arr = Object.entries(monthlyCategoryTotals);

    repTopCatAmt.textContent = `₹${arr.sort((a, b) => b[1] - a[1])[0][1]}`;


}

function reportsGraph(expenses){
    const monthlyCategoryTotals = expenses.reduce((totals, expense) => {
        totals[expense.category] = ( totals[expense.category] || 0) + expense.amount;
        return totals;
    }, {});

    const arr = Object.entries(monthlyCategoryTotals);

    const categoryBars = document.getElementById("categoryBars");
    categoryBars.innerHTML = "";
    categoryBars.innerHTML = '<div style="height: 200px; position: relative;"><canvas id="categoryChart"></canvas></div>';

    const ctx = document.getElementById("categoryChart").getContext("2d");
    if (window.categoryChart && typeof window.categoryChart.destroy === "function") {
        window.categoryChart.destroy();
    }

    window.categoryChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: arr.map(item => item[0]),
            datasets: [{
                data: arr.map(item => item[1]),
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
                    position: "bottom",
                }
            }
        }
    });

    const month = document.getElementById("monthPicker").value;
    const [year, monthNumber] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();

    const dailyTotals = expenses.reduce((totals, expense) => {
        totals[expense.date] = (totals[expense.date] || 0) + expense.amount;
        return totals;
    }, {});

    const dailyLabels = [];
    const dailyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const fullDate = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dailyLabels.push(day);
        dailyData.push(dailyTotals[fullDate] || 0);
    }

    const dailyCtx = document.getElementById("dailyChart").getContext("2d");
    if (window.dailySpendChart && typeof window.dailySpendChart.destroy === "function") {
        window.dailySpendChart.destroy();
    }

    window.dailySpendChart = new Chart(dailyCtx, {
        type: "bar",
        data: {
            labels: dailyLabels,
            datasets: [{
                label: "Daily Spend",
                data: dailyData,
                backgroundColor: "#8b5cf6",
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    }
                },
                y: {
                    beginAtZero: true,
                }
            }
        }
    });
}

function reportsComparison(expenses, month) {
    
    const [year, monthNumber] = month.split("-").map(Number);
    const lastMonth = `${year}-${String(monthNumber - 1).padStart(2, "0")}`;

    const lastMonthExpenses = expenses.filter(expense => expense.date.startsWith(lastMonth));
    const momTotal = document.getElementById("momTotal");
    const momCount = document.getElementById("momCount");
    const momHighest = document.getElementById("momHighest");
    const momMop = document.getElementById("momMop");

    const CategoryTotals = expenses.reduce((totals, expense) => {
        totals[expense.category] = ( totals[expense.category] || 0) + expense.amount;
        return totals;
    }, {});

    momTotal.textContent = `₹${lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0)}`;
    momCount.textContent = `${lastMonthExpenses.length}`;
    momHighest.textContent = `${lastMonthExpenses.sort((a,b) => b.amount - a.amount)[0].description}`;
    momMop.textContent = `${Object.keys(CategoryTotals).sort((a,b) => CategoryTotals[b] - CategoryTotals[a])[0]}`;
}

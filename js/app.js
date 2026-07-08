// js/app.js

// 1. Inisialisasi Data dari Local Storage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Food', 'Transport', 'Fun'];
let budgetLimit = parseFloat(localStorage.getItem('budgetLimit')) || 0;
let expenseChart = null;

// Mengambil elemen-elemen DOM
const form = document.getElementById('transaction-form');
const itemNameInput = document.getElementById('item-name');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const addCategoryBtn = document.getElementById('add-category-btn');
const transactionList = document.getElementById('transaction-list');
const totalBalanceEl = document.getElementById('total-balance');
const sortSelect = document.getElementById('sort-transactions');
const budgetLimitInput = document.getElementById('budget-limit');
const saveLimitBtn = document.getElementById('save-limit-btn');

// Jalankan saat halaman pertama dimuat
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    budgetLimitInput.value = budgetLimit > 0 ? budgetLimit : '';
    updateUI();
});

// 2. Fungsi Utama Update UI
function updateUI() {
    renderTransactions();
    updateTotal();
    updateChart();
}

// 3. Simpan data ke Local Storage
function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// 4. Render Kategori (termasuk fitur opsional 1: Kustom Kategori)
function renderCategories() {
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Fitur Opsional 1: Menambah kategori kustom
addCategoryBtn.addEventListener('click', () => {
    const newCategory = prompt('Masukkan nama kategori baru:');
    if (newCategory && newCategory.trim() !== '') {
        const formattedCat = newCategory.trim();
        if (!categories.includes(formattedCat)) {
            categories.push(formattedCat);
            localStorage.setItem('categories', JSON.stringify(categories));
            renderCategories();
            categorySelect.value = formattedCat; // Pilih otomatis kategori baru
        } else {
            alert('Kategori sudah ada!');
        }
    }
});

// 5. Menambah Transaksi
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = itemNameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (name === '' || isNaN(amount) || amount <= 0) {
        alert('Harap isi nama dan jumlah yang valid.');
        return;
    }

    const transaction = {
        id: Date.now(), // Menggunakan timestamp sebagai ID unik
        name,
        amount,
        category
    };

    transactions.push(transaction);
    saveData();
    form.reset();
    updateUI();
});

// 6. Menghapus Transaksi
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    updateUI();
}

// 7. Render Daftar Transaksi (termasuk fitur opsional 3: Sorting)
function renderTransactions() {
    transactionList.innerHTML = '';

    // Salin array transaksi agar tidak mengubah data asli saat diurutkan
    let displayedTransactions = [...transactions];
    const sortType = sortSelect.value;

    // Fitur Opsional 3: Logika Sorting
    if (sortType === 'amount-asc') {
        displayedTransactions.sort((a, b) => a.amount - b.amount);
    } else if (sortType === 'amount-desc') {
        displayedTransactions.sort((a, b) => b.amount - a.amount);
    } else if (sortType === 'category') {
        displayedTransactions.sort((a, b) => a.category.localeCompare(b.category));
    }

    displayedTransactions.forEach(t => {
        const li = document.createElement('li');

        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-name">${t.name}</span>
                <span class="transaction-meta">${t.category}</span>
            </div>
            <div>
                <span class="transaction-amount">$${t.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>
            </div>
        `;
        transactionList.appendChild(li);
    });
}

// Event listener untuk trigger render ulang saat sortir diubah
sortSelect.addEventListener('change', renderTransactions);

// 8. Update Total Balance & Peringatan Budget
function updateTotal() {
    const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    totalBalanceEl.innerText = `Rp ${total.toLocaleString('id-ID')},-`;

    // Fitur Opsional 4: Sorot batas pengeluaran
    if (budgetLimit > 0 && total > budgetLimit) {
        totalBalanceEl.classList.add('over-budget');
    } else {
        totalBalanceEl.classList.remove('over-budget');
    }
}

// Simpan Batas Budget ke Local Storage
saveLimitBtn.addEventListener('click', () => {
    const limit = parseFloat(budgetLimitInput.value);
    if (!isNaN(limit) && limit >= 0) {
        budgetLimit = limit;
        localStorage.setItem('budgetLimit', budgetLimit);
        updateTotal(); // Perbarui tampilan peringatan secara instan
        alert('Batas pengeluaran berhasil disimpan!');
    } else {
        alert('Masukkan angka yang valid untuk batas pengeluaran.');
    }
});

// 9. Update Chart.js (Visual Chart MVP)
function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Kalkulasi total per kategori
    const categoryTotals = {};
    transactions.forEach(t => {
        if (categoryTotals[t.category]) {
            categoryTotals[t.category] += t.amount;
        } else {
            categoryTotals[t.category] = t.amount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    // Generate warna secara dinamis berdasarkan jumlah label
    const backgroundColors = labels.map((_, index) => {
        const colors = ['#2ecc71', '#3498db', '#e67e22', '#9b59b6', '#f1c40f', '#e74c3c'];
        return colors[index % colors.length];
    });

    // Jika chart sudah ada, hancurkan (destroy) sebelum membuat ulang agar tidak overlap
    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
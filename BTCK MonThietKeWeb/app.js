"use strict";

/**
 * FinCore Internal — Phân hệ Quản lý Tài chính & Thu chi Nội bộ
 * Clean ES6+ business logic, calculation helpers, chart rendering & validation.
 */

const STORAGE_KEY = "fincore_internal_transactions_v1";

/** Danh mục chuẩn theo loại giao dịch và màu đồng bộ với biểu đồ/bảng */
const CATEGORIES = {
  income: [
    { name: "Doanh thu dịch vụ", color: "#059669" },
    { name: "Thu hồi công nợ", color: "#0d9488" },
    { name: "Lãi tiền gửi E-Banking", color: "#0284c7" },
    { name: "Hoàn thuế GTGT", color: "#16a34a" },
    { name: "Thu nội bộ khác", color: "#22c55e" }
  ],
  expense: [
    { name: "Lương & Phúc lợi", color: "#dc2626" },
    { name: "Thuê văn phòng & Hạ tầng", color: "#ea580c" },
    { name: "Công nghệ & Cloud SaaS", color: "#d97706" },
    { name: "Marketing & Tăng trưởng", color: "#e11d48" },
    { name: "Nộp thuế & Phí ngân hàng", color: "#9333ea" },
    { name: "Chi vận hành khác", color: "#64748b" }
  ]
};

/** Dữ liệu mẫu ban đầu giúp hiển thị ngay Dashboard, Biểu đồ và Bộ lọc */
const SAMPLE_TRANSACTIONS = [
  {
    id: "PT-2611-01",
    type: "income",
    amount: 185000000,
    category: "Doanh thu dịch vụ",
    date: "2026-11-02",
    status: "Đã đối soát E-banking",
    note: "Thanh toán hợp đồng triển khai hệ thống ERP quý IV - Khách hàng Alpha"
  },
  {
    id: "PC-2611-01",
    type: "expense",
    amount: 92000000,
    category: "Lương & Phúc lợi",
    date: "2026-11-05",
    status: "Đã hạch toán thuế",
    note: "Chi lương nhân sự phòng Kỹ thuật & Vận hành kỳ tháng 11/2026"
  },
  {
    id: "PC-2611-02",
    type: "expense",
    amount: 28500000,
    category: "Thuê văn phòng & Hạ tầng",
    date: "2026-11-07",
    status: "Đã đối soát E-banking",
    note: "Tiền thuê mặt bằng văn phòng tầng 8 và phí dịch vụ tòa nhà"
  },
  {
    id: "PT-2611-02",
    type: "income",
    amount: 64000000,
    category: "Thu hồi công nợ",
    date: "2026-11-11",
    status: "Đã đối soát E-banking",
    note: "Thu hồi công nợ đợt 2 từ Công ty TNHH Minh Phát"
  },
  {
    id: "PC-2611-03",
    type: "expense",
    amount: 19400000,
    category: "Công nghệ & Cloud SaaS",
    date: "2026-11-14",
    status: "Đã hạch toán thuế",
    note: "Gia hạn hạ tầng máy chủ Cloud, CDN và bản quyền phần mềm kế toán"
  },
  {
    id: "PC-2611-04",
    type: "expense",
    amount: 15800000,
    category: "Marketing & Tăng trưởng",
    date: "2026-11-18",
    status: "Chờ xuất hóa đơn",
    note: "Chi phí chiến dịch truyền thông sản phẩm B2B tháng 11"
  },
  {
    id: "PC-2611-05",
    type: "expense",
    amount: 12600000,
    category: "Nộp thuế & Phí ngân hàng",
    date: "2026-11-20",
    status: "Đã hạch toán thuế",
    note: "Tạm nộp thuế GTGT kỳ tháng 11 và phí duy trì cổng thanh toán"
  },
  {
    id: "PT-2611-03",
    type: "income",
    amount: 4200000,
    category: "Lãi tiền gửi E-Banking",
    date: "2026-11-24",
    status: "Đã đối soát E-banking",
    note: "Lãi tự động tài khoản thanh toán doanh nghiệp kỳ cuối tháng"
  },
  {
    id: "PT-2610-01",
    type: "income",
    amount: 140000000,
    category: "Doanh thu dịch vụ",
    date: "2026-10-15",
    status: "Đã hạch toán thuế",
    note: "Nghiệm thu gói tư vấn chuyển đổi số tài chính tháng 10/2026"
  },
  {
    id: "PC-2610-01",
    type: "expense",
    amount: 46000000,
    category: "Lương & Phúc lợi",
    date: "2026-10-25",
    status: "Đã hạch toán thuế",
    note: "Thưởng hiệu suất quý III và bảo hiểm bắt buộc"
  }
];

/* ==========================================================================
   1. HÀM TÍNH TOÁN NGHIỆP VỤ (Pure Business Logic)
   ========================================================================== */

/**
 * Tính tổng số tiền các khoản Thu.
 * @param {Array<Object>} transactions
 * @returns {number}
 */
function calculateTotalIncome(transactions) {
  return transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Tính tổng số tiền các khoản Chi.
 * @param {Array<Object>} transactions
 * @returns {number}
 */
function calculateTotalExpense(transactions) {
  return transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Tính số dư hiện tại = Tổng thu - Tổng chi.
 * @param {Array<Object>} transactions
 * @returns {number}
 */
function calculateCurrentBalance(transactions) {
  return calculateTotalIncome(transactions) - calculateTotalExpense(transactions);
}

/**
 * Lấy danh sách top N khoản chi lớn nhất (sắp xếp giảm dần theo số tiền).
 * @param {Array<Object>} transactions
 * @param {number} [limit=5]
 * @returns {Array<Object>}
 */
function getTopLargestExpenses(transactions, limit = 5) {
  return transactions
    .filter((tx) => tx.type === "expense")
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Tổng hợp cơ cấu chi phí theo từng danh mục để vẽ biểu đồ SVG & legend.
 * @param {Array<Object>} transactions
 * @returns {Array<{category: string, total: number, percentage: number, color: string}>}
 */
function getExpenseBreakdownByCategory(transactions) {
  const expenses = transactions.filter((tx) => tx.type === "expense");
  const totalExpense = calculateTotalExpense(transactions);
  if (totalExpense <= 0) return [];

  const totalsByCategory = new Map();
  for (const tx of expenses) {
    totalsByCategory.set(
      tx.category,
      (totalsByCategory.get(tx.category) || 0) + tx.amount
    );
  }

  return Array.from(totalsByCategory.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: (total / totalExpense) * 100,
      color: getCategoryColor("expense", category)
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Lọc danh sách giao dịch theo tháng, ngày cụ thể, loại giao dịch, danh mục và từ khóa.
 * @param {Array<Object>} transactions
 * @param {Object} filters
 * @returns {Array<Object>}
 */
function filterTransactions(transactions, filters) {
  const keyword = (filters.keyword || "").trim().toLowerCase();

  return transactions
    .filter((tx) => {
      if (filters.month && !tx.date.startsWith(filters.month)) return false;
      if (filters.date && tx.date !== filters.date) return false;
      if (filters.type && filters.type !== "all" && tx.type !== filters.type) return false;
      if (filters.category && filters.category !== "all" && tx.category !== filters.category) {
        return false;
      }
      if (keyword) {
        const searchable = `${tx.id} ${tx.category} ${tx.note} ${tx.status}`.toLowerCase();
        if (!searchable.includes(keyword)) return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu phiếu thu/chi trước khi lưu.
 * Đặc biệt kiểm tra số tiền: không rỗng, là số hợp lệ và lớn hơn 0.
 * @param {Object} payload
 * @returns {{isValid: boolean, errors: Object<string, string>, parsedAmount: number}}
 */
function validateVoucherForm(payload) {
  const errors = {};
  const rawAmount = String(payload.amount ?? "").trim();
  const parsedAmount = Number(rawAmount);

  if (rawAmount === "") {
    errors.amount = "Vui lòng nhập số tiền giao dịch.";
  } else if (!Number.isFinite(parsedAmount) || Number.isNaN(parsedAmount)) {
    errors.amount = "Số tiền phải là giá trị số hợp lệ.";
  } else if (parsedAmount <= 0) {
    errors.amount = "Số tiền phải là số dương lớn hơn 0 VND.";
  }

  if (!payload.category) {
    errors.category = "Vui lòng chọn danh mục hoặc loại chi phí.";
  }

  if (!payload.date) {
    errors.date = "Vui lòng chọn ngày phát sinh giao dịch.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    parsedAmount
  };
}

/* ==========================================================================
   2. TRẠNG THÁI & TIỆN ÍCH ĐỊNH DẠNG
   ========================================================================== */

let transactions = loadTransactions();

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SAMPLE_TRANSACTIONS);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : structuredClone(SAMPLE_TRANSACTIONS);
  } catch {
    return structuredClone(SAMPLE_TRANSACTIONS);
  }
}

function saveTransactions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Bỏ qua lỗi quota hoặc private mode mà không làm gián đoạn UI
  }
}

function formatVND(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatCompactVND(amount) {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr`;
  }
  return formatVND(amount);
}

function formatDateVN(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function getCategoryColor(type, categoryName) {
  const list = CATEGORIES[type] || [];
  const found = list.find((item) => item.name === categoryName);
  return found ? found.color : "#64748b";
}

function generateVoucherCode(type, isoDate) {
  const prefix = type === "income" ? "PT" : "PC";
  const compactDate = (isoDate || "").replaceAll("-", "").slice(2, 6) || "2611";
  const seq = String(
    transactions.filter((tx) => tx.type === type).length + 1
  ).padStart(2, "0");
  return `${prefix}-${compactDate}-${seq}`;
}

/* ==========================================================================
   3. DOM REFERENCES & RENDERING
   ========================================================================== */

const dom = {
  tabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view-panel"),
  gotoButtons: document.querySelectorAll("[data-goto-view]"),
  toast: document.getElementById("app-toast"),
  btnResetDemo: document.getElementById("btn-reset-demo"),

  // Dashboard
  updatedAt: document.getElementById("dashboard-updated-at"),
  kpiBalance: document.getElementById("kpi-balance"),
  balanceBadge: document.getElementById("balance-health-badge"),
  kpiIncome: document.getElementById("kpi-income"),
  kpiIncomeCount: document.getElementById("kpi-income-count"),
  kpiExpense: document.getElementById("kpi-expense"),
  kpiExpenseCount: document.getElementById("kpi-expense-count"),
  cssDonut: document.getElementById("income-expense-donut"),
  ratioCenterValue: document.getElementById("ratio-center-value"),
  legendIncomePct: document.getElementById("legend-income-pct"),
  legendExpensePct: document.getElementById("legend-expense-pct"),
  svgSegments: document.getElementById("expense-svg-segments"),
  svgTotal: document.getElementById("svg-donut-total"),
  expenseCategoryLegend: document.getElementById("expense-category-legend"),
  topExpensesList: document.getElementById("top-expenses-list"),
  dashboardRecentTbody: document.getElementById("dashboard-recent-tbody"),

  // Ledger
  filterForm: document.getElementById("ledger-filter-form"),
  filterMonth: document.getElementById("filter-month"),
  filterDate: document.getElementById("filter-date"),
  filterType: document.getElementById("filter-type"),
  filterCategory: document.getElementById("filter-category"),
  filterKeyword: document.getElementById("filter-keyword"),
  btnClearFilters: document.getElementById("btn-clear-filters"),
  ledgerCount: document.getElementById("ledger-count"),
  ledgerFilteredIncome: document.getElementById("ledger-filtered-income"),
  ledgerFilteredExpense: document.getElementById("ledger-filtered-expense"),
  ledgerFilteredNet: document.getElementById("ledger-filtered-net"),
  ledgerTbody: document.getElementById("ledger-tbody"),
  ledgerEmptyState: document.getElementById("ledger-empty-state"),

  // Voucher Form
  voucherForm: document.getElementById("voucher-form"),
  typeRadios: document.querySelectorAll('input[name="type"]'),
  voucherAmount: document.getElementById("voucher-amount"),
  amountPreview: document.getElementById("amount-preview"),
  amountError: document.getElementById("amount-error"),
  voucherCategory: document.getElementById("voucher-category"),
  categoryError: document.getElementById("category-error"),
  voucherDate: document.getElementById("voucher-date"),
  dateError: document.getElementById("date-error"),
  voucherStatus: document.getElementById("voucher-status"),
  voucherNote: document.getElementById("voucher-note"),
  btnResetVoucher: document.getElementById("btn-reset-voucher"),
  previewCurrentBalance: document.getElementById("preview-current-balance"),
  previewDelta: document.getElementById("preview-delta"),
  previewProjectedBalance: document.getElementById("preview-projected-balance")
};

function switchView(viewName) {
  dom.tabs.forEach((tab) => {
    const isMatch = tab.dataset.view === viewName;
    tab.classList.toggle("is-active", isMatch);
    tab.setAttribute("aria-selected", String(isMatch));
  });

  dom.views.forEach((panel) => {
    const isMatch = panel.id === `view-${viewName}`;
    panel.classList.toggle("is-active", isMatch);
    panel.hidden = !isMatch;
  });

  if (viewName === "voucher") {
    updateCashflowPreview();
  }
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  clearTimeout(showToast.timerId);
  showToast.timerId = setTimeout(() => {
    dom.toast.hidden = true;
  }, 4500);
}

function createTransactionRow(tx) {
  const isIncome = tx.type === "income";
  const tr = document.createElement("tr");
  tr.className = isIncome ? "row--income" : "row--expense";

  const catColor = getCategoryColor(tx.type, tx.category);
  const statusClass = tx.status.includes("Chờ") ? "badge--warning" : "badge--neutral";
  const signedAmount = `${isIncome ? "+" : "−"} ${formatVND(tx.amount)}`;

  tr.innerHTML = `
    <td class="col-code">${escapeHTML(tx.id)}</td>
    <td class="col-date">${formatDateVN(tx.date)}</td>
    <td>
      <span class="badge ${isIncome ? "badge--income" : "badge--expense"}">
        ${isIncome ? "Khoản Thu" : "Khoản Chi"}
      </span>
    </td>
    <td>
      <span class="category-tag">
        <span class="category-dot" style="background-color: ${catColor}"></span>
        ${escapeHTML(tx.category)}
      </span>
    </td>
    <td>${escapeHTML(tx.note || "Không có ghi chú")}</td>
    <td><span class="badge ${statusClass}">${escapeHTML(tx.status)}</span></td>
    <td class="col-amount ${isIncome ? "text-income" : "text-expense"}">${signedAmount}</td>
  `;
  return tr;
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ==========================================================================
   4. RENDER DASHBOARD (KPIs, Conic Chart, SVG Chart, Top Expenses, Table)
   ========================================================================== */

function renderDashboard() {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpense = calculateTotalExpense(transactions);
  const currentBalance = calculateCurrentBalance(transactions);
  const incomeCount = transactions.filter((tx) => tx.type === "income").length;
  const expenseCount = transactions.filter((tx) => tx.type === "expense").length;

  dom.updatedAt.textContent = `Cập nhật theo ${transactions.length} chứng từ nội bộ`;

  // KPIs
  dom.kpiBalance.textContent = formatVND(currentBalance);
  dom.kpiBalance.classList.toggle("text-income", currentBalance >= 0);
  dom.kpiBalance.classList.toggle("text-expense", currentBalance < 0);

  dom.balanceBadge.textContent = currentBalance >= 0 ? "Dòng tiền dương" : "Thâm hụt";
  dom.balanceBadge.className = `badge ${
    currentBalance >= 0 ? "badge--income" : "badge--expense"
  }`;

  dom.kpiIncome.textContent = formatVND(totalIncome);
  dom.kpiIncomeCount.textContent = `${incomeCount} phiếu thu đã ghi nhận`;

  dom.kpiExpense.textContent = formatVND(totalExpense);
  dom.kpiExpenseCount.textContent = `${expenseCount} phiếu chi đã ghi nhận`;

  // Charts & Lists
  renderIncomeExpenseConicChart(totalIncome, totalExpense);
  renderExpenseSvgDonut(totalExpense);
  renderTopLargestExpenses();
  renderRecentDashboardTable();
}

function renderIncomeExpenseConicChart(totalIncome, totalExpense) {
  const grandTotal = totalIncome + totalExpense;

  if (grandTotal <= 0) {
    dom.cssDonut.classList.add("css-donut--empty");
    dom.ratioCenterValue.textContent = "0%";
    dom.legendIncomePct.textContent = "0%";
    dom.legendExpensePct.textContent = "0%";
    return;
  }

  dom.cssDonut.classList.remove("css-donut--empty");
  const incomePct = (totalIncome / grandTotal) * 100;
  const expensePct = 100 - incomePct;
  const incomeAngle = (incomePct / 100) * 360;

  dom.cssDonut.style.setProperty("--income-angle", `${incomeAngle.toFixed(2)}deg`);
  const expenseToIncomeRatio =
    totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : "∞";

  dom.ratioCenterValue.textContent = `${expenseToIncomeRatio}%`;
  dom.legendIncomePct.textContent = `${incomePct.toFixed(1)}% (${formatCompactVND(totalIncome)})`;
  dom.legendExpensePct.textContent = `${expensePct.toFixed(1)}% (${formatCompactVND(totalExpense)})`;
}

function renderExpenseSvgDonut(totalExpense) {
  const breakdown = getExpenseBreakdownByCategory(transactions);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;

  dom.svgSegments.innerHTML = "";
  dom.expenseCategoryLegend.innerHTML = "";
  dom.svgTotal.textContent = formatCompactVND(totalExpense);

  if (breakdown.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "legend-item";
    emptyLi.textContent = "Chưa có dữ liệu chi phí.";
    dom.expenseCategoryLegend.appendChild(emptyLi);
    return;
  }

  let accumulatedOffset = 0;

  breakdown.forEach((item) => {
    const segmentLength = (item.percentage / 100) * circumference;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "110");
    circle.setAttribute("cy", "110");
    circle.setAttribute("r", String(radius));
    circle.setAttribute("class", "svg-donut__segment");
    circle.setAttribute("stroke", item.color);
    circle.setAttribute("stroke-dasharray", `${segmentLength} ${circumference}`);
    circle.setAttribute("stroke-dashoffset", String(-accumulatedOffset));
    circle.setAttribute("transform", "rotate(-90 110 110)");

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${item.category}: ${formatVND(item.total)} (${item.percentage.toFixed(1)}%)`;
    circle.appendChild(title);

    dom.svgSegments.appendChild(circle);
    accumulatedOffset += segmentLength;

    // Synchronized legend item
    const li = document.createElement("li");
    li.className = "legend-item";
    li.innerHTML = `
      <span class="legend-swatch" style="background-color: ${item.color}" aria-hidden="true"></span>
      <span class="legend-name">${escapeHTML(item.category)}</span>
      <strong class="legend-value">${item.percentage.toFixed(1)}%</strong>
    `;
    dom.expenseCategoryLegend.appendChild(li);
  });
}

function renderTopLargestExpenses() {
  const topExpenses = getTopLargestExpenses(transactions, 5);
  dom.topExpensesList.innerHTML = "";

  if (topExpenses.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Chưa có khoản chi nào được ghi nhận.";
    dom.topExpensesList.appendChild(empty);
    return;
  }

  topExpenses.forEach((tx, index) => {
    const li = document.createElement("li");
    li.className = "top-expense-item";
    li.style.borderLeftColor = getCategoryColor("expense", tx.category);

    li.innerHTML = `
      <span class="top-expense-rank">#${index + 1}</span>
      <p class="top-expense-info">
        <strong class="top-expense-title">${escapeHTML(tx.category)}</strong>
        <span class="top-expense-meta">${formatDateVN(tx.date)} • ${escapeHTML(tx.note || tx.id)}</span>
      </p>
      <strong class="top-expense-amount">− ${formatVND(tx.amount)}</strong>
    `;
    dom.topExpensesList.appendChild(li);
  });
}

function renderRecentDashboardTable() {
  const sorted = filterTransactions(transactions, {}).slice(0, 6);
  dom.dashboardRecentTbody.innerHTML = "";
  sorted.forEach((tx) => {
    dom.dashboardRecentTbody.appendChild(createTransactionRow(tx));
  });
}

/* ==========================================================================
   5. RENDER NHẬT KÝ GIAO DỊCH & BỘ LỌC
   ========================================================================== */

function populateLedgerCategoryFilter() {
  const currentValue = dom.filterCategory.value;
  const allCategories = [
    ...CATEGORIES.income.map((c) => c.name),
    ...CATEGORIES.expense.map((c) => c.name)
  ];

  // Đảm bảo danh mục phát sinh từ dữ liệu luôn có mặt
  transactions.forEach((tx) => {
    if (!allCategories.includes(tx.category)) {
      allCategories.push(tx.category);
    }
  });

  dom.filterCategory.innerHTML = '<option value="all">Tất cả danh mục</option>';
  allCategories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    dom.filterCategory.appendChild(option);
  });

  if (allCategories.includes(currentValue)) {
    dom.filterCategory.value = currentValue;
  }
}

function renderLedger() {
  const filters = {
    month: dom.filterMonth.value,
    date: dom.filterDate.value,
    type: dom.filterType.value,
    category: dom.filterCategory.value,
    keyword: dom.filterKeyword.value
  };

  const filtered = filterTransactions(transactions, filters);
  const filteredIncome = calculateTotalIncome(filtered);
  const filteredExpense = calculateTotalExpense(filtered);
  const filteredNet = filteredIncome - filteredExpense;

  dom.ledgerCount.textContent = `${filtered.length} giao dịch`;
  dom.ledgerFilteredIncome.textContent = formatVND(filteredIncome);
  dom.ledgerFilteredExpense.textContent = formatVND(filteredExpense);
  dom.ledgerFilteredNet.textContent = formatVND(filteredNet);
  dom.ledgerFilteredNet.classList.toggle("text-income", filteredNet >= 0);
  dom.ledgerFilteredNet.classList.toggle("text-expense", filteredNet < 0);

  dom.ledgerTbody.innerHTML = "";
  dom.ledgerEmptyState.hidden = filtered.length > 0;

  filtered.forEach((tx) => {
    dom.ledgerTbody.appendChild(createTransactionRow(tx));
  });
}

/* ==========================================================================
   6. FORM PHIẾU THU / CHI & VALIDATION
   ========================================================================== */

function getSelectedVoucherType() {
  const checked = document.querySelector('input[name="type"]:checked');
  return checked ? checked.value : "income";
}

function populateVoucherCategories(type) {
  const list = CATEGORIES[type] || [];
  dom.voucherCategory.innerHTML = "";
  list.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = item.name;
    dom.voucherCategory.appendChild(option);
  });
}

function clearValidationErrors() {
  [
    [dom.voucherAmount, dom.amountError],
    [dom.voucherCategory, dom.categoryError],
    [dom.voucherDate, dom.dateError]
  ].forEach(([input, errorEl]) => {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    errorEl.textContent = "";
    errorEl.hidden = true;
  });
}

function showValidationErrors(errors) {
  const map = [
    ["amount", dom.voucherAmount, dom.amountError],
    ["category", dom.voucherCategory, dom.categoryError],
    ["date", dom.voucherDate, dom.dateError]
  ];

  map.forEach(([key, input, errorEl]) => {
    if (errors[key]) {
      input.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      errorEl.textContent = errors[key];
      errorEl.hidden = false;
    }
  });
}

function updateCashflowPreview() {
  const currentBalance = calculateCurrentBalance(transactions);
  const type = getSelectedVoucherType();
  const rawValue = Number(dom.voucherAmount.value);
  const validPreviewAmount = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;

  dom.amountPreview.textContent = formatVND(validPreviewAmount);

  const delta = type === "income" ? validPreviewAmount : -validPreviewAmount;
  const projected = currentBalance + delta;

  dom.previewCurrentBalance.textContent = formatVND(currentBalance);
  dom.previewDelta.textContent = `${delta >= 0 ? "+" : "−"} ${formatVND(Math.abs(delta))}`;
  dom.previewDelta.className = delta >= 0 ? "text-income" : "text-expense";

  dom.previewProjectedBalance.textContent = formatVND(projected);
  dom.previewProjectedBalance.classList.toggle("text-income", projected >= 0);
  dom.previewProjectedBalance.classList.toggle("text-expense", projected < 0);
}

function setDefaultVoucherDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dom.voucherDate.value = `${yyyy}-${mm}-${dd}`;
}

function handleVoucherSubmit(event) {
  event.preventDefault();
  clearValidationErrors();

  const type = getSelectedVoucherType();
  const formData = {
    type,
    amount: dom.voucherAmount.value,
    category: dom.voucherCategory.value,
    date: dom.voucherDate.value,
    status: dom.voucherStatus.value,
    note: dom.voucherNote.value.trim()
  };

  const validation = validateVoucherForm(formData);
  if (!validation.isValid) {
    showValidationErrors(validation.errors);
    if (validation.errors.amount) {
      dom.voucherAmount.focus();
    }
    return;
  }

  const newTransaction = {
    id: generateVoucherCode(type, formData.date),
    type,
    amount: validation.parsedAmount,
    category: formData.category,
    date: formData.date,
    status: formData.status,
    note: formData.note || `${type === "income" ? "Thu" : "Chi"} ${formData.category}`
  };

  transactions = [newTransaction, ...transactions];
  saveTransactions(transactions);

  // Cập nhật toàn bộ giao diện (Dashboard, Biểu đồ, Nhật ký)
  renderAll();

  // Reset form giữ lại ngày mặc định
  dom.voucherForm.reset();
  document.querySelector('input[name="type"][value="income"]').checked = true;
  populateVoucherCategories("income");
  setDefaultVoucherDate();
  updateCashflowPreview();

  const label = type === "income" ? "Phiếu Thu" : "Phiếu Chi";
  showToast(
    `Đã lưu ${label} ${newTransaction.id} (${formatVND(newTransaction.amount)}) và cập nhật dòng tiền.`
  );
  switchView("dashboard");
}

/* ==========================================================================
   7. KHỞI TẠO & GẮN SỰ KIỆN
   ========================================================================== */

function renderAll() {
  populateLedgerCategoryFilter();
  renderDashboard();
  renderLedger();
  updateCashflowPreview();
}

function bindEvents() {
  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  dom.gotoButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.gotoView));
  });

  // Bộ lọc nhật ký giao dịch
  [
    dom.filterMonth,
    dom.filterDate,
    dom.filterType,
    dom.filterCategory,
    dom.filterKeyword
  ].forEach((control) => {
    control.addEventListener("input", renderLedger);
    control.addEventListener("change", renderLedger);
  });

  dom.btnClearFilters.addEventListener("click", () => {
    dom.filterForm.reset();
    renderLedger();
  });

  // Form phiếu thu/chi
  dom.typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      populateVoucherCategories(getSelectedVoucherType());
      updateCashflowPreview();
    });
  });

  dom.voucherAmount.addEventListener("input", () => {
    if (dom.voucherAmount.classList.contains("is-invalid")) {
      clearValidationErrors();
    }
    updateCashflowPreview();
  });

  dom.voucherForm.addEventListener("submit", handleVoucherSubmit);

  dom.btnResetVoucher.addEventListener("click", () => {
    setTimeout(() => {
      clearValidationErrors();
      populateVoucherCategories("income");
      setDefaultVoucherDate();
      updateCashflowPreview();
    }, 0);
  });

  dom.btnResetDemo.addEventListener("click", () => {
    transactions = structuredClone(SAMPLE_TRANSACTIONS);
    saveTransactions(transactions);
    renderAll();
    showToast("Đã khôi phục dữ liệu mẫu ban đầu.");
  });
}

function initApp() {
  populateVoucherCategories("income");
  setDefaultVoucherDate();
  bindEvents();
  renderAll();
}

initApp();

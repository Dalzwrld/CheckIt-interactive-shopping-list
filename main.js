/* ───────────────────────────────────────────────
   CheckIt — main.js
   ─────────────────────────────────────────────── */

// ── State ──────────────────────────────────────
let items = JSON.parse(localStorage.getItem('checkit-items') || '[]');
let editingId = null;

// ── DOM refs ───────────────────────────────────
const form        = document.getElementById('inputForm');
const itemNameEl  = document.getElementById('itemName');
const itemPriceEl = document.getElementById('itemPrice');
const listEl      = document.getElementById('list');
const listCount   = document.getElementById('listCount');
const clearBtn    = document.getElementById('clearButton');
const totalAmount = document.getElementById('totalAmount');
const totalNote   = document.getElementById('totalNote');
const errorMsg    = document.getElementById('errorMsg');
const emptyState  = document.getElementById('emptyState');

const modalOverlay = document.getElementById('modalOverlay');
const editNameEl   = document.getElementById('editName');
const editPriceEl  = document.getElementById('editPrice');
const modalCancel  = document.getElementById('modalCancel');
const modalSave    = document.getElementById('modalSave');

// ── Helpers ────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const formatPrice = (n) =>
    'KSh ' + parseFloat(n).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const save = () => localStorage.setItem('checkit-items', JSON.stringify(items));

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.opacity = '1';
    clearTimeout(showError._t);
    showError._t = setTimeout(() => { errorMsg.style.opacity = '0'; }, 3000);
}

// ── Render ─────────────────────────────────────
function render() {
    listEl.innerHTML = '';

    const hasPurchased = items.some(i => i.purchased);
    const unpurchasedTotal = items
        .filter(i => !i.purchased)
        .reduce((sum, i) => sum + i.price, 0);

    // Count
    const total = items.length;
    const done  = items.filter(i => i.purchased).length;
    listCount.textContent = total === 0
        ? '0 items'
        : `${total} item${total !== 1 ? 's' : ''} · ${done} checked`;

    // Empty state
    emptyState.classList.toggle('visible', total === 0);

    // Total
    totalAmount.textContent = formatPrice(unpurchasedTotal);
    totalNote.textContent   = hasPurchased ? '(purchased items excluded)' : '';

    // Cards
    items.forEach(item => {
        const card = document.createElement('li');
        card.className = 'item-card' + (item.purchased ? ' purchased' : '');
        card.dataset.id = item.id;
        card.innerHTML = `
            <div class="item-check" role="checkbox" aria-checked="${item.purchased}" aria-label="Mark ${item.name} as purchased" tabindex="0"></div>
            <div class="item-info">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="item-actions">
                <button class="btn-action btn-edit" title="Edit item" aria-label="Edit ${item.name}"><img src="images/pen-to-square-solid-full.svg" alt="Edit icon"></button>
                <button class="btn-action btn-delete" title="Delete item" aria-label="Delete ${item.name}"><img src="images/trash-solid-full.svg" alt="Delete icon"></button>
            </div>
        `;

        // Toggle purchased
        const check = card.querySelector('.item-check');
        const togglePurchased = () => {
            item.purchased = !item.purchased;
            save();
            render();
        };
        check.addEventListener('click', togglePurchased);
        check.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePurchased(); } });

        // Edit
        card.querySelector('.btn-edit').addEventListener('click', () => openModal(item.id));

        // Delete
        card.querySelector('.btn-delete').addEventListener('click', () => deleteItem(item.id, card));

        listEl.appendChild(card);
    });

    save();
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Add Item ───────────────────────────────────
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name  = itemNameEl.value.trim();
    const price = parseFloat(itemPriceEl.value);

    if (!name)         return showError('Please enter a product name.');
    if (isNaN(price) || price < 0) return showError('Please enter a valid price.');

    items.unshift({ id: uid(), name, price, purchased: false });
    itemNameEl.value  = '';
    itemPriceEl.value = '';
    itemNameEl.focus();
    errorMsg.textContent = '';

    render();
});

// ── Delete ─────────────────────────────────────
function deleteItem(id, card) {
    card.style.transition = 'opacity 0.2s, transform 0.2s';
    card.style.opacity    = '0';
    card.style.transform  = 'translateX(20px)';
    setTimeout(() => {
        items = items.filter(i => i.id !== id);
        render();
    }, 200);
}

// ── Clear All ──────────────────────────────────
clearBtn.addEventListener('click', () => {
    if (items.length === 0) return;
    if (confirm('Clear your entire shopping list?')) {
        items = [];
        render();
    }
});

// ── Edit Modal ─────────────────────────────────
function openModal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    editingId        = id;
    editNameEl.value  = item.name;
    editPriceEl.value = item.price;
    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    editNameEl.focus();
}

function closeModal() {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    editingId = null;
}

modalCancel.addEventListener('click', closeModal);

modalSave.addEventListener('click', () => {
    const name  = editNameEl.value.trim();
    const price = parseFloat(editPriceEl.value);

    if (!name)              return showError('Item name cannot be empty.');
    if (isNaN(price) || price < 0) return showError('Enter a valid price.');

    const item = items.find(i => i.id === editingId);
    if (item) { item.name = name; item.price = price; }

    closeModal();
    render();
});

// Close modal on overlay click
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ── Init ───────────────────────────────────────
render();
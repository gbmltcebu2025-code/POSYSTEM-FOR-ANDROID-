import { db } from '@/lib/localDb';

function normalize(name) {
  return name.trim().toLowerCase();
}

function itemsTotal(items) {
  return (items || []).reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
}

// Finds an existing credit account by name (case-insensitive), or creates
// a new one, then adds an itemized charge to its outstanding balance.
// `items` is an array of { name, price } — what was actually taken on
// credit (e.g. [{ name: 'Soap', price: 25 }, { name: 'Candy', price: 5 }]).
export async function chargeCredit(customerName, items, { phone = '' } = {}) {
  const amount = itemsTotal(items);
  const accounts = await db.entities.CreditAccount.list('-updated_date', 1000);
  const existing = accounts.find((a) => normalize(a.name) === normalize(customerName));
  const entry = { type: 'charge', amount, items, date: new Date().toISOString() };

  if (existing) {
    return db.entities.CreditAccount.update(existing.id, {
      balance: (existing.balance || 0) + amount,
      phone: phone || existing.phone || '',
      history: [...(existing.history || []), entry],
    });
  }
  return db.entities.CreditAccount.create({
    name: customerName.trim(),
    phone,
    balance: amount,
    history: [entry],
  });
}

// Records a payment against a customer's outstanding balance, floored at 0.
export async function recordPayment(accountId, amount) {
  const account = await db.entities.CreditAccount.get(accountId);
  if (!account) throw new Error('Customer not found');
  const entry = { type: 'payment', amount, date: new Date().toISOString() };
  return db.entities.CreditAccount.update(accountId, {
    balance: Math.max(0, (account.balance || 0) - amount),
    history: [...(account.history || []), entry],
  });
}

export async function listCreditAccounts() {
  return db.entities.CreditAccount.list('-balance', 1000);
}

// Names of items from a customer's most recent charges, for a short
// list-row subtitle like "Soap, candy". Returns up to `limit` distinct
// names, most recent first.
export function recentItemNames(account, limit = 2) {
  const names = [];
  const charges = (account.history || []).filter((h) => h.type === 'charge').reverse();
  for (const charge of charges) {
    for (const item of charge.items || []) {
      if (!names.includes(item.name)) names.push(item.name);
      if (names.length >= limit) return names;
    }
  }
  return names;
}

export function totalItemCount(account) {
  return (account.history || [])
    .filter((h) => h.type === 'charge')
    .reduce((sum, h) => sum + (h.items || []).reduce((s, i) => s + (Number(i.quantity) || 1), 0), 0);
}

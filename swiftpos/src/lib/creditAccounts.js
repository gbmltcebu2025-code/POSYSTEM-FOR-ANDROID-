import { db } from '@/lib/localDb';

function normalize(name) {
  return name.trim().toLowerCase();
}

// Finds an existing credit account by name (case-insensitive), or creates
// a new one, then adds `amount` to its outstanding balance.
export async function chargeCredit(customerName, amount, note = '') {
  const accounts = await db.entities.CreditAccount.list('-updated_date', 1000);
  const existing = accounts.find((a) => normalize(a.name) === normalize(customerName));
  const entry = { type: 'charge', amount, note, date: new Date().toISOString() };

  if (existing) {
    return db.entities.CreditAccount.update(existing.id, {
      balance: (existing.balance || 0) + amount,
      history: [...(existing.history || []), entry],
    });
  }
  return db.entities.CreditAccount.create({
    name: customerName.trim(),
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

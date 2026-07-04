import { Capacitor } from '@capacitor/core';
import { formatCurrency } from '@/lib/utils';
import { db } from '@/lib/localDb';

export const isNative = Capacitor.isNativePlatform();

async function getPlugin() {
  const { CapacitorThermalPrinter } = await import('capacitor-thermal-printer');
  return CapacitorThermalPrinter;
}

// Scans for nearby Bluetooth thermal printers for `durationMs`, calling
// `onDevice` with the running list of discovered devices as they're found.
// Resolves with the final list. Triggers Android's real Bluetooth
// permission dialogs the first time it's used.
export async function scanForPrinters(onDevice, durationMs = 6000) {
  if (!isNative) throw new Error('Bluetooth printer scanning is only available in the installed Android app.');
  const Printer = await getPlugin();

  let devices = [];
  const listener = await Printer.addListener('discoverDevices', (result) => {
    devices = result?.devices || result || [];
    onDevice?.(devices);
  });

  await Printer.startScan();
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  try {
    await Printer.stopScan?.();
  } catch {
    /* not all versions expose stopScan explicitly; ignore */
  }
  await listener.remove();
  return devices;
}

export async function connectPrinter(address) {
  if (!isNative) throw new Error('Bluetooth printing is only available in the installed Android app.');
  const Printer = await getPlugin();
  const device = await Printer.connect({ address });
  if (!device) throw new Error('Could not connect to that printer.');
  await db.settings.setPrinter({ address: device.address, name: device.name });
  return device;
}

export async function getSavedPrinter() {
  const settings = await db.settings.get();
  return settings.printer || null;
}

async function getStoreName() {
  const settings = await db.settings.get();
  return settings.storeName?.trim() || 'SwiftPOS';
}

export async function forgetPrinter() {
  await db.settings.setPrinter(null);
}

export async function testPrintThermal() {
  if (!isNative) throw new Error('Thermal printing is only available in the installed Android app.');
  const printer = await getSavedPrinter();
  if (!printer?.address) throw new Error('No thermal printer is connected.');

  const Printer = await getPlugin();
  try {
    await Printer.connect({ address: printer.address });
  } catch {
    /* may already be connected */
  }

  const storeName = await getStoreName();
  await Printer.begin()
    .align('center')
    .bold()
    .text(`${storeName}\n`)
    .clearFormatting()
    .text('Test print successful!\n\n\n')
    .cutPaper()
    .write();
}

// Builds and sends a simple 58/80mm receipt to the connected thermal
// printer using ESC/POS commands (bold header, item lines, total, cut).
export async function printReceiptThermal(transaction, date) {
  if (!isNative) throw new Error('Thermal printing is only available in the installed Android app.');
  const printer = await getSavedPrinter();
  if (!printer?.address) throw new Error('No thermal printer is connected. Set one up in Settings.');

  const Printer = await getPlugin();
  try {
    await Printer.connect({ address: printer.address });
  } catch {
    // If a connection already exists, connect() may reject; printing can
    // still proceed against the existing connection.
  }

  const storeName = await getStoreName();
  let job = Printer.begin()
    .align('center')
    .bold()
    .text(`${storeName}\n`)
    .clearFormatting()
    .text(`${date.toLocaleString()}\n`)
    .text('--------------------------------\n')
    .align('left');

  for (const item of transaction.items) {
    job = job.text(`${item.quantity}x ${item.name}\n`).align('right').text(`${formatCurrency(item.line_total)}\n`).align('left');
  }

  const paidVia = transaction.payment_method && transaction.payment_method !== 'cash'
    ? (transaction.payment_method === 'credit' ? 'Credit' : transaction.payment_method)
    : 'Cash';

  job = job
    .text('--------------------------------\n')
    .align('right')
    .bold()
    .doubleWidth()
    .text(`TOTAL ${formatCurrency(transaction.total)}\n`)
    .clearFormatting()
    .align('center')
    .text(`Paid via ${paidVia}\n`);

  if (transaction.payment_method === 'cash' && transaction.cash_received != null) {
    job = job
      .text(`Cash: ${formatCurrency(transaction.cash_received)}\n`)
      .text(`Change: ${formatCurrency(transaction.change || 0)}\n`);
  }
  if (transaction.payment_method === 'credit' && transaction.customer_name) {
    job = job.text(`Customer: ${transaction.customer_name}\n`);
  }

  job = job.text('\nThank you for your purchase!\n\n\n').cutPaper();

  await job.write();
}

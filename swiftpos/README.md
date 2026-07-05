# SwiftPOS

A point-of-sale and inventory app: scan or search products, build a cart, check out, track stock, and review sales history. Runs entirely on-device — no backend, no account server, no internet connection required after install. All data (products, sales, your login) is stored locally in the app.

## Run it in a browser (development)

```bash
npm install --legacy-peer-deps
npm run dev
```
(`--legacy-peer-deps` is needed because the thermal-printer plugin hasn't published a peer-dependency range for Capacitor 8 yet, even though it works fine with it.)

## Build the web app

```bash
npm run build
```
Output goes to `dist/`.

## Build an Android APK

This project is wired up for [Capacitor](https://capacitorjs.com), which wraps the built web app into a native Android shell.

### Option A — Let GitHub build it for you (no local installs)
1. Push this project to a new GitHub repository. **Extract this zip's contents directly into the repository root** — `package.json`, `.github/`, `src/`, etc. should all sit at the top level of the repo, not nested inside a subfolder. On GitHub's web UI, drag the *contents* of the extracted folder in, not the folder itself.
2. GitHub Actions will automatically run `.github/workflows/base.apk.yml`, which builds the app and compiles a debug APK. (Double-check this file actually lands at `.github/workflows/base.apk.yml` — note the lowercase `.github` and plural `workflows`; GitHub Actions won't recognize any other casing or path.)
3. Once the workflow finishes (Actions tab → latest run), download the `SwiftPOS-debug-apk` artifact and install it on your Android device (enable "Install unknown apps" for your file manager/browser first).

### Option B — Build locally with Android Studio
```bash
npm install --legacy-peer-deps
npm run build
npx cap add android      # first time only
npx cap sync android
npx cap open android     # opens Android Studio
```
In Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**. The APK will be under `android/app/build/outputs/apk/`.

To make a release (signed, installable outside developer mode) APK instead of a debug one, use Android Studio's **Build → Generate Signed Bundle / APK** flow, or add a signing config and run `./gradlew assembleRelease` inside `android/`.

## Notes on data & accounts

- The first account you register on a device becomes the admin.
- All products, sales, and accounts are stored in the app's local storage on that device only — nothing syncs between devices or to a server. If you clear app data/uninstall, that data is gone.
- There's no email service, so "forgot password" works entirely on-device (matches the account, then lets you set a new password) rather than emailing a link.

## Camera & photo permissions

Two features use device hardware, both via native Capacitor plugins so Android's real system permission dialogs are used — not browser-style prompts:

- **Barcode scanner** (`@capacitor-mlkit/barcode-scanning`) — opens the native camera scanner. Requests the Camera permission the first time you scan.
- **Product photos** (`@capacitor/camera`) — lets you attach a photo to a product, either by taking a new one or picking from the gallery. Requests Camera and/or Photos permission depending on which option you choose.

If you deny either, re-enable it via Android **Settings → Apps → SwiftPOS → Permissions**.

These permissions (`CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`) are added to `android/app/src/main/AndroidManifest.xml` automatically — the GitHub Actions workflow does this on every build. If you're building locally with Android Studio instead, add these lines inside the `<manifest>` tag yourself after running `npx cap add android`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
```

Note: when running the app in a regular browser (`npm run dev`), both features fall back to the browser's own camera/file-picker APIs and browser-style prompts — that's expected in dev mode and won't happen in the installed APK.

Product photos are stored as compressed images directly alongside the product record in local storage (nothing is uploaded anywhere). In the product form, use the **Camera** or **Gallery** button to pick a source directly (there's no combined "prompt" dialog, since newer Capacitor Camera versions require picking the source explicitly).

## App icon

The app ships with a custom generated icon (`assets/icon-only.png`, `icon-foreground.png`, `icon-background.png`). The GitHub Actions workflow runs [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) automatically on every build to generate all required Android launcher icon sizes (including adaptive icons) from these source files.

Building locally instead? Run this after `npx cap add android`:
```bash
npm run icons
```
To use your own icon, replace the three files in `assets/` (each ≥1024×1024px, background/foreground for adaptive icons) and rebuild.

## Scanning barcodes

- **At checkout (POS page):** tap **Scan**, point the camera at a barcode — a matching product is added to the cart automatically, no extra tap needed.
- **Adding/editing a product:** in the product form, tap the scan icon next to **SKU / Barcode** to fill that field from the camera instead of typing it in.

## Pricing & receipts

There's no tax calculation — prices are simple item totals, which suits a small store that doesn't need to break out tax on receipts. If you ever need tax back, it's a small addition to `POS.jsx`/`Cart.jsx`.

**Printing a receipt:** if you've connected a Bluetooth thermal receipt printer in **Settings**, "Print Receipt" sends an ESC/POS print job straight to it. Otherwise it opens Android's native print dialog (via `@capgo/capacitor-printer`, using Android's built-in `PrintManager`), so it can go to any printer set up on the device — including "Save as PDF" or a paired/networked printer with an Android print service installed. In the browser dev preview it falls back to the browser's own print dialog.

## Thermal receipt printer (Bluetooth)

Go to **Settings → Thermal Receipt Printer**:
1. Turn on your printer and put it in pairing mode.
2. Tap **Scan for Printers** (this triggers Android's Bluetooth permission dialogs the first time).
3. Tap **Connect** next to your printer.
4. Use **Test Print** to confirm it works.

Once connected, the receipt printer is remembered on this device and used automatically whenever you tap "Print Receipt" at checkout. Tap the trash icon next to the connected printer to forget it and go back to the system print dialog.

This uses [`capacitor-thermal-printer-bluetooth`](https://www.npmjs.com/package/capacitor-thermal-printer-bluetooth) under the hood (a continuation of Malik12tree's original ESC/POS plugin), and talks directly to the printer over Bluetooth using ESC/POS commands (rather than Android's general print framework) — which is how most affordable 58mm/80mm receipt printers actually expect to be driven. Compatibility still depends on your specific printer model; if scanning doesn't find your printer or a connection fails, that's hardware-specific and worth checking against the plugin's supported device list.

## E-wallet QR payments

Go to **Settings → E-Wallet QR Codes** to add any number of e-wallets (e.g. GCash, Maya) — give each a name and upload its QR code image (camera or gallery).

At checkout, configured e-wallets appear as payment method options next to Cash. Choosing one and tapping Checkout shows that wallet's QR code full-screen for the customer to scan; tapping **Payment Received** then completes the sale and records that e-wallet's name as the payment method on the transaction and receipt.

This is a manual confirmation flow (there's no live payment-gateway integration) — it's meant to mirror how a small store actually accepts e-wallet payments at the counter today: show the QR, customer pays, cashier confirms.

## Cash payments & change

Choosing **Cash** at checkout opens a screen where you enter how much cash the customer handed over — quick buttons for the exact amount and the next few common bills (₱20/50/100/200/500/1000) are provided, or you can type any amount. Change is calculated automatically and shown live; "Complete Sale" is disabled until enough cash has been entered. The amount tendered and change are saved on the transaction and shown on the receipt.

## Store credit (utang)

Choosing **Credit** at checkout asks for the customer's name, then charges the sale to their account instead of taking payment immediately — for regulars who pay later. The charge is itemized automatically from whatever's in the cart (e.g. "Soap, candy"), not just a lump total.

You can also log a credit sale manually without going through checkout: on the **Credits** page, tap **Add** to open a form where you enter the customer's name and number, add each item and its price, optionally record an amount already paid upfront, and mark the entry Paid or Unpaid. This is for situations where someone takes items on credit without a full register transaction.

Each customer row shows their initials, a preview of recent items, their balance, and a Paid/Unpaid status pill. Tap a row to see their full itemized history and record a payment (partial or **Pay in Full**) whenever they settle up. Customer accounts are matched by name (case-insensitive), so "Juan" and "juan" charge the same account.

## Home

The app opens on **Home**: a greeting bar with your store name (tap it to open the profile drawer — more below), today's date, a gradient revenue card, a 6-icon shortcut grid (New Sale, Scan Item, Products, Inventory, Credits, Sales), and a Recent Transactions list.

The Inventory shortcut shows a small red badge when items are low on stock. The bell icon next to the greeting also lights up with a dot in that case, and tapping it jumps to Inventory.

The POS/checkout screen lives at `/pos` (reachable via the sidebar's "Sell" item on desktop, or the "New Sale"/"Scan Item" shortcuts or the floating scan button on mobile).

## Mobile navigation

On phones, the bottom bar follows a GCash-style layout: four tabs (Home, Products, Sales, Credits) with a floating circular **Scan** button raised in the center. Tapping it opens a small sheet with two choices:
- **Scan to Sell** — jumps to POS with the scanner already open.
- **Scan to Add Product** — opens the new-product form with the scanner already open, so the scanned code fills the SKU field directly.

Settings isn't a bottom-bar tab — it lives behind the profile drawer instead (see below). Inventory stays reachable via the Home screen's shortcut grid and its low-stock badge. The desktop sidebar still shows every page directly, including Settings, since there's more room there.

## Profile drawer (mobile)

Tapping the store name/icon on Home slides in a drawer from the right with:
- **Store Info** — rename your store inline.
- **Print** — shows the connected thermal printer at a glance; tap through for the full scan/connect/test flow.
- **Background Theme** — the Light/Dark toggle (see below).
- **E-Wallet** — shows how many QR codes are saved; tap through to add/edit/remove them.
- **Report** — tap through for the sales report (see below).
- **Log out** at the bottom.

This is the same underlying Store Info / Printer / E-Wallet functionality as the desktop Settings page — mobile just reaches it through this drawer instead of a dedicated bottom-bar tab, so there's one set of components behind both.

## Light / Dark theme

Settings (desktop) or the profile drawer (mobile) → **Background Theme** switches between a light and dark color palette. The choice is saved on the device and applied immediately.

One relevant fix that came with this: the app previously had no explicit light/dark declaration, which meant some Android devices with system-wide "force dark" enabled were auto-inverting the page rather than showing our own colors. `index.html` now declares `<meta name="color-scheme" content="dark light">` so the app's own theme is always what renders, regardless of that device setting. The app still defaults to dark for a familiar look; switching to Light is opt-in.

## Sales report

Available from Settings or the profile drawer's **Report** section: a Today/This Week toggle showing total sales, transaction count, total amount charged to credit, and a ranked breakdown of top-selling items (quantity and revenue per item) — built from your actual transaction history, not a static summary.

## Customizing the store name on receipts

The store name you set in Store Info also replaces "SwiftPOS" at the top of every printed receipt (both the system print dialog and thermal printer output) and on the on-screen receipt after checkout. Leave it blank to keep the default.





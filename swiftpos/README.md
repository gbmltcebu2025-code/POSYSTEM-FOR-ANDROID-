# SwiftPOS

A point-of-sale and inventory app: scan or search products, build a cart, check out, track stock, and review sales history. Runs entirely on-device — no backend, no account server, no internet connection required after install. All data (products, sales, your login) is stored locally in the app.

## Run it in a browser (development)

```bash
npm install
npm run dev
```

## Build the web app

```bash
npm run build
```
Output goes to `dist/`.

## Build an Android APK

This project is wired up for [Capacitor](https://capacitorjs.com), which wraps the built web app into a native Android shell.

### Option A — Let GitHub build it for you (no local installs)
1. Push this project to a new GitHub repository (you can drag-and-drop the files in the GitHub web UI — no `git` required).
2. GitHub Actions will automatically run `.github/workflows/build-apk.yml`, which builds the app and compiles a debug APK.
3. Once the workflow finishes (Actions tab → latest run), download the `SwiftPOS-debug-apk` artifact and install it on your Android device (enable "Install unknown apps" for your file manager/browser first).

### Option B — Build locally with Android Studio
```bash
npm install
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

This uses [`capacitor-thermal-printer`](https://github.com/Malik12tree/capacitor-thermal-printer) under the hood, built on Rongta's RTPrinter SDK, and talks directly to the printer over Bluetooth using ESC/POS commands (rather than Android's general print framework) — which is how most affordable 58mm/80mm receipt printers actually expect to be driven. Compatibility still depends on your specific printer model; if scanning doesn't find your printer or a connection fails, that's hardware-specific and worth checking against the plugin's supported device list.

## E-wallet QR payments

Go to **Settings → E-Wallet QR Codes** to add any number of e-wallets (e.g. GCash, Maya) — give each a name and upload its QR code image (camera or gallery).

At checkout, configured e-wallets appear as payment method options next to Cash. Choosing one and tapping Checkout shows that wallet's QR code full-screen for the customer to scan; tapping **Payment Received** then completes the sale and records that e-wallet's name as the payment method on the transaction and receipt.

This is a manual confirmation flow (there's no live payment-gateway integration) — it's meant to mirror how a small store actually accepts e-wallet payments at the counter today: show the QR, customer pays, cashier confirms.

## Cash payments & change

Choosing **Cash** at checkout opens a screen where you enter how much cash the customer handed over — quick buttons for the exact amount and the next few common bills (₱20/50/100/200/500/1000) are provided, or you can type any amount. Change is calculated automatically and shown live; "Complete Sale" is disabled until enough cash has been entered. The amount tendered and change are saved on the transaction and shown on the receipt.

## Store credit (utang)

Choosing **Credit** at checkout asks for the customer's name, then charges the sale to their account instead of taking payment immediately — for regulars who pay later.

Go to the **Credits** page to see every customer with an outstanding balance, expand a customer to see their full charge/payment history, and record a payment (partial or **Pay in Full**) whenever they settle up. Customer accounts are matched by name (case-insensitive), so "Juan" and "juan" charge the same account.

## Dashboard

The app now opens on a **Dashboard** showing today's revenue, today's sale count, low-stock item count, and total credit owed — plus two large shortcut buttons:
- **New Sale** — jumps straight to the POS screen.
- **Scan Item** — jumps to POS and immediately opens the barcode scanner, skipping the extra tap.

The POS/checkout screen itself now lives at `/pos` (still reachable via the "Sell" nav item).

## Customizing the store name on receipts

Go to **Settings → Store Info** and enter your store's name. It replaces "SwiftPOS" at the top of every printed receipt (both the system print dialog and thermal printer output) and on the on-screen receipt after checkout. Leave it blank to keep the default.




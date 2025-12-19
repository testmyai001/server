# Installation & Setup Guide - AutoTally AI

This guide walks you through setting up the AutoTally AI application for development and production.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Google Gemini API Key** (free tier available)
- **Optional: Tally Prime** (for Tally integration features)

## Step 1: Clone & Install Dependencies

```bash
# Navigate to the project directory
cd DesktopApp

# Install all npm packages
npm install
```

**What this does:**
- Installs React 19, Vite 6, TypeScript 5.8
- Installs UI libraries (Recharts, Lucide React)
- Installs Excel processing libraries (XLSX, ExcelJS)
- Installs Google Gemini API client

## Step 2: Configure Environment Variables

### Option A: Create `.env.local` file

1. Copy the `.env.example` file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   VITE_TALLY_API_URL=https://your-ngrok-url.ngrok-free.dev  # Optional
   ```

### Option B: Set Environment Variables in System (Windows PowerShell)

```powershell
$env:VITE_GEMINI_API_KEY = "your_actual_api_key_here"
npm run dev
```

### Getting Your Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key" (top-right)
3. Create a new API key in the Google Cloud Console
4. Copy the API key and add it to `.env.local`

**Note:** The free tier includes:
- 15 requests per minute
- 1,500,000 tokens per month

## Step 3: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
VITE v6.4.1  ready in 1121 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.0.168:3000/
```

The app will automatically open in your browser. If port 3000 is in use, Vite will use 3001.

### Hot Module Replacement (HMR) Enabled
- Save any file and changes will appear instantly in the browser
- No manual refresh needed

## Step 4: Optional - Configure Tally Prime Integration

If you want to use Tally Prime features:

### Prerequisites
- Tally Prime installed and running on your system (default: localhost:9000)
- [Ngrok](https://ngrok.com) installed for tunneling

### Setup Steps

1. **Start Tally Prime** on your computer (default runs on port 9000)

2. **Create Ngrok Tunnel:**
   ```bash
   ngrok http 9000
   ```
   This will output a URL like: `https://abc123-xyz.ngrok-free.dev`

3. **Update `.env.local`:**
   ```env
   VITE_TALLY_API_URL=https://abc123-xyz.ngrok-free.dev
   ```

4. **Restart the dev server:**
   ```bash
   npm run dev
   ```

5. **Verify Tally Connection:**
   - Open the app at http://localhost:3000
   - Go to Settings and test the Tally connection
   - You should see "Tally Prime is connected ✓"

## Step 5: Build for Production

```bash
# Build the optimized production bundle
npm run build

# Preview the production build locally
npm run preview
```

**Output:**
- Production-ready files in `dist/` directory
- Optimized JavaScript and CSS bundles
- Sourcemaps for debugging (can be disabled in vite.config.ts)

## Project Structure

```
src/
├── App.tsx              # Main application component
├── index.tsx            # React entry point
├── constants.ts         # Configuration constants
├── types.ts             # TypeScript type definitions
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── InvoiceEditor.tsx
│   ├── BankStatementManager.tsx
│   ├── ExcelImportManager.tsx
│   ├── TallyLogs.tsx
│   ├── JsonViewer.tsx
│   ├── XmlViewer.tsx
│   └── SettingsModal.tsx
└── services/            # Business logic & API integration
    ├── geminiService.ts     # Google Gemini AI integration
    ├── tallyService.ts      # Tally Prime XML generation
    └── dbService.ts         # IndexedDB for local storage
```

## Key Features & Services

### 🤖 AI-Powered Document Processing (Gemini)
- Automatically extracts data from invoice images/PDFs
- Classifies documents (Invoice, Bank Statement, Invalid)
- Extracts line items, taxes, and GST rates
- Parses bank statements for reconciliation

### 📊 Dashboard
- Real-time analytics and data visualization
- Upload history and processing logs
- Invoice summary and statistics

### 📈 Excel Import/Export
- Bulk import invoices from Excel files
- Export processed data to Excel
- Template support for batch processing

### 💰 Bank Statement Reconciliation
- Upload bank statements (PDF or Excel)
- Automatic matching with processed invoices
- Reconciliation reports

### 🧮 Tally Prime Integration
- Generate Tally-compatible XML vouchers
- Support for Purchase, Sales, Payment, and Contra transactions
- Automatic GST calculations (CGST, SGST, IGST, Cess)
- Push data directly to Tally Prime

### 💾 Local Data Storage
- Browser IndexedDB for offline support
- No backend server required
- All data stored locally in your browser
- Automatic backup support (future feature)

## Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite` | Start dev server on port 3000 |
| `npm run build` | `vite build` | Build for production |
| `npm run preview` | `vite preview` | Preview production build locally |

## Troubleshooting

### "Port 3000 is already in use"
- **Solution:** Kill the process or let Vite use the next available port (3001)
- **Windows PowerShell:** 
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
  ```

### "GEMINI_API_KEY is undefined"
- **Solution:** Ensure `.env.local` file exists and has `VITE_GEMINI_API_KEY=your_key_here`
- Restart the dev server after adding the key
- Check that no `.env.local` is in `.gitignore`

### "Cannot find module '@google/genai'"
- **Solution:** Run `npm install` again to ensure all dependencies are installed
- Clear node_modules and reinstall: `rm -r node_modules && npm install`

### "Tally connection failed"
- Check that Tally Prime is running on port 9000
- Verify Ngrok tunnel is active: `ngrok http 9000`
- Update `VITE_TALLY_API_URL` with the correct Ngrok URL
- Restart the dev server

### TypeScript Errors
- The project uses strict TypeScript mode
- Ensure all type definitions are correct
- Run: `npm run dev` to see type-checking errors in real-time

## Development Workflow

1. **Start dev server:** `npm run dev`
2. **Edit components** in `src/components/` or services in `src/services/`
3. **Changes auto-reload** in browser (HMR)
4. **Check types:** TypeScript errors shown in terminal and browser
5. **Build for production:** `npm run build`

## Performance Optimization Tips

- The app is optimized with Vite for fast builds
- Code splitting happens automatically at build time
- React Fast Refresh enabled for instant feedback during development
- IndexedDB for local storage (no server latency)

## Security Notes

- **Never commit `.env.local`** - Add to `.gitignore` ✓
- API keys are injected at build time via Vite
- All sensitive data stays in browser (IndexedDB)
- No backend server means no server-side breaches

## Support & Debugging

- **Enable debug mode:** Add logging to services in `src/services/`
- **Browser DevTools:** Press F12 to open Chrome DevTools
  - Console tab for errors
  - Network tab for API calls
  - Application tab to view IndexedDB data
- **Vite Documentation:** https://vitejs.dev/

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Set up Google Gemini API key
3. ✅ Start dev server (`npm run dev`)
4. ⭕ Upload your first invoice!
5. ⭕ Optionally configure Tally Prime
6. ⭕ Build for production when ready

---

**Last Updated:** December 18, 2025  
**AutoTally AI v0.0.0**

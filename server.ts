import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  INITIAL_PERFORMANCE,
  INITIAL_BRAND_DEALS,
  INITIAL_EXPENSES,
} from './src/data/initialData';
import {
  AppDatabase,
  BrandDealRecord,
  CreatorRecord,
  CreatorUploadingStatus,
  CreatorPaymentStatus,
  ExpenseRecord,
  PerformanceDayEntry,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db: AppDatabase;

function loadDatabase(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.brandDeals && parsed.performance) {
        return {
          performance: parsed.performance || INITIAL_PERFORMANCE,
          brandDeals: parsed.brandDeals || INITIAL_BRAND_DEALS,
          expenses: parsed.expenses || INITIAL_EXPENSES,
        };
      }
    }
  } catch (err) {
    console.error('Failed reading database file, initializing defaults:', err);
  }

  const initial: AppDatabase = {
    performance: INITIAL_PERFORMANCE,
    brandDeals: INITIAL_BRAND_DEALS,
    expenses: INITIAL_EXPENSES,
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: AppDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to disk:', err);
  }
}

db = loadDatabase();

app.use(express.json());

// Get all database records
app.get('/api/data', (_req: Request, res: Response) => {
  res.json(db);
});

// Update or add performance record for a date
app.post('/api/performance', (req: Request, res: Response) => {
  const entry: PerformanceDayEntry = req.body;
  if (!entry || !entry.date) {
    return res.status(400).json({ error: 'Date is required for performance entry' });
  }

  const sanitized: PerformanceDayEntry = {
    date: entry.date,
    performanceRating: entry.performanceRating || 'green',
    tasks: Array.isArray(entry.tasks) ? entry.tasks : [],
    updates: entry.updates || '',
    notes: entry.notes || '',
    updatedAt: new Date().toISOString(),
  };

  db.performance[entry.date] = sanitized;
  saveDatabase(db);
  res.json({ success: true, entry: sanitized });
});

// Create or update a brand deal (with multiple creators)
app.post('/api/brand-deals', (req: Request, res: Response) => {
  const data: Partial<BrandDealRecord> = req.body;
  if (!data.brandName || !data.dealDate) {
    return res.status(400).json({ error: 'Brand name and deal date are required' });
  }

  const totalDealAmount = Math.max(0, Number(data.totalDealAmount) || 0);
  const amountReceived = Math.max(0, Number(data.amountReceived) || 0);

  // Validate or infer payment status
  let paymentStatus = data.paymentStatus;
  if (!paymentStatus) {
    if (amountReceived >= totalDealAmount && totalDealAmount > 0) {
      paymentStatus = 'Paid';
    } else if (amountReceived > 0) {
      paymentStatus = 'Partially Paid';
    } else {
      paymentStatus = 'Pending';
    }
  }

  const creators: CreatorRecord[] = Array.isArray(data.creators)
    ? data.creators.map((c, idx) => ({
        id: c.id || `c-${Date.now()}-${idx}`,
        creatorName: (c.creatorName || '').trim() || 'Creator',
        lockingAmount: Math.max(0, Number(c.lockingAmount) || 0),
        payoutAmount: Math.max(0, Number(c.payoutAmount) || 0),
        uploadingStatus: (c.uploadingStatus === 'Uploaded' ? 'Uploaded' : 'Pending') as CreatorUploadingStatus,
        paymentStatus: (c.paymentStatus || 'Pending') as CreatorPaymentStatus,
        amountPaid: Math.max(0, Number(c.amountPaid) || 0),
      }))
    : [];

  const id = data.id || `deal-${Date.now()}`;
  const updatedDeal: BrandDealRecord = {
    id,
    brandName: data.brandName.trim(),
    dealDate: data.dealDate.trim(),
    totalDealAmount,
    amountReceived,
    paymentStatus,
    creators,
    notes: data.notes || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const index = db.brandDeals.findIndex((d) => d.id === id);
  if (index >= 0) {
    db.brandDeals[index] = updatedDeal;
  } else {
    db.brandDeals.unshift(updatedDeal);
  }

  saveDatabase(db);
  res.json({ success: true, deal: updatedDeal });
});

// Delete a brand deal
app.delete('/api/brand-deals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.brandDeals = db.brandDeals.filter((d) => d.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Create or update an expense
app.post('/api/expenses', (req: Request, res: Response) => {
  const data: Partial<ExpenseRecord> = req.body;
  if (!data.date || !data.description) {
    return res.status(400).json({ error: 'Date and description are required for expense' });
  }

  const id = data.id || `exp-${Date.now()}`;
  const record: ExpenseRecord = {
    id,
    date: data.date.trim(),
    description: data.description.trim(),
    amount: Math.max(0, Number(data.amount) || 0),
    createdAt: data.createdAt || new Date().toISOString(),
  };

  const index = db.expenses.findIndex((e) => e.id === id);
  if (index >= 0) {
    db.expenses[index] = record;
  } else {
    db.expenses.unshift(record);
  }

  saveDatabase(db);
  res.json({ success: true, expense: record });
});

// Delete an expense
app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.expenses = db.expenses.filter((e) => e.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Reset database
app.post('/api/reset-data', (_req: Request, res: Response) => {
  db = {
    performance: INITIAL_PERFORMANCE,
    brandDeals: INITIAL_BRAND_DEALS,
    expenses: INITIAL_EXPENSES,
  };
  saveDatabase(db);
  res.json({ success: true, db });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Creator Performance & Finance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

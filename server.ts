import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_DAILY_WORK, INITIAL_DEALS, INITIAL_WEEKLY_TARGETS, AUTHORIZED_USERS } from './src/data/initialData';
import { AppDatabase, BrandDeal, DailyWorkEntry, WeeklyTarget } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database state in memory + atomic persistence to disk
let db: AppDatabase;

function loadDatabase(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed reading database file, initializing defaults:', err);
  }

  const initial: AppDatabase = {
    dailyWork: INITIAL_DAILY_WORK,
    deals: INITIAL_DEALS,
    weeklyTargets: INITIAL_WEEKLY_TARGETS,
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

// Auth Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const account = AUTHORIZED_USERS[email.trim().toLowerCase()];
  if (!account || account.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid credentials. Only HR and Senior accounts are permitted.' });
  }

  res.json({
    user: account.user,
    token: `token-${account.user.id}-${Date.now()}`,
  });
});

// Update User Profile
app.post('/api/auth/profile', (req: Request, res: Response) => {
  const { id, name, title, email, avatar, newPassword } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const foundKey = Object.keys(AUTHORIZED_USERS).find((k) => AUTHORIZED_USERS[k].user.id === id);
  if (!foundKey) {
    return res.status(404).json({ error: 'User not found' });
  }

  const account = AUTHORIZED_USERS[foundKey];
  if (name) account.user.name = name.trim();
  if (title) account.user.title = title.trim();
  if (avatar) account.user.avatar = avatar.trim();
  if (newPassword && newPassword.trim()) {
    account.passwordHash = newPassword.trim();
  }

  const updatedEmail = email ? email.trim().toLowerCase() : foundKey;
  if (updatedEmail !== foundKey) {
    account.user.email = updatedEmail;
    delete AUTHORIZED_USERS[foundKey];
    AUTHORIZED_USERS[updatedEmail] = account;
  }

  res.json({ success: true, user: account.user });
});

// Get all shared database records
app.get('/api/data', (_req: Request, res: Response) => {
  res.json(db);
});

// Update or add daily work record (HR or Senior)
app.post('/api/daily-work', (req: Request, res: Response) => {
  const entry: DailyWorkEntry = req.body;
  if (!entry || !entry.date) {
    return res.status(400).json({ error: 'Invalid daily work payload: date is required' });
  }

  // Ensure submittedBy and lastEditorName are never null
  entry.submittedBy = entry.submittedBy || entry.lastEditorName || 'Shraddha Tiwari';
  entry.lastEditorName = entry.lastEditorName || entry.submittedBy || 'Shraddha Tiwari';
  entry.lastModifiedAt = new Date().toISOString();

  // Preserve existing senior review if not modified
  const existing = db.dailyWork[entry.date];
  if (existing?.seniorReview && !entry.seniorReview) {
    entry.seniorReview = existing.seniorReview;
  }

  db.dailyWork[entry.date] = entry;
  saveDatabase(db);
  res.json({ success: true, entry });
});

// Senior Review on a daily work record
app.post('/api/daily-work/review', (req: Request, res: Response) => {
  const { date, feedback, status, reviewerName } = req.body;
  if (!date) {
    return res.status(400).json({ error: 'Date is required for review' });
  }

  const existing = db.dailyWork[date];
  if (!existing) {
    return res.status(404).json({ error: 'No daily work entry found for this date' });
  }

  existing.seniorReview = {
    reviewed: true,
    reviewedBy: reviewerName || 'David Vance (Senior Director)',
    reviewedAt: new Date().toISOString(),
    feedback: feedback || '',
    status: status || 'approved',
  };

  db.dailyWork[date] = existing;
  saveDatabase(db);
  res.json({ success: true, entry: existing });
});

// Create or update a brand deal
app.post('/api/deals', (req: Request, res: Response) => {
  const dealData = req.body;
  if (!dealData.brandName || !dealData.campaignName) {
    return res.status(400).json({ error: 'Brand name and campaign name are required' });
  }

  const dealValue = Number(dealData.dealValue) || 0;
  const brandRevenueReceived = Number(dealData.brandRevenueReceived) || 0;
  const outstandingPayments = Math.max(0, dealValue - brandRevenueReceived);
  const creatorPayments = Number(dealData.creatorPayments) || 0;
  const additionalExpenses = Number(dealData.additionalExpenses) || 0;
  const totalExpenses = creatorPayments + additionalExpenses;
  const netProfit = brandRevenueReceived - totalExpenses;
  const profitMargin = brandRevenueReceived > 0 
    ? Math.round(((netProfit / brandRevenueReceived) * 100) * 100) / 100 
    : 0;

  const id = dealData.id || `deal-${Date.now()}`;
  const updatedDeal: BrandDeal = {
    id,
    brandName: dealData.brandName.trim(),
    campaignName: dealData.campaignName.trim(),
    dealValue,
    brandRevenueReceived,
    outstandingPayments,
    creatorPayments,
    additionalExpenses,
    totalExpenses,
    netProfit,
    profitMargin,
    creatorsLocked: Number(dealData.creatorsLocked) || 0,
    creatorsCompleted: Number(dealData.creatorsCompleted) || 0,
    creatorsPending: Number(dealData.creatorsPending) || 0,
    creatorsDeclined: Number(dealData.creatorsDeclined) || 0,
    deadline: dealData.deadline || new Date().toISOString().split('T')[0],
    status: dealData.status || 'in-progress',
    notes: dealData.notes || '',
    createdAt: dealData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const index = db.deals.findIndex((d) => d.id === id);
  if (index >= 0) {
    db.deals[index] = updatedDeal;
  } else {
    db.deals.unshift(updatedDeal);
  }

  saveDatabase(db);
  res.json({ success: true, deal: updatedDeal });
});

// Delete a deal
app.delete('/api/deals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.deals = db.deals.filter((d) => d.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Set or update weekly target
app.post('/api/weekly-targets', (req: Request, res: Response) => {
  const target: WeeklyTarget = req.body;
  if (!target.id || !target.startDate || !target.endDate) {
    return res.status(400).json({ error: 'Target ID, startDate and endDate are required' });
  }

  db.weeklyTargets[target.id] = {
    ...target,
    targetRevenue: Number(target.targetRevenue) || 0,
    targetProfit: Number(target.targetProfit) || 0,
    targetCreatorsLocked: Number(target.targetCreatorsLocked) || 0,
    targetDeliverables: Number(target.targetDeliverables) || 0,
    updatedAt: new Date().toISOString(),
  };

  saveDatabase(db);
  res.json({ success: true, target: db.weeklyTargets[target.id] });
});

// Reset database to initial seed
app.post('/api/reset-data', (_req: Request, res: Response) => {
  db = {
    dailyWork: INITIAL_DAILY_WORK,
    deals: INITIAL_DEALS,
    weeklyTargets: INITIAL_WEEKLY_TARGETS,
  };
  saveDatabase(db);
  res.json({ success: true, db });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
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
    console.log(`Agency WorkTrack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

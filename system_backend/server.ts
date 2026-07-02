import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { executeQuery, dbService } from './db';
import {
  hashPassword, verifyPassword,
  generateAccessToken, generateRefreshToken,
  verifyRefreshToken,
  authMiddleware, requireRole, setAuthCookies, clearAuthCookies,
  blacklistToken, getRequiredRolesForPath,
  type AuthUser
} from './auth';
import {
  validate,
  loginSchema, createUserSchema,
  customerSchema, branchSchema, agentSchema,
  quoteSchema, policySchema, claimSchema,
  companySchema, paymentSchema, documentSchema,
  notificationSchema, subscriptionPlanSchema, invoiceSchema,
  workflowStepSchema, updateStatusSchema,
} from './validation';

// Cookie parsing helper (avoids adding cookie-parser dependency)
function parseCookies(req: express.Request): Record<string, string> {
  const cookieHeader = req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(pair => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(val.join('=') || '');
  });
  return cookies;
}

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' ? 3000 : 5001;

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use((req, _res, next) => {
    (req as any).cookies = parseCookies(req);
    next();
  });

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));

  // CORS - restrict in production
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.APP_URL || 'https://pentaguard.example.com'].filter(Boolean)
    : ['http://localhost:3000'];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Global rate limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });
  app.use('/api', globalLimiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/refresh', authLimiter);

  function getCompanyId(req: express.Request): number {
    const id = req.query.companyId ? parseInt(req.query.companyId as string) : null;
    return id && !isNaN(id) ? id : 1;
  }

  async function audit(req: express.Request, action: string, entityType: string, entityId: number | null = null, details: any = null) {
    if (req.user) {
      const ip = req.ip || req.socket.remoteAddress || null;
      try {
        await dbService.recordAuditLog(req.user.userId, action, entityType, entityId, details, ip);
      } catch { /* audit failures are non-blocking */ }
    }
  }

  // ─── Auth Routes (public or self-authenticated) ───

  app.post('/api/auth/login', validate(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
      }

      const userRes = await executeQuery('SELECT * FROM USERS WHERE Email = $1', [email]);
      const user = userRes.rows[0];
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (user.Status !== 'Active') {
        res.status(403).json({ error: 'Account is disabled' });
        return;
      }

      const valid = await verifyPassword(password, user.Password_Hash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const authUser: AuthUser = {
        userId: user.User_Id,
        email: user.Email,
        role: user.Role,
        companyId: user.Company_Id,
        firstName: user.First_Name,
        lastName: user.Last_Name
      };

      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      setAuthCookies(res, accessToken, refreshToken);

      // Also return token for backward compatibility
      res.json({ token: accessToken, refreshToken, user: authUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const refreshToken = req.body.refreshToken || (req as any).cookies?.refresh_token;
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      const decoded = verifyRefreshToken(refreshToken);
      const userRes = await executeQuery('SELECT * FROM USERS WHERE User_Id = $1 AND Status = \'Active\'', [decoded.userId]);
      const user = userRes.rows[0];
      if (!user) {
        res.status(401).json({ error: 'User not found or inactive' });
        return;
      }

      const authUser: AuthUser = {
        userId: user.User_Id,
        email: user.Email,
        role: user.Role,
        companyId: user.Company_Id,
        firstName: user.First_Name,
        lastName: user.Last_Name
      };

      const newAccessToken = generateAccessToken(authUser);
      const newRefreshToken = generateRefreshToken(authUser);

      setAuthCookies(res, newAccessToken, newRefreshToken);

      res.json({ token: newAccessToken, refreshToken: newRefreshToken, user: authUser });
    } catch (err: any) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      blacklistToken(header.slice(7));
    }
    const cookieToken = (req as any).cookies?.access_token;
    if (cookieToken) {
      blacklistToken(cookieToken);
    }
    clearAuthCookies(res);
    res.json({ success: true });
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/users', authMiddleware, requireRole('admin', 'super_admin'), validate(createUserSchema), async (req, res) => {
    try {
      const { email, password, role, companyId, firstName, lastName } = req.body;

      const hash = await hashPassword(password);
      await executeQuery(
        'INSERT INTO USERS (Email, Password_Hash, Role, Company_Id, First_Name, Last_Name) VALUES ($1, $2, $3, $4, $5, $6)',
        [email, hash, role, companyId || null, firstName, lastName]
      );

      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admins and super admins can list all users
  app.get('/api/auth/users', authMiddleware, requireRole('admin', 'super_admin'), async (req, res) => {
    try {
      const usersRes = await executeQuery('SELECT User_Id, Email, Role, Company_Id, First_Name, Last_Name, Status, Created_At FROM USERS');
      res.json(usersRes.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/status', (req, res) => {
    res.json({ status: 'running', engine: 'Penta Guard API' });
  });

  // ─── Global Auth + Role Middleware for all /api routes ───
  app.use('/api', (req, res, next) => {
    const path = req.path;
    // Login, refresh, and logout have to be accessible without a session; status is public info
    if (path.startsWith('/auth/login') || path.startsWith('/auth/refresh') || path === '/status' || path.startsWith('/auth/logout')) {
      next();
      return;
    }
    authMiddleware(req, res, () => {
      // Check whether their role actually has access to this endpoint
      const requiredRoles = getRequiredRolesForPath(req.originalUrl);
      if (requiredRoles && req.user && !requiredRoles.includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions for this resource' });
        return;
      }
      next();
    });
  });

  app.get('/api/company', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery('SELECT * FROM COMPANY WHERE Company_Id = $1', [companyId]);
      res.json(data.rows[0] || { Company_Name: 'Nile Insurance S.C' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const companyId = getCompanyId(req);

      const customersRes = await executeQuery('SELECT COUNT(*) as Count FROM CUSTOMER WHERE Company_Id = $1', [companyId]);
      const activePoliciesRes = await executeQuery('SELECT COUNT(*) as Count FROM POLICIES WHERE Status = \'Active\' AND Company_Id = $1', [companyId]);
      const pendingClaimsRes = await executeQuery('SELECT COUNT(*) as Count FROM CLAIMS cl JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id WHERE cl.Status IN (\'Filed\', \'Under Review\') AND p.Company_Id = $1', [companyId]);
      const approvedClaimsRes = await executeQuery('SELECT COUNT(*) as Count FROM CLAIMS cl JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id WHERE cl.Status = \'Approved\' AND p.Company_Id = $1', [companyId]);
      const revenueRes = await executeQuery('SELECT COALESCE(SUM(pay.Amount), 0) as Sum FROM PAYMENTS pay JOIN POLICIES p ON pay.Policy_Id = p.Policy_Id WHERE p.Company_Id = $1', [companyId]);
      const pendingPaymentsRes = await executeQuery('SELECT COUNT(*) as Count FROM PAYMENTS pay JOIN POLICIES p ON pay.Policy_Id = p.Policy_Id WHERE pay.Status = \'Pending\' AND p.Company_Id = $1', [companyId]);

      const kpis = {
        totalCustomers: parseInt(customersRes.rows[0].Count || customersRes.rows[0].count) || 0,
        activePolicies: parseInt(activePoliciesRes.rows[0].Count || activePoliciesRes.rows[0].count) || 0,
        pendingClaims: parseInt(pendingClaimsRes.rows[0].Count || pendingClaimsRes.rows[0].count) || 0,
        approvedClaims: parseInt(approvedClaimsRes.rows[0].Count || approvedClaimsRes.rows[0].count) || 0,
        totalRevenue: parseFloat(revenueRes.rows[0].Sum || revenueRes.rows[0].sum) || 0,
        pendingPayments: parseInt(pendingPaymentsRes.rows[0].Count || pendingPaymentsRes.rows[0].count) || 0
      };

      const policiesByTypeRes = await executeQuery(`
        SELECT it.Type_Name as name, COUNT(p.Policy_Id) as value
        FROM POLICIES p
        JOIN INSURANCE_TYPES it ON p.Insurance_Type_Id = it.Insurance_Type_Id
        WHERE p.Company_Id = $1
        GROUP BY it.Type_Name
      `, [companyId]);

      const claimsByStatusRes = await executeQuery(`
        SELECT cl.Status as name, COUNT(cl.Claim_Id) as value
        FROM CLAIMS cl
        JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id
        WHERE p.Company_Id = $1
        GROUP BY cl.Status
      `, [companyId]);

      const recentPoliciesRes = await executeQuery(`
        SELECT p.Policy_No as id, c.First_Name || ' ' || c.Last_Name as customer, 
               it.Type_Name as type, p.Start_Date as date, p.Total_Premium as premium, p.Status as status, p.Policy_Id
        FROM POLICIES p
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id
        JOIN INSURANCE_TYPES it ON p.Insurance_Type_Id = it.Insurance_Type_Id
        WHERE p.Company_Id = $1
        ORDER BY p.Start_Date DESC, p.Policy_Id DESC
        LIMIT 5
      `, [companyId]);

      const recentClaimsRes = await executeQuery(`
        SELECT 'CLM-' || cl.Claim_Id as id, p.Policy_No as "policyId", 
               c.First_Name || ' ' || c.Last_Name as customer, cl.Status as status, cl.Incident_Date as date, cl.Claim_Id
        FROM CLAIMS cl
        JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id
        WHERE p.Company_Id = $1
        ORDER BY cl.Incident_Date DESC, cl.Claim_Id DESC
        LIMIT 5
      `, [companyId]);

      const trendData = await dbService.getMonthlyAnalytics(companyId);

      res.json({
        success: true,
        data: {
          kpis,
          trendData,
          policiesByType: policiesByTypeRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
          claimsByStatus: claimsByStatusRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
          recentPolicies: recentPoliciesRes.rows.map(r => ({
            dbId: r.policy_id,
            id: r.id,
            customer: r.customer,
            type: r.type,
            date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            premium: 'ETB ' + parseFloat(r.premium).toLocaleString(),
            status: r.status
          })),
          recentClaims: recentClaimsRes.rows.map(r => ({
            dbId: r.claim_id,
            id: r.id,
            policyId: r.policyId,
            customer: r.customer,
            status: r.status,
            date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }))
        }
      });
    } catch (err: any) {
      console.error("Dashboard Stats Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/analytics/monthly', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await dbService.getMonthlyAnalytics(companyId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12-month sparklines for dashboard KPI cards
  app.get('/api/dashboard/sparkline', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await dbService.getDashboardSparkline(companyId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upcoming tasks from payment schedules and open claims
  app.get('/api/tasks/upcoming', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await dbService.getUpcomingTasks(companyId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/claims/kpis', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await dbService.getClaimsKpis(companyId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Agent performance: policies + commissions per agent
  app.get('/api/agent-performance', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await dbService.getAgentPerformance(companyId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/branches-with-stats', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await dbService.getBranchesWithStats(companyId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/companies-with-stats', async (req, res) => {
    try {
      const data = await dbService.getCompaniesWithStats();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/claim-staff', async (req, res) => {
    try {
      const data = await executeQuery(`
        SELECT cs.Claim_Staff_Id, cs.First_Name, cs.Last_Name, cs.Email, cs.Status,
               s.Specialization_Name
        FROM CLAIM_STAFF cs
        LEFT JOIN SPECIALIZATIONS s ON cs.Specialization_Id = s.Specialization_Id
      `);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Search across customers, policies, and claims
  app.get('/api/search', async (req, res) => {
    try {
      const q = (req.query.q || '').toString().trim();
      if (!q) return res.json({ customers: [], policies: [], claims: [] });
      const data = await dbService.globalSearch(q);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/customers', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT c.*, cp.Phone_No as Phone
        FROM CUSTOMER c
        LEFT JOIN CUSTOMER_PHONE_NO cp ON c.Customer_Id = cp.Customer_Id AND cp.Phone_No_Id = 1
        WHERE c.Company_Id = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/customers', validate(customerSchema), async (req, res) => {
    try {
      const newCust = await dbService.addCustomer(req.body);
      await audit(req, 'CREATE', 'Customer', newCust.Customer_Id, req.body);
      res.status(201).json(newCust);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/customers/:id', validate(customerSchema.partial()), async (req, res) => {
    try {
      const updated = await dbService.updateCustomer(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Customer', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      await dbService.deleteCustomer(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Customer', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/branches', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery('SELECT * FROM BRANCH WHERE Company_Id = $1', [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/branches', validate(branchSchema), async (req, res) => {
    try {
      const newBranch = await dbService.addBranch(req.body);
      await audit(req, 'CREATE', 'Branch', newBranch.Branch_Id, req.body);
      res.status(201).json(newBranch);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/branches/:id', validate(branchSchema.partial()), async (req, res) => {
    try {
      const updated = await dbService.updateBranch(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Branch', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/branches/:id', async (req, res) => {
    try {
      await dbService.deleteBranch(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Branch', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/agents', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT a.*, b.Branch_Name, c.Company_Name 
        FROM AGENT a 
        JOIN BRANCH b ON a.Branch_Id = b.Branch_Id 
        JOIN COMPANY c ON b.Company_Id = c.Company_Id
        WHERE b.Company_Id = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/agents', validate(agentSchema), async (req, res) => {
    try {
      const newAgent = await dbService.addAgent(req.body);
      await audit(req, 'CREATE', 'Agent', newAgent.Agent_Id, req.body);
      res.status(201).json(newAgent);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/agents/:id', validate(agentSchema.partial()), async (req, res) => {
    try {
      const updated = await dbService.updateAgent(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Agent', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/agents/:id', async (req, res) => {
    try {
      await dbService.deleteAgent(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Agent', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/quotes', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT q.*, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name 
        FROM QUOTES q 
        JOIN CUSTOMER c ON q.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON c.Company_Id = co.Company_Id
        WHERE c.Company_Id = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/quotes', validate(quoteSchema), async (req, res) => {
    try {
      const newQuote = await dbService.addQuote(req.body);
      await audit(req, 'CREATE', 'Quote', newQuote.Quote_Id, req.body);
      res.status(201).json(newQuote);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/quotes/:id', validate(quoteSchema.partial()), async (req, res) => {
    try {
      const updated = await dbService.updateQuote(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Quote', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/quotes/:id', async (req, res) => {
    try {
      await dbService.deleteQuote(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Quote', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/policies', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT p.*, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name, it.Type_Name 
        FROM POLICIES p 
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON p.Company_Id = co.Company_Id
        JOIN INSURANCE_TYPES it ON p.Insurance_Type_Id = it.Insurance_Type_Id
        WHERE p.Company_Id = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/policies', validate(policySchema), async (req, res) => {
    try {
      const newPolicy = await dbService.addPolicy(req.body);
      await audit(req, 'CREATE', 'Policy', newPolicy.Policy_Id, req.body);
      res.status(201).json(newPolicy);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/policies/:id', validate(updateStatusSchema), async (req, res) => {
    try {
      const updated = await dbService.updatePolicy(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Policy', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/policies/:id', async (req, res) => {
    try {
      await dbService.deletePolicy(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Policy', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/claims', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT cl.*, p.Policy_No, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name 
        FROM CLAIMS cl 
        JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id 
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON p.Company_Id = co.Company_Id
        WHERE p.Company_Id = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/claims', validate(claimSchema), async (req, res) => {
    try {
      const newClaim = await dbService.addClaim(req.body);
      await audit(req, 'CREATE', 'Claim', newClaim.Claim_Id, req.body);
      res.status(201).json(newClaim);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/claims/:id', validate(updateStatusSchema), async (req, res) => {
    try {
      const updated = await dbService.updateClaim(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Claim', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/claims/:id/workflow', async (req, res) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) return res.status(400).json({ error: 'Invalid claim ID' });
      const data = await dbService.getClaimWorkflow(claimId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/claims/:id/workflow', validate(workflowStepSchema), async (req, res) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) return res.status(400).json({ error: 'Invalid claim ID' });
      const newStep = await dbService.addWorkflowStep(claimId, req.body);
      await audit(req, 'WORKFLOW', 'Claim', claimId, req.body);
      res.status(201).json(newStep);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/claims/:id/reject', async (req, res) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) return res.status(400).json({ error: 'Invalid claim ID' });
      const result = await dbService.rejectClaim(claimId);
      await audit(req, 'REJECT', 'Claim', claimId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/claims/:id', async (req, res) => {
    try {
      await dbService.deleteClaim(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Claim', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/companies', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM COMPANY');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/companies', validate(companySchema), async (req, res) => {
    try {
      const created = await dbService.addCompany(req.body);
      await audit(req, 'CREATE', 'Company', created.Company_Id, req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/companies/:id', validate(companySchema.partial()), async (req, res) => {
    try {
      const updated = await dbService.updateCompany(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Company', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/companies/:id', async (req, res) => {
    try {
      await dbService.deleteCompany(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Company', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/claim-workflows', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM CLAIM_WORKFLOW');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/api/payments', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT pay.* FROM PAYMENTS pay
        JOIN POLICIES p ON pay.Policy_Id = p.Policy_Id
        WHERE p.Company_Id = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/payments', validate(paymentSchema), async (req, res) => {
    try {
      const created = await dbService.addPayment(req.body);
      await audit(req, 'CREATE', 'Payment', created.Payment_Id, req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/payments/:id', validate(updateStatusSchema), async (req, res) => {
    try {
      const updated = await dbService.updatePayment(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Payment', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/payments/:id', async (req, res) => {
    try {
      await dbService.deletePayment(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Payment', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/payment-schedules', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM PAYMENT_SCHEDULES');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/api/documents', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT d.* FROM DOCUMENTS d
        LEFT JOIN POLICIES p ON d.Policy_Id = p.Policy_Id
        LEFT JOIN CLAIMS cl ON d.Claim_Id = cl.Claim_Id
        LEFT JOIN POLICIES p2 ON cl.Policy_Id = p2.Policy_Id
        WHERE COALESCE(p.Company_Id, p2.Company_Id) = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/documents', validate(documentSchema), async (req, res) => {
    try {
      const created = await dbService.addDocument(req.body);
      await audit(req, 'CREATE', 'Document', created.Document_Id, req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/documents/:id', async (req, res) => {
    try {
      await dbService.deleteDocument(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Document', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/commissions', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM AGENT_COMMISSIONS');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/api/auto-assets', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM AUTO_ASSET');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/api/home-assets', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM HOME_ASSET');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM SUBSCRIPTION_PLANS');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/subscription-plans', validate(subscriptionPlanSchema), async (req, res) => {
    try {
      const created = await dbService.addSubscriptionPlan(req.body);
      await audit(req, 'CREATE', 'SubscriptionPlan', created.Plan_Id, req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/subscription-plans/:id', validate(subscriptionPlanSchema.partial()), async (req, res) => {
    try {
      const updated = await dbService.updateSubscriptionPlan(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'SubscriptionPlan', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/subscription-plans/:id', async (req, res) => {
    try {
      await dbService.deleteSubscriptionPlan(parseInt(req.params.id));
      await audit(req, 'DELETE', 'SubscriptionPlan', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/invoices', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM SUBSCRIPTION_INVOICES');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/invoices', validate(invoiceSchema), async (req, res) => {
    try {
      const created = await dbService.addInvoice(req.body);
      await audit(req, 'CREATE', 'Invoice', created.Invoice_Id, req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.put('/api/invoices/:id', validate(invoiceSchema.partial()), async (req, res) => {
    try {
      const updated = await dbService.updateInvoice(parseInt(req.params.id), req.body);
      await audit(req, 'UPDATE', 'Invoice', parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.delete('/api/invoices/:id', async (req, res) => {
    try {
      await dbService.deleteInvoice(parseInt(req.params.id));
      await audit(req, 'DELETE', 'Invoice', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/notifications', async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await executeQuery(`
        SELECT n.* FROM NOTIFICATIONS n
        JOIN CUSTOMER c ON n.Customer_Id = c.Customer_Id
        WHERE c.Company_Id = $1
      `, [companyId]);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/notifications', validate(notificationSchema), async (req, res) => {
    try {
      const created = await dbService.addNotification(req.body);
      await audit(req, 'CREATE', 'Notification', created.Notification_Id, req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Penta Guard SaaS server booting on port ${PORT}`);
    
  });
}

startServer();

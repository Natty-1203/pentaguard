import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { executeQuery, dbService } from './db';

async function startServer() {
  const app = express();
  // Standalone mode: Express runs on 5000 in development, and 3000 in production (where it serves static frontend assets)
  const PORT = process.env.NODE_ENV === 'production' ? 3000 : 5001;

  // Support JSON and urlencoded request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORE API ENDPOINTS

  // DB Metadata & Diagnostic
  app.get('/api/db-status', (req, res) => {
    res.json({
      connected: dbService.isPostgres(),
      engine: dbService.isPostgres() ? 'Real PostgreSQL Database' : 'Local Sandbox Database Engine',
      database: process.env.DB_NAME || 'pentaguard',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      user: process.env.DB_USER || 'postgres'
    });
  });

  // Custom Live SQL Sandbox Terminal Endpoint!
  app.post('/api/db-query', async (req, res) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query text must be supplied' });
    }

    try {
      console.log(`Executing query request: "${query}"`);
      const result = await executeQuery(query);
      res.json({
        success: true,
        rows: result.rows,
        rowCount: result.rows.length
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Database execution failed'
      });
    }
  });

  // Get active tenant company parameters
  app.get('/api/company', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM COMPANY WHERE Company_Id = 1');
      res.json(data.rows[0] || { Company_Name: 'Nile Insurance S.C' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET aggregated dashboard stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      // 1. KPIs
      const customersRes = await executeQuery('SELECT COUNT(*) as Count FROM CUSTOMER');
      const activePoliciesRes = await executeQuery('SELECT COUNT(*) as Count FROM POLICIES WHERE Status = \'Active\'');
      const pendingClaimsRes = await executeQuery('SELECT COUNT(*) as Count FROM CLAIMS WHERE Status IN (\'Filed\', \'Under Review\')');
      const approvedClaimsRes = await executeQuery('SELECT COUNT(*) as Count FROM CLAIMS WHERE Status = \'Approved\'');
      const revenueRes = await executeQuery('SELECT COALESCE(SUM(Amount), 0) as Sum FROM PAYMENTS');
      const pendingPaymentsRes = await executeQuery('SELECT COUNT(*) as Count FROM PAYMENTS WHERE Status = \'Pending\'');

      const kpis = {
        totalCustomers: parseInt(customersRes.rows[0].Count || customersRes.rows[0].count) || 0,
        activePolicies: parseInt(activePoliciesRes.rows[0].Count || activePoliciesRes.rows[0].count) || 0,
        pendingClaims: parseInt(pendingClaimsRes.rows[0].Count || pendingClaimsRes.rows[0].count) || 0,
        approvedClaims: parseInt(approvedClaimsRes.rows[0].Count || approvedClaimsRes.rows[0].count) || 0,
        totalRevenue: parseFloat(revenueRes.rows[0].Sum || revenueRes.rows[0].sum) || 0,
        pendingPayments: parseInt(pendingPaymentsRes.rows[0].Count || pendingPaymentsRes.rows[0].count) || 0
      };

      // 2. Charts
      const policiesByTypeRes = await executeQuery(`
        SELECT it.Type_Name as name, COUNT(p.Policy_Id) as value
        FROM POLICIES p
        JOIN INSURANCE_TYPES it ON p.Insurance_Type_Id = it.Insurance_Type_Id
        GROUP BY it.Type_Name
      `);

      const claimsByStatusRes = await executeQuery(`
        SELECT Status as name, COUNT(Claim_Id) as value
        FROM CLAIMS
        GROUP BY Status
      `);

      // 3. Recent Records
      const recentPoliciesRes = await executeQuery(`
        SELECT p.Policy_No as id, c.First_Name || ' ' || c.Last_Name as customer, 
               it.Type_Name as type, p.Start_Date as date, p.Total_Premium as premium, p.Status as status, p.Policy_Id
        FROM POLICIES p
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id
        JOIN INSURANCE_TYPES it ON p.Insurance_Type_Id = it.Insurance_Type_Id
        ORDER BY p.Start_Date DESC, p.Policy_Id DESC -- Fallback order if multiple same day
        LIMIT 5
      `);

      const recentClaimsRes = await executeQuery(`
        SELECT 'CLM-' || cl.Claim_Id as id, p.Policy_No as "policyId", 
               c.First_Name || ' ' || c.Last_Name as customer, cl.Status as status, cl.Incident_Date as date, cl.Claim_Id
        FROM CLAIMS cl
        JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id
        ORDER BY cl.Incident_Date DESC, cl.Claim_Id DESC
        LIMIT 5
      `);

      // 4. Monthly Trend Data
      const trendData = await dbService.getMonthlyAnalytics();

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

  // GET aggregated monthly analytics
  app.get('/api/analytics/monthly', async (req, res) => {
    try {
      const data = await dbService.getMonthlyAnalytics();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET 12-month sparkline series for dashboard KPI mini-charts
  app.get('/api/dashboard/sparkline', async (req, res) => {
    try {
      const data = await dbService.getDashboardSparkline();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET upcoming tasks derived from payment schedules + pending claims
  app.get('/api/tasks/upcoming', async (req, res) => {
    try {
      const data = await dbService.getUpcomingTasks();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET aggregated claims KPIs
  app.get('/api/claims/kpis', async (req, res) => {
    try {
      const data = await dbService.getClaimsKpis();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET agent performance metrics (joins agents with their policies + commissions)
  app.get('/api/agent-performance', async (req, res) => {
    try {
      const data = await dbService.getAgentPerformance();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET branches enriched with phone + agent count
  app.get('/api/branches-with-stats', async (req, res) => {
    try {
      const data = await dbService.getBranchesWithStats();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET companies enriched with user/policy/revenue aggregates
  app.get('/api/companies-with-stats', async (req, res) => {
    try {
      const data = await dbService.getCompaniesWithStats();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET claim staff (for uploader display)
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

  // GET global search results across customers, policies, and claims
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

  // GET customers
  app.get('/api/customers', async (req, res) => {
    try {
      const data = await executeQuery(`
        SELECT c.*, cp.Phone_No as Phone
        FROM CUSTOMER c
        LEFT JOIN CUSTOMER_PHONE_NO cp ON c.Customer_Id = cp.Customer_Id AND cp.Phone_No_Id = 1
      `);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST customer
  app.post('/api/customers', async (req, res) => {
    try {
      const newCust = await dbService.addCustomer(req.body);
      res.status(201).json(newCust);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT customer
  app.put('/api/customers/:id', async (req, res) => {
    try {
      const updated = await dbService.updateCustomer(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE customer
  app.delete('/api/customers/:id', async (req, res) => {
    try {
      await dbService.deleteCustomer(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET branches
  app.get('/api/branches', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM BRANCH');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST branch
  app.post('/api/branches', async (req, res) => {
    try {
      const newBranch = await dbService.addBranch(req.body);
      res.status(201).json(newBranch);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT branch
  app.put('/api/branches/:id', async (req, res) => {
    try {
      const updated = await dbService.updateBranch(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE branch
  app.delete('/api/branches/:id', async (req, res) => {
    try {
      await dbService.deleteBranch(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET agents
  app.get('/api/agents', async (req, res) => {
    try {
      const data = await executeQuery(`
        SELECT a.*, b.Branch_Name, c.Company_Name 
        FROM AGENT a 
        JOIN BRANCH b ON a.Branch_Id = b.Branch_Id 
        JOIN COMPANY c ON b.Company_Id = c.Company_Id
      `);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST agent
  app.post('/api/agents', async (req, res) => {
    try {
      const newAgent = await dbService.addAgent(req.body);
      res.status(201).json(newAgent);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT agent
  app.put('/api/agents/:id', async (req, res) => {
    try {
      const updated = await dbService.updateAgent(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE agent
  app.delete('/api/agents/:id', async (req, res) => {
    try {
      await dbService.deleteAgent(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET quotes
  app.get('/api/quotes', async (req, res) => {
    try {
      const data = await executeQuery(`
        SELECT q.*, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name 
        FROM QUOTES q 
        JOIN CUSTOMER c ON q.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON c.Company_Id = co.Company_Id
      `);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST quote
  app.post('/api/quotes', async (req, res) => {
    try {
      const newQuote = await dbService.addQuote(req.body);
      res.status(201).json(newQuote);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT quote
  app.put('/api/quotes/:id', async (req, res) => {
    try {
      const updated = await dbService.updateQuote(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE quote
  app.delete('/api/quotes/:id', async (req, res) => {
    try {
      await dbService.deleteQuote(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET policies
  app.get('/api/policies', async (req, res) => {
    try {
      const data = await executeQuery(`
        SELECT p.*, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name, it.Type_Name 
        FROM POLICIES p 
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON p.Company_Id = co.Company_Id
        JOIN INSURANCE_TYPES it ON p.Insurance_Type_Id = it.Insurance_Type_Id
      `);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST policy
  app.post('/api/policies', async (req, res) => {
    try {
      const newPolicy = await dbService.addPolicy(req.body);
      res.status(201).json(newPolicy);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT policy
  app.put('/api/policies/:id', async (req, res) => {
    try {
      const updated = await dbService.updatePolicy(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE policy
  app.delete('/api/policies/:id', async (req, res) => {
    try {
      await dbService.deletePolicy(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET claims
  app.get('/api/claims', async (req, res) => {
    try {
      const data = await executeQuery(`
        SELECT cl.*, p.Policy_No, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name 
        FROM CLAIMS cl 
        JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id 
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON p.Company_Id = co.Company_Id
      `);
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST claim
  app.post('/api/claims', async (req, res) => {
    try {
      const newClaim = await dbService.addClaim(req.body);
      res.status(201).json(newClaim);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT claim
  app.put('/api/claims/:id', async (req, res) => {
    try {
      const updated = await dbService.updateClaim(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // CLAIM WORKFLOW API
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

  app.post('/api/claims/:id/workflow', async (req, res) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) return res.status(400).json({ error: 'Invalid claim ID' });
      const newStep = await dbService.addWorkflowStep(claimId, req.body);
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
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE claim
  app.delete('/api/claims/:id', async (req, res) => {
    try {
      await dbService.deleteClaim(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET companies
  app.get('/api/companies', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM COMPANY');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST company
  app.post('/api/companies', async (req, res) => {
    try {
      const created = await dbService.addCompany(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT company
  app.put('/api/companies/:id', async (req, res) => {
    try {
      const updated = await dbService.updateCompany(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE company
  app.delete('/api/companies/:id', async (req, res) => {
    try {
      await dbService.deleteCompany(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET claim workflows
  app.get('/api/claim-workflows', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM CLAIM_WORKFLOW');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET payments
  app.get('/api/payments', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM PAYMENTS');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST payments
  app.post('/api/payments', async (req, res) => {
    try {
      const created = await dbService.addPayment(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT payments
  app.put('/api/payments/:id', async (req, res) => {
    try {
      const updated = await dbService.updatePayment(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE payments
  app.delete('/api/payments/:id', async (req, res) => {
    try {
      await dbService.deletePayment(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET schedules
  app.get('/api/payment-schedules', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM PAYMENT_SCHEDULES');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET documents
  app.get('/api/documents', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM DOCUMENTS');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST documents
  app.post('/api/documents', async (req, res) => {
    try {
      const created = await dbService.addDocument(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE documents
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      await dbService.deleteDocument(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET commissions
  app.get('/api/commissions', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM AGENT_COMMISSIONS');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET auto assets
  app.get('/api/auto-assets', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM AUTO_ASSET');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET home assets
  app.get('/api/home-assets', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM HOME_ASSET');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET subscription plans
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM SUBSCRIPTION_PLANS');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST subscription plans
  app.post('/api/subscription-plans', async (req, res) => {
    try {
      const created = await dbService.addSubscriptionPlan(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT subscription plans
  app.put('/api/subscription-plans/:id', async (req, res) => {
    try {
      const updated = await dbService.updateSubscriptionPlan(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE subscription plans
  app.delete('/api/subscription-plans/:id', async (req, res) => {
    try {
      await dbService.deleteSubscriptionPlan(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET invoices
  app.get('/api/invoices', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM SUBSCRIPTION_INVOICES');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST invoices
  app.post('/api/invoices', async (req, res) => {
    try {
      const created = await dbService.addInvoice(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT invoices
  app.put('/api/invoices/:id', async (req, res) => {
    try {
      const updated = await dbService.updateInvoice(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE invoices
  app.delete('/api/invoices/:id', async (req, res) => {
    try {
      await dbService.deleteInvoice(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET notifications
  app.get('/api/notifications', async (req, res) => {
    try {
      const data = await executeQuery('SELECT * FROM NOTIFICATIONS');
      res.json(data.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST notifications
  app.post('/api/notifications', async (req, res) => {
    try {
      const created = await dbService.addNotification(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // VITE DEV SERVER ROUTING

  if (process.env.NODE_ENV === 'production') {
    // Serve static compiled UI files in production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Standard standalone message
    app.get('/api/status', (req, res) => {
      res.json({ status: 'running', mode: 'development', engine: 'Penta Guard API' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Penta Guard SaaS server booting on port ${PORT}`);
    
  });
}

startServer();

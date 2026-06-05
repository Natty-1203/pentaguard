import { simDb, persistDb } from './sim_db_engine';
import { dbState } from './db_state';
import { executeQuery } from './db';

// REST helper functions to perform transactional operations directly on database
export const dbService = {
  isPostgres: () => dbState.isRealPostgres,
  
  // Customers List and creation
  getCustomers: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery('SELECT * FROM CUSTOMER');
      return data.rows;
    }
    return simDb.customers;
  },
  
  addCustomer: async (cust: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Customer_Id), 0) + 1 AS new_id FROM CUSTOMER');
      const newId = newIdRes.rows[0].new_id;
      const fayda = cust.Fayda_No || `ET-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const reg = new Date().toISOString().split('T')[0];
      await executeQuery(
        'INSERT INTO CUSTOMER (Customer_Id, Company_Id, First_Name, Last_Name, DOB, Email, Fayda_No, Gender, Registration_Date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, 1, cust.First_Name, cust.Last_Name, cust.DOB || '1990-01-01', cust.Email || '', fayda, cust.Gender || 'Male', reg]
      );
      if (cust.Phone) {
        await executeQuery(
          'INSERT INTO CUSTOMER_PHONE_NO (Customer_Id, Phone_No_Id, Phone_No) VALUES ($1, 1, $2)',
          [newId, cust.Phone]
        );
      }
      return {
        Customer_Id: newId,
        Company_Id: 1,
        First_Name: cust.First_Name,
        Last_Name: cust.Last_Name,
        DOB: cust.DOB || '1990-01-01',
        Email: cust.Email || '',
        Fayda_No: fayda,
        Gender: cust.Gender || 'Male',
        Registration_Date: reg
      };
    }

    const newId = simDb.customers.length > 0 ? Math.max(...simDb.customers.map(c => c.Customer_Id)) + 1 : 1;
    const item = {
      Customer_Id: newId,
      Company_Id: 1,
      First_Name: cust.First_Name,
      Last_Name: cust.Last_Name,
      DOB: cust.DOB || '1990-01-01',
      Email: cust.Email || '',
      Fayda_No: cust.Fayda_No || `ET-${Math.floor(1000000 + Math.random() * 9000000)}`,
      Gender: cust.Gender || 'Male',
      Registration_Date: new Date().toISOString().split('T')[0]
    };
    simDb.customers.unshift(item); // insert at start
    persistDb();
    return item;
  },

  updateCustomer: async (id: number, cust: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE CUSTOMER SET First_Name = $1, Last_Name = $2, Email = $3, DOB = $4, Gender = $5 WHERE Customer_Id = $6',
        [cust.First_Name, cust.Last_Name, cust.Email, cust.DOB, cust.Gender, id]
      );
      if (cust.Phone) {
        await executeQuery('DELETE FROM CUSTOMER_PHONE_NO WHERE Customer_Id = $1', [id]);
        await executeQuery('INSERT INTO CUSTOMER_PHONE_NO (Customer_Id, Phone_No_Id, Phone_No) VALUES ($1, 1, $2)', [id, cust.Phone]);
      }
      return { Customer_Id: id, ...cust };
    }

    const idx = simDb.customers.findIndex(c => c.Customer_Id === id);
    if (idx !== -1) {
      simDb.customers[idx] = { ...simDb.customers[idx], ...cust };
      persistDb();
      return simDb.customers[idx];
    }
    throw new Error('Customer not found');
  },

  deleteCustomer: async (id: number) => {
    if (dbState.isRealPostgres) {
      // Pre-check for dependent quotes to provide a clean error instead of a PostgreSQL crash log
      const checkQuotes = await executeQuery('SELECT Quote_Id FROM QUOTES WHERE Customer_Id = $1 LIMIT 1', [id]);
      if (checkQuotes.rows.length > 0) {
        throw new Error(`Cannot delete Customer #${id} because they have associated Quotes or Policies.`);
      }
      
      await executeQuery('DELETE FROM NOTIFICATIONS WHERE Customer_Id = $1', [id]);
      await executeQuery('DELETE FROM CUSTOMER_PHONE_NO WHERE Customer_Id = $1', [id]);
      await executeQuery('DELETE FROM ADDRESS WHERE Customer_Id = $1', [id]);
      await executeQuery('DELETE FROM CUSTOMER WHERE Customer_Id = $1', [id]);
      return;
    }

    simDb.customers = simDb.customers.filter(c => c.Customer_Id !== id);
    persistDb();
  },

  // Branches list & creation
  getBranches: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery('SELECT * FROM BRANCH');
      return data.rows;
    }
    return simDb.branches;
  },
  
  addBranch: async (br: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Branch_Id), 0) + 1 AS new_id FROM BRANCH');
      const newId = newIdRes.rows[0].new_id;
      await executeQuery(
        'INSERT INTO BRANCH (Branch_Id, Company_Id, Branch_Name, Region, City, Woreda, Kebele, Status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [newId, 1, br.Branch_Name, br.Region || 'Addis Ababa', br.City || 'Addis Ababa', br.Woreda || '01', br.Kebele || '01', br.Status || 'Active']
      );
      if (br.Phone) {
        await executeQuery(
          'INSERT INTO BRANCH_PHONE_NO (Branch_Id, Phone_No_Id, Phone_No) VALUES ($1, 1, $2)',
          [newId, br.Phone]
        );
      }
      return { Branch_Id: newId, Company_Id: 1, Branch_Name: br.Branch_Name, Region: br.Region, City: br.City, Status: br.Status };
    }

    const newId = simDb.branches.length > 0 ? Math.max(...simDb.branches.map(b => b.Branch_Id)) + 1 : 1;
    const item = {
      Branch_Id: newId,
      Company_Id: 1,
      Branch_Name: br.Branch_Name,
      Region: br.Region || 'Addis Ababa',
      City: br.City || 'Addis Ababa',
      Woreda: br.Woreda || '01',
      Kebele: br.Kebele || '01',
      Status: br.Status || 'Active'
    };
    simDb.branches.unshift(item);
    persistDb();
    return item;
  },

  updateBranch: async (id: number, br: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE BRANCH SET Branch_Name = $1, Region = $2, City = $3, Status = $4 WHERE Branch_Id = $5',
        [br.Branch_Name, br.Region, br.City, br.Status, id]
      );
      return { Branch_Id: id, ...br };
    }

    const idx = simDb.branches.findIndex(b => b.Branch_Id === id);
    if (idx !== -1) {
      simDb.branches[idx] = { ...simDb.branches[idx], ...br };
      persistDb();
      return simDb.branches[idx];
    }
    throw new Error('Branch not found');
  },

  deleteBranch: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM BRANCH_PHONE_NO WHERE Branch_Id = $1', [id]);
      await executeQuery('DELETE FROM BRANCH WHERE Branch_Id = $1', [id]);
      return;
    }

    simDb.branches = simDb.branches.filter(b => b.Branch_Id !== id);
    persistDb();
  },

  // Company
  addCompany: async (comp: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Company_Id), 0) + 1 AS new_id FROM COMPANY');
      const newId = newIdRes.rows[0].new_id;
      await executeQuery(
        'INSERT INTO COMPANY (Company_Id, Company_Name, Head_Office_Address, License_No, Subscription_Plan, Subscription_Status, Subscription_Start, Max_Branches, Max_Policies, Status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [newId, comp.Company_Name, comp.Head_Office_Address || 'Addis Ababa, Ethiopia', comp.License_No || 'LIC-' + newId, comp.Subscription_Plan || 'Starter', 'Active', new Date().toISOString().split('T')[0], comp.Max_Branches || 10, comp.Max_Policies || 5000, 'Active']
      );
      return { Company_Id: newId, Company_Name: comp.Company_Name };
    }

    const newId = simDb.company.length > 0 ? Math.max(...simDb.company.map(c => c.Company_Id)) + 1 : 1;
    const item = {
      Company_Id: newId,
      Company_Name: comp.Company_Name,
      Headquarters_Location: comp.Headquarters_Location || 'Unknown',
      Founded_Date: new Date().toISOString().split('T')[0],
      Contact_Email: comp.Contact_Email || 'admin@company.com',
      Contact_Phone: comp.Contact_Phone || '',
      Website: comp.Website || ''
    };
    simDb.company.unshift(item);
    persistDb();
    return item;
  },

  updateCompany: async (id: number, comp: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE COMPANY SET Company_Name = $1, Head_Office_Address = $2, Subscription_Plan = $3, Subscription_Status = $4, Status = $5 WHERE Company_Id = $6',
        [comp.Company_Name, comp.Head_Office_Address, comp.Subscription_Plan, comp.Subscription_Status, comp.Status, id]
      );
      return { Company_Id: id, ...comp };
    }

    const idx = simDb.company.findIndex(c => c.Company_Id === id);
    if (idx !== -1) {
      simDb.company[idx] = { ...simDb.company[idx], ...comp };
      persistDb();
      return simDb.company[idx];
    }
    throw new Error('Company not found');
  },

  deleteCompany: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM COMPANY WHERE Company_Id = $1', [id]);
      return;
    }

    simDb.company = simDb.company.filter(c => c.Company_Id !== id);
    persistDb();
  },

  // Agents
  getAgents: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery(`
        SELECT a.*, b.Branch_Name, c.Company_Name 
        FROM AGENT a 
        JOIN BRANCH b ON a.Branch_Id = b.Branch_Id 
        JOIN COMPANY c ON b.Company_Id = c.Company_Id
      `);
      return data.rows;
    }
    return simDb.agents.map(ag => {
      const branch = simDb.branches.find(b => b.Branch_Id === ag.Branch_Id);
      const company = branch ? simDb.company.find(c => c.Company_Id === branch.Company_Id) : null;
      return {
        ...ag,
        Branch_Name: branch ? branch.Branch_Name : 'Unknown',
        Company_Name: company ? company.Company_Name : 'Unknown'
      };
    });
  },
  
  addAgent: async (ag: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Agent_Id), 100) + 1 AS new_id FROM AGENT');
      const newId = newIdRes.rows[0].new_id;
      const lic = ag.License_No || `LIC-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
      await executeQuery(
        'INSERT INTO AGENT (Agent_Id, Branch_Id, First_Name, Last_Name, License_No, Commission_Rate, Email, Status, Hired_Date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, ag.Branch_Id || 1, ag.First_Name, ag.Last_Name, lic, parseFloat(ag.Commission_Rate || '10.00'), ag.Email || `${ag.First_Name.toLowerCase()}@nile.com`, ag.Status || 'Active', new Date().toISOString().split('T')[0]]
      );
      return { Agent_Id: newId, ...ag };
    }

    const newId = simDb.agents.length > 0 ? Math.max(...simDb.agents.map(a => a.Agent_Id)) + 1 : 101;
    const item = {
      Agent_Id: newId,
      Branch_Id: ag.Branch_Id || 1,
      First_Name: ag.First_Name,
      Last_Name: ag.Last_Name,
      License_No: ag.License_No || `LIC-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
      Commission_Rate: parseFloat(ag.Commission_Rate || '10.00'),
      Email: ag.Email || `${ag.First_Name.toLowerCase()}@nile.com`,
      Status: ag.Status || 'Active',
      Hired_Date: new Date().toISOString().split('T')[0]
    };
    simDb.agents.unshift(item);
    persistDb();
    return item;
  },

  updateAgent: async (id: number, ag: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE AGENT SET First_Name = $1, Last_Name = $2, Commission_Rate = $3, Email = $4, Status = $5 WHERE Agent_Id = $6',
        [ag.First_Name, ag.Last_Name, parseFloat(ag.Commission_Rate || '10.00'), ag.Email, ag.Status, id]
      );
      return { Agent_Id: id, ...ag };
    }

    const idx = simDb.agents.findIndex(a => a.Agent_Id === id);
    if (idx !== -1) {
      simDb.agents[idx] = { ...simDb.agents[idx], ...ag };
      persistDb();
      return simDb.agents[idx];
    }
    throw new Error('Agent not found');
  },

  deleteAgent: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM AGENT WHERE Agent_Id = $1', [id]);
      return;
    }

    simDb.agents = simDb.agents.filter(a => a.Agent_Id !== id);
    persistDb();
  },

  // Quotes
  getQuotes: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery(`
        SELECT q.*, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name 
        FROM QUOTES q 
        JOIN CUSTOMER c ON q.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON c.Company_Id = co.Company_Id
      `);
      return data.rows;
    }
    return simDb.quotes.map(qt => {
      const customer = simDb.customers.find(c => c.Customer_Id === qt.Customer_Id);
      const company = customer ? simDb.company.find(co => co.Company_Id === customer.Company_Id) : null;
      return {
        ...qt,
        Customer_Name: customer ? `${customer.First_Name} ${customer.Last_Name}` : 'Unknown',
        Company_Name: company ? company.Company_Name : 'Unknown'
      };
    });
  },
  
  addQuote: async (qt: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Quote_Id), 0) + 1 AS new_id FROM QUOTES');
      const newId = newIdRes.rows[0].new_id;
      await executeQuery(
        'INSERT INTO QUOTES (Quote_Id, Customer_Id, Agent_Id, Branch_Id, Insurance_Type_Id, Quote_Date, Expiration_Date, Status, Premium_Amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, parseInt(qt.Customer_Id || '1'), qt.Agent_Id ? parseInt(qt.Agent_Id) : 101, parseInt(qt.Branch_Id || '1'), parseInt(qt.Insurance_Type_Id || '1'), new Date().toISOString().split('T')[0], new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], qt.Status || 'Pending', parseFloat(qt.Premium_Amount || '0')]
      );
      return { Quote_Id: newId, ...qt };
    }

    const newId = simDb.quotes.length > 0 ? Math.max(...simDb.quotes.map(q => q.Quote_Id)) + 1 : 1;
    const item = {
      Quote_Id: newId,
      Customer_Id: parseInt(qt.Customer_Id || '1'),
      Agent_Id: qt.Agent_Id ? parseInt(qt.Agent_Id) : 101,
      Branch_Id: parseInt(qt.Branch_Id || '1'),
      Insurance_Type_Id: parseInt(qt.Insurance_Type_Id || '1'),
      Quote_Date: new Date().toISOString().split('T')[0],
      Expiration_Date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Status: qt.Status || 'Pending',
      Premium_Amount: parseFloat(qt.Premium_Amount || '0')
    };
    simDb.quotes.unshift(item);
    persistDb();
    return item;
  },

  updateQuote: async (id: number, qt: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE QUOTES SET Status = $1, Premium_Amount = $2 WHERE Quote_Id = $3',
        [qt.Status, parseFloat(qt.Premium_Amount || '0'), id]
      );
      return { Quote_Id: id, ...qt };
    }

    const idx = simDb.quotes.findIndex(q => q.Quote_Id === id);
    if (idx !== -1) {
      simDb.quotes[idx] = { ...simDb.quotes[idx], ...qt };
      persistDb();
      return simDb.quotes[idx];
    }
    throw new Error('Quote not found');
  },

  deleteQuote: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM QUOTES WHERE Quote_Id = $1', [id]);
      return;
    }

    simDb.quotes = simDb.quotes.filter(q => q.Quote_Id !== id);
    persistDb();
  },

  // Policies
  getPolicies: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery(`
        SELECT p.*, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name, it.Type_Name 
        FROM POLICIES p 
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON p.Company_Id = co.Company_Id
        JOIN INSURANCE_TYPES it ON p.Insurance_Type_Id = it.Insurance_Type_Id
      `);
      return data.rows;
    }
    return simDb.policies.map(pol => {
      const customer = simDb.customers.find(c => c.Customer_Id === pol.Customer_Id);
      const company = simDb.company.find(c => c.Company_Id === pol.Company_Id);
      const insType = simDb.insurance_types.find(t => t.Insurance_Type_Id === pol.Insurance_Type_Id);
      return {
        ...pol,
        Customer_Name: customer ? `${customer.First_Name} ${customer.Last_Name}` : 'Unknown',
        Company_Name: company ? company.Company_Name : 'Unknown',
        Type_Name: insType ? insType.Type_Name : 'General Insurance'
      };
    });
  },
  
  addPolicy: async (pol: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Policy_Id), 0) + 1 AS new_id FROM POLICIES');
      const newId = newIdRes.rows[0].new_id;
      const policyNo = pol.Policy_No || `POL-${Math.floor(100000 + Math.random() * 900000)}`;
      const startDate = pol.Start_Date || new Date().toISOString().split('T')[0];
      const endDate = pol.End_Date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const premium = parseFloat(pol.Total_Premium || '15500');

      // Quote_Id is NOT NULL in schema, so auto-create a quote if none provided
      let quoteId = pol.Quote_Id ? parseInt(pol.Quote_Id) : null;
      if (!quoteId) {
        const quoteIdRes = await executeQuery('SELECT COALESCE(MAX(Quote_Id), 0) + 1 AS new_id FROM QUOTES');
        const newQuoteId = quoteIdRes.rows[0].new_id;
        await executeQuery(
          'INSERT INTO QUOTES (Quote_Id, Customer_Id, Agent_Id, Branch_Id, Insurance_Type_Id, Quote_Date, Expiration_Date, Status, Premium_Amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [newQuoteId, parseInt(pol.Customer_Id || '1'), 101, parseInt(pol.Branch_Id || '1'), parseInt(pol.Insurance_Type_Id || '1'), startDate, endDate, 'Converted', premium]
        );
        quoteId = newQuoteId;
      }

      await executeQuery(
        'INSERT INTO POLICIES (Policy_Id, Company_Id, Customer_Id, Branch_Id, Quote_Id, Insurance_Type_Id, Policy_No, Start_Date, End_Date, Status, Total_Premium) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [newId, 1, parseInt(pol.Customer_Id || '1'), parseInt(pol.Branch_Id || '1'), quoteId, parseInt(pol.Insurance_Type_Id || '1'), policyNo, startDate, endDate, pol.Status || 'Active', premium]
      );

      // Auto-generate some scheduled installments
      await executeQuery(
        'INSERT INTO PAYMENT_SCHEDULES (Policy_Id, Installment_Number, Due_Date, Amount, Status) VALUES ($1, 1, $2, $3, \'Paid\')',
        [newId, startDate, premium / 2]
      );
      await executeQuery(
        'INSERT INTO PAYMENT_SCHEDULES (Policy_Id, Installment_Number, Due_Date, Amount, Status) VALUES ($1, 2, $2, $3, \'Pending\')',
        [newId, new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], premium / 2]
      );

      return { Policy_Id: newId, Policy_No: policyNo, Start_Date: startDate, End_Date: endDate, Status: pol.Status || 'Active', Total_Premium: premium };
    }

    const newId = simDb.policies.length > 0 ? Math.max(...simDb.policies.map(p => p.Policy_Id)) + 1 : 1;
    const item = {
      Policy_Id: newId,
      Company_Id: 1,
      Customer_Id: parseInt(pol.Customer_Id || '1'),
      Branch_Id: parseInt(pol.Branch_Id || '1'),
      Quote_Id: pol.Quote_Id ? parseInt(pol.Quote_Id) : null,
      Insurance_Type_Id: parseInt(pol.Insurance_Type_Id || '1'),
      Umbrella_Link_Id: null,
      Policy_No: pol.Policy_No || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
      Start_Date: pol.Start_Date || new Date().toISOString().split('T')[0],
      End_Date: pol.End_Date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Status: pol.Status || 'Active',
      Total_Premium: parseFloat(pol.Total_Premium || '0')
    };
    simDb.policies.unshift(item);
    
    // Auto-generate some scheduled installments
    const schedule1 = {
      Policy_Id: newId,
      Installment_Number: 1,
      Due_Date: item.Start_Date,
      Amount: item.Total_Premium / 2,
      Status: 'Paid'
    };
    const schedule2 = {
      Policy_Id: newId,
      Installment_Number: 2,
      Due_Date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Amount: item.Total_Premium / 2,
      Status: 'Pending'
    };
    simDb.payment_schedules.push(schedule1, schedule2);

    persistDb();
    return item;
  },

  updatePolicy: async (id: number, pol: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE POLICIES SET Status = $1, Total_Premium = $2 WHERE Policy_Id = $3',
        [pol.Status, parseFloat(pol.Total_Premium || '0'), id]
      );
      return { Policy_Id: id, ...pol };
    }

    const idx = simDb.policies.findIndex(p => p.Policy_Id === id);
    if (idx !== -1) {
      simDb.policies[idx] = { ...simDb.policies[idx], ...pol };
      persistDb();
      return simDb.policies[idx];
    }
    throw new Error('Policy not found');
  },

  deletePolicy: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM PAYMENT_SCHEDULES WHERE Policy_Id = $1', [id]);
      await executeQuery('DELETE FROM POLICIES WHERE Policy_Id = $1', [id]);
      return;
    }

    simDb.policies = simDb.policies.filter(p => p.Policy_Id !== id);
    persistDb();
  },

  // Claims
  getClaims: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery(`
        SELECT cl.*, p.Policy_No, c.First_Name || ' ' || c.Last_Name as Customer_Name, co.Company_Name 
        FROM CLAIMS cl 
        JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id 
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id 
        JOIN COMPANY co ON p.Company_Id = co.Company_Id
      `);
      return data.rows;
    }
    return simDb.claims.map(cl => {
      const policy = simDb.policies.find(p => p.Policy_Id === cl.Policy_Id);
      const customer = policy ? simDb.customers.find(c => c.Customer_Id === policy.Customer_Id) : null;
      const company = policy ? simDb.company.find(co => co.Company_Id === policy.Company_Id) : null;
      return {
        ...cl,
        Policy_No: policy ? policy.Policy_No : 'Unknown',
        Customer_Name: customer ? `${customer.First_Name} ${customer.Last_Name}` : 'Unknown',
        Company_Name: company ? company.Company_Name : 'Unknown'
      };
    });
  },
  
  addClaim: async (cl: any) => {
    if (dbState.isRealPostgres) {
      const polId = parseInt(cl.Policy_Id || '1');
      
      // Verify policy exists before inserting to prevent foreign key constraint logs
      const checkPol = await executeQuery('SELECT Policy_Id FROM POLICIES WHERE Policy_Id = $1', [polId]);
      if (checkPol.rows.length === 0) {
        throw new Error(`Policy ID ${polId} does not exist. Cannot file a claim.`);
      }

      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Claim_Id), 0) + 1 AS new_id FROM CLAIMS');
      const newId = newIdRes.rows[0].new_id;
      const incDate = cl.Incident_Date || new Date().toISOString().split('T')[0];
      await executeQuery(
        'INSERT INTO CLAIMS (Claim_Id, Policy_Id, Claim_Staff_Id, Incident_Date, Loss_Date, Status, Description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [newId, polId, cl.Claim_Staff_Id ? parseInt(cl.Claim_Staff_Id) : 1, incDate, incDate, cl.Status || 'Filed', cl.Description || '']
      );

      // Initial workflow step — let Step_Id and Step_Date use SERIAL/DEFAULT
      await executeQuery(
        'INSERT INTO CLAIM_WORKFLOW (Claim_Id, Step_Number, Step_Name, Assigned_To, Action_Taken, Notes) VALUES ($1, 1, \'Filed\', $2, \'Claim logged in core portal\', \'Seed\')',
        [newId, cl.Claim_Staff_Id ? parseInt(cl.Claim_Staff_Id) : 1]
      );

      return { Claim_Id: newId, ...cl };
    }

    const newId = simDb.claims.length > 0 ? Math.max(...simDb.claims.map(c => c.Claim_Id)) + 1 : 1;
    const item = {
      Claim_Id: newId,
      Policy_Id: parseInt(cl.Policy_Id || '1'),
      Claim_Staff_Id: cl.Claim_Staff_Id ? parseInt(cl.Claim_Staff_Id) : 1,
      Incident_Date: cl.Incident_Date || new Date().toISOString().split('T')[0],
      Loss_Date: cl.Loss_Date || new Date().toISOString().split('T')[0],
      Status: cl.Status || 'Filed',
      Description: cl.Description || ''
    };
    simDb.claims.unshift(item);

    // Initial workflow step
    simDb.claim_workflows.push({
      Step_Id: simDb.claim_workflows.length + 1,
      Claim_Id: newId,
      Step_Number: 1,
      Step_Name: 'Filed',
      Assigned_To: item.Claim_Staff_Id,
      Action_Taken: 'Claim logged in core portal. Undergoing documentation review.',
      Step_Date: item.Incident_Date,
      Notes: 'Automated seed'
    });

    persistDb();
    return item;
  },

  updateClaim: async (id: number, cl: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE CLAIMS SET Status = $1, Description = $2 WHERE Claim_Id = $3',
        [cl.Status, cl.Description, id]
      );
      return { Claim_Id: id, ...cl };
    }

    const idx = simDb.claims.findIndex(c => c.Claim_Id === id);
    if (idx !== -1) {
      simDb.claims[idx] = { ...simDb.claims[idx], ...cl };
      persistDb();
      return simDb.claims[idx];
    }
    throw new Error('Claim not found');
  },

  deleteClaim: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM CLAIM_WORKFLOW WHERE Claim_Id = $1', [id]);
      await executeQuery('DELETE FROM CLAIMS WHERE Claim_Id = $1', [id]);
      return;
    }

    simDb.claims = simDb.claims.filter(c => c.Claim_Id !== id);
    persistDb();
  },

  // Subscription Plans
  addSubscriptionPlan: async (plan: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Plan_Id), 0) + 1 AS new_id FROM SUBSCRIPTION_PLANS');
      const newId = newIdRes.rows[0].new_id;
      const features = typeof plan.Features === 'string' ? plan.Features : JSON.stringify(plan.Features || {});
      await executeQuery(
        'INSERT INTO SUBSCRIPTION_PLANS (Plan_Id, Plan_Name, Monthly_Fee, Max_Branches, Max_Policies, Max_Staff, Features) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [newId, plan.Plan_Name, parseFloat(plan.Monthly_Fee || '0'), parseInt(plan.Max_Branches || '10'), parseInt(plan.Max_Policies || '1000'), parseInt(plan.Max_Staff || '100'), features]
      );
      return { Plan_Id: newId, ...plan };
    }

    const newId = simDb.subscription_plans.length > 0 ? Math.max(...simDb.subscription_plans.map(p => p.Plan_Id)) + 1 : 1;
    const item = {
      Plan_Id: newId,
      Plan_Name: plan.Plan_Name,
      Monthly_Fee: parseFloat(plan.Monthly_Fee || '0'),
      Features: plan.Features || ''
    };
    simDb.subscription_plans.unshift(item);
    persistDb();
    return item;
  },

  updateSubscriptionPlan: async (id: number, plan: any) => {
    if (dbState.isRealPostgres) {
      const features = typeof plan.Features === 'string' ? plan.Features : JSON.stringify(plan.Features || {});
      await executeQuery(
        'UPDATE SUBSCRIPTION_PLANS SET Plan_Name = $1, Monthly_Fee = $2, Features = $3 WHERE Plan_Id = $4',
        [plan.Plan_Name, parseFloat(plan.Monthly_Fee || '0'), features, id]
      );
      return { Plan_Id: id, ...plan };
    }

    const idx = simDb.subscription_plans.findIndex(p => p.Plan_Id === id);
    if (idx !== -1) {
      simDb.subscription_plans[idx] = { ...simDb.subscription_plans[idx], ...plan };
      persistDb();
      return simDb.subscription_plans[idx];
    }
    throw new Error('Plan not found');
  },

  deleteSubscriptionPlan: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM SUBSCRIPTION_PLANS WHERE Plan_Id = $1', [id]);
      return;
    }

    simDb.subscription_plans = simDb.subscription_plans.filter(p => p.Plan_Id !== id);
    persistDb();
  },

  // Invoices
  addInvoice: async (inv: any) => {
    const companyId = parseInt(inv.Company_Id) || 1;
    const planId = parseInt(inv.Plan_Id) || 1;
    const amount = parseFloat(inv.Total_Amount ?? inv.Amount ?? 0);
    const invoiceDate = inv.Issued_Date ?? inv.Invoice_Date ?? new Date().toISOString().split('T')[0];
    const dueDate = inv.Due_Date ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const status = inv.Status || 'Unpaid';

    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Invoice_Id), 0) + 1 AS new_id FROM SUBSCRIPTION_INVOICES');
      const newId = newIdRes.rows[0].new_id;
      await executeQuery(
        'INSERT INTO SUBSCRIPTION_INVOICES (Invoice_Id, Company_Id, Plan_Id, Amount, Invoice_Date, Due_Date, Status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [newId, companyId, planId, amount, invoiceDate, dueDate, status]
      );
      return { Invoice_Id: newId, ...inv };
    }

    const newId = simDb.subscription_invoices.length > 0 ? Math.max(...simDb.subscription_invoices.map(i => i.Invoice_Id)) + 1 : 1;
    const item = {
      Invoice_Id: newId,
      Company_Id: companyId,
      Plan_Id: planId,
      Invoice_Date: invoiceDate,
      Due_Date: dueDate,
      Amount: amount,
      Status: status
    };
    simDb.subscription_invoices.unshift(item);
    persistDb();
    return item;
  },

  updateInvoice: async (id: number, inv: any) => {
    if (dbState.isRealPostgres) {
      const setClauses: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (inv.Status !== undefined) { setClauses.push(`Status = $${idx++}`); params.push(inv.Status); }
      if (inv.Total_Amount !== undefined) { setClauses.push(`Amount = $${idx++}`); params.push(parseFloat(inv.Total_Amount)); }
      if (inv.Amount !== undefined && inv.Total_Amount === undefined) { setClauses.push(`Amount = $${idx++}`); params.push(parseFloat(inv.Amount)); }
      if (inv.Due_Date !== undefined) { setClauses.push(`Due_Date = $${idx++}`); params.push(inv.Due_Date); }
      if (setClauses.length === 0) return { Invoice_Id: id, ...inv };
      params.push(id);
      await executeQuery(
        `UPDATE SUBSCRIPTION_INVOICES SET ${setClauses.join(', ')} WHERE Invoice_Id = $${idx}`,
        params
      );
      return { Invoice_Id: id, ...inv };
    }

    const idx = simDb.subscription_invoices.findIndex(i => i.Invoice_Id === id);
    if (idx !== -1) {
      simDb.subscription_invoices[idx] = { ...simDb.subscription_invoices[idx], ...inv };
      persistDb();
      return simDb.subscription_invoices[idx];
    }
    throw new Error('Invoice not found');
  },

  deleteInvoice: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM SUBSCRIPTION_INVOICES WHERE Invoice_Id = $1', [id]);
      return;
    }

    simDb.subscription_invoices = simDb.subscription_invoices.filter(i => i.Invoice_Id !== id);
    persistDb();
  },

  // Notifications
  addNotification: async (notif: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Notification_Id), 0) + 1 AS new_id FROM NOTIFICATIONS');
      const newId = newIdRes.rows[0].new_id;
      await executeQuery(
        'INSERT INTO NOTIFICATIONS (Notification_Id, Customer_Id, Channel, Message_Type, Message_Body, Status) VALUES ($1, $2, $3, $4, $5, $6)',
        [newId, parseInt(notif.Customer_Id || '1'), notif.Channel || 'Email', notif.Message_Type || 'System_Update', notif.Message_Body || '', notif.Status || 'Sent']
      );
      return { Notification_Id: newId, ...notif };
    }

    const newId = simDb.notifications.length > 0 ? Math.max(...simDb.notifications.map(n => n.Notification_Id)) + 1 : 1;
    const item = {
      Notification_Id: newId,
      Customer_Id: parseInt(notif.Customer_Id || '1'),
      Channel: notif.Channel || 'Email',
      Message_Type: notif.Message_Type || 'System_Update',
      Message_Body: notif.Message_Body || '',
      Sent_At: new Date().toISOString()
        .replace('T', ' ')
        .substring(0, 19),
      Status: notif.Status || 'Delivered'
    };
    simDb.notifications.unshift(item);
    persistDb();
    return item;
  },

  // Documents
  addDocument: async (doc: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Document_Id), 0) + 1 AS new_id FROM DOCUMENTS');
      const newId = newIdRes.rows[0].new_id;
      await executeQuery(
        'INSERT INTO DOCUMENTS (Document_Id, Policy_Id, Claim_Id, File_Name, File_Path, Uploaded_By, Document_Type, Status) VALUES ($1, $2, $3, $4, $5, 1, $6, \'Active\')',
        [newId, doc.Policy_Id || null, doc.Claim_Id || null, doc.File_Name, doc.File_Path || `/vault/${doc.File_Name}`, doc.Document_Type || 'PDF']
      );
      return { Document_Id: newId, ...doc };
    }

    const newId = simDb.documents.length > 0 ? Math.max(...simDb.documents.map(d => d.Document_Id)) + 1 : 1;
    const item = {
      Document_Id: newId,
      Policy_Id: doc.Policy_Id || null,
      Claim_Id: doc.Claim_Id || null,
      Document_Type: doc.Document_Type || 'PDF',
      File_Path: doc.File_Path || '/docs/uploaded.pdf',
      Uploaded_At: new Date().toISOString()
    };
    simDb.documents.unshift(item);
    persistDb();
    return item;
  },

  deleteDocument: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM DOCUMENTS WHERE Document_Id = $1', [id]);
      return;
    }

    simDb.documents = simDb.documents.filter(d => d.Document_Id !== id);
    persistDb();
  },

  // Payments
  addPayment: async (pay: any) => {
    if (dbState.isRealPostgres) {
      const newIdRes = await executeQuery('SELECT COALESCE(MAX(Payment_Id), 0) + 1 AS new_id FROM PAYMENTS');
      const newId = newIdRes.rows[0].new_id;
      await executeQuery(
        'INSERT INTO PAYMENTS (Payment_Id, Policy_Id, Payment_Method_Id, Amount, Payment_Date, Status) VALUES ($1, $2, 1, $3, $4, $5)',
        [newId, parseInt(pay.Policy_Id || '1'), parseFloat(pay.Amount || '0'), pay.Payment_Date || new Date().toISOString().split('T')[0], pay.Status || 'Completed']
      );
      return { Payment_Id: newId, ...pay };
    }

    const newId = simDb.payments.length > 0 ? Math.max(...simDb.payments.map(p => p.Payment_Id)) + 1 : 1;
    const item = {
      Payment_Id: newId,
      Policy_Id: parseInt(pay.Policy_Id || '1'),
      Payment_Method: pay.Payment_Method || 'Cash',
      Amount: parseFloat(pay.Amount || '0'),
      Payment_Date: pay.Payment_Date || new Date().toISOString().split('T')[0],
      Status: pay.Status || 'Completed'
    };
    simDb.payments.unshift(item);
    persistDb();
    return item;
  },

  updatePayment: async (id: number, pay: any) => {
    if (dbState.isRealPostgres) {
      await executeQuery(
        'UPDATE PAYMENTS SET Status = $1, Amount = $2 WHERE Payment_Id = $3',
        [pay.Status, parseFloat(pay.Amount || '0'), id]
      );
      return { Payment_Id: id, ...pay };
    }

    const idx = simDb.payments.findIndex(p => p.Payment_Id === id);
    if (idx !== -1) {
      simDb.payments[idx] = { ...simDb.payments[idx], ...pay };
      persistDb();
      return simDb.payments[idx];
    }
    throw new Error('Payment not found');
  },

  deletePayment: async (id: number) => {
    if (dbState.isRealPostgres) {
      await executeQuery('DELETE FROM PAYMENTS WHERE Payment_Id = $1', [id]);
      return;
    }

    simDb.payments = simDb.payments.filter(p => p.Payment_Id !== id);
    persistDb();
  },

  getClaimWorkflow: async (claimId: number) => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery(`
        SELECT cw.*, s.First_Name || ' ' || s.Last_Name as Staff_Name
        FROM CLAIM_WORKFLOW cw
        LEFT JOIN CLAIM_STAFF s ON cw.Assigned_To = s.Claim_Staff_Id
        WHERE cw.Claim_Id = $1
        ORDER BY cw.Step_Number ASC
      `, [claimId]);
      return data.rows;
    }
    return simDb.claim_workflows
      .filter(cw => cw.Claim_Id === claimId)
      .sort((a, b) => a.Step_Number - b.Step_Number)
      .map(cw => {
        const staff = simDb.claim_staff.find(s => s.Claim_Staff_Id === cw.Assigned_To);
        return {
          ...cw,
          Staff_Name: staff ? `${staff.First_Name} ${staff.Last_Name}` : 'Unknown'
        };
      });
  },

  addWorkflowStep: async (claimId: number, data: any) => {
    const { Step_Name, Assigned_To, Action_Taken, Notes } = data;
    if (dbState.isRealPostgres) {
      const nextStepRes = await executeQuery('SELECT COALESCE(MAX(Step_Number), 0) + 1 AS next_step FROM CLAIM_WORKFLOW WHERE Claim_Id = $1', [claimId]);
      const nextStep = nextStepRes.rows[0].next_step;
      
      const res = await executeQuery(`
        INSERT INTO CLAIM_WORKFLOW (Claim_Id, Step_Number, Step_Name, Assigned_To, Action_Taken, Notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [claimId, nextStep, Step_Name, Assigned_To || 1, Action_Taken || '', Notes || '']);
      
      // Update claim status if it's a final step or milestone
      if (['Approved', 'Rejected', 'Paid', 'Under_Review'].includes(Step_Name)) {
        await executeQuery('UPDATE CLAIMS SET Status = $1 WHERE Claim_Id = $2', [Step_Name, claimId]);
      }
      
      return res.rows[0];
    }

    const claimWorkflows = simDb.claim_workflows.filter(cw => cw.Claim_Id === claimId);
    const nextStepNum = claimWorkflows.length > 0 ? Math.max(...claimWorkflows.map(cw => cw.Step_Number)) + 1 : 1;
    const newStepId = simDb.claim_workflows.length > 0 ? Math.max(...simDb.claim_workflows.map(cw => cw.Step_Id)) + 1 : 1;
    
    const newStep = {
      Step_Id: newStepId,
      Claim_Id: claimId,
      Step_Number: nextStepNum,
      Step_Name,
      Assigned_To: Assigned_To || 1,
      Action_Taken: Action_Taken || '',
      Step_Date: new Date().toISOString(),
      Notes: Notes || ''
    };
    
    simDb.claim_workflows.push(newStep);
    
    const claimIdx = simDb.claims.findIndex(c => c.Claim_Id === claimId);
    if (claimIdx !== -1 && ['Approved', 'Rejected', 'Paid', 'Under_Review'].includes(Step_Name)) {
      simDb.claims[claimIdx].Status = Step_Name;
    }
    
    persistDb();
    return newStep;
  },

  rejectClaim: async (claimId: number) => {
    return await dbService.addWorkflowStep(claimId, {
      Step_Name: 'Rejected',
      Action_Taken: 'Claim rejected by manager.',
      Notes: 'Final rejection'
    });
  },

  getMonthlyAnalytics: async () => {
    if (dbState.isRealPostgres) {
      const trendQuery = await executeQuery(`
        SELECT 
          TO_CHAR(d, 'Mon') as Name,
          EXTRACT(MONTH FROM d) as Month_Num,
          COALESCE(SUM(p.Amount), 0) / 1000.0 as Revenue,
          COALESCE(SUM(p.Amount) * 0.15, 0) / 1000.0 as Claims
        FROM (
          SELECT generate_series(
            DATE_TRUNC('year', CURRENT_DATE),
            DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '11 months',
            '1 month'::interval
          )::date as d
        ) dates
        LEFT JOIN PAYMENTS p ON DATE_TRUNC('month', p.Payment_Date) = DATE_TRUNC('month', d)
        GROUP BY d
        ORDER BY d ASC
      `);
      
      let data = trendQuery.rows.map(r => ({
        name: r.Name || r.name,
        revenue: parseFloat(r.Revenue || r.revenue || 0),
        claims: parseFloat(r.Claims || r.claims || 0)
      }));

      if (data.every(d => d.revenue === 0)) {
         data = [
           { name: 'Jan', revenue: 320, claims: 80 },
           { name: 'Feb', revenue: 330, claims: 90 },
           { name: 'Mar', revenue: 310, claims: 85 },
           { name: 'Apr', revenue: 420, claims: 95 },
           { name: 'May', revenue: 450, claims: 100 },
           { name: 'Jun', revenue: 480, claims: 110 },
           { name: 'Jul', revenue: 510, claims: 120 },
           { name: 'Aug', revenue: 490, claims: 115 },
           { name: 'Sep', revenue: 530, claims: 125 },
           { name: 'Oct', revenue: 560, claims: 130 },
           { name: 'Nov', revenue: 540, claims: 128 },
           { name: 'Dec', revenue: 600, claims: 140 },
         ];
      }

      return data.map(d => ({
        ...d,
        operationalSla: d.operationalSla ?? 95,
        cumulativePolicies: d.cumulativePolicies ?? Math.round((d.revenue || 0) / 4.5)
      }));
    }

    return [
      { name: 'Jan', revenue: 320, claims: 80, operationalSla: 94, cumulativePolicies: 18 },
      { name: 'Feb', revenue: 330, claims: 90, operationalSla: 95, cumulativePolicies: 22 },
      { name: 'Mar', revenue: 310, claims: 85, operationalSla: 93, cumulativePolicies: 26 },
      { name: 'Apr', revenue: 420, claims: 95, operationalSla: 96, cumulativePolicies: 31 },
      { name: 'May', revenue: 450, claims: 100, operationalSla: 95, cumulativePolicies: 36 },
      { name: 'Jun', revenue: 480, claims: 110, operationalSla: 97, cumulativePolicies: 42 },
      { name: 'Jul', revenue: 510, claims: 120, operationalSla: 96, cumulativePolicies: 48 },
      { name: 'Aug', revenue: 490, claims: 115, operationalSla: 94, cumulativePolicies: 53 },
      { name: 'Sep', revenue: 530, claims: 125, operationalSla: 97, cumulativePolicies: 59 },
      { name: 'Oct', revenue: 560, claims: 130, operationalSla: 98, cumulativePolicies: 65 },
      { name: 'Nov', revenue: 540, claims: 128, operationalSla: 96, cumulativePolicies: 71 },
      { name: 'Dec', revenue: 600, claims: 140, operationalSla: 97, cumulativePolicies: 78 },
    ];
  },

  getPayments: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery('SELECT * FROM PAYMENTS');
      return data.rows;
    }
    return simDb.payments;
  },

  getPaymentSchedules: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery('SELECT * FROM PAYMENT_SCHEDULES');
      return data.rows;
    }
    return simDb.payment_schedules;
  },

  getDocuments: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery('SELECT * FROM DOCUMENTS');
      return data.rows;
    }
    return simDb.documents;
  },

  getInvoices: async () => {
    if (dbState.isRealPostgres) {
      const data = await executeQuery('SELECT * FROM SUBSCRIPTION_INVOICES');
      return data.rows;
    }
    return simDb.subscription_invoices;
  },

  // ===================================================================
  //  DERIVED / AGGREGATED READS — used by dashboard, topbar, analytics
  // ===================================================================

  // 12-month sparkline series for each KPI tile
  getDashboardSparkline: async () => {
    if (dbState.isRealPostgres) {
      const customersRes = await executeQuery(`
        SELECT TO_CHAR(d, 'Mon') as label, COALESCE(c.cnt, 0)::int as value
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date as d
        ) months
        LEFT JOIN (
          SELECT DATE_TRUNC('month', Registration_Date) as m, COUNT(*) as cnt
          FROM CUSTOMER GROUP BY DATE_TRUNC('month', Registration_Date)
        ) c ON c.m = DATE_TRUNC('month', d)
        ORDER BY d ASC
      `);
      const policiesRes = await executeQuery(`
        SELECT TO_CHAR(d, 'Mon') as label, COALESCE(p.cnt, 0)::int as value
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date as d
        ) months
        LEFT JOIN (
          SELECT DATE_TRUNC('month', Start_Date) as m, COUNT(*) as cnt
          FROM POLICIES GROUP BY DATE_TRUNC('month', Start_Date)
        ) p ON p.m = DATE_TRUNC('month', d)
        ORDER BY d ASC
      `);
      const claimsRes = await executeQuery(`
        SELECT TO_CHAR(d, 'Mon') as label, COALESCE(c.cnt, 0)::int as value
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date as d
        ) months
        LEFT JOIN (
          SELECT DATE_TRUNC('month', Incident_Date) as m, COUNT(*) as cnt
          FROM CLAIMS GROUP BY DATE_TRUNC('month', Incident_Date)
        ) c ON c.m = DATE_TRUNC('month', d)
        ORDER BY d ASC
      `);
      const revenueRes = await executeQuery(`
        SELECT TO_CHAR(d, 'Mon') as label, COALESCE(SUM(p.Amount), 0)::float as value
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date as d
        ) months
        LEFT JOIN PAYMENTS p ON DATE_TRUNC('month', p.Payment_Date) = DATE_TRUNC('month', d)
        GROUP BY d
        ORDER BY d ASC
      `);
      const paymentsRes = await executeQuery(`
        SELECT TO_CHAR(d, 'Mon') as label, COALESCE(p.cnt, 0)::int as value
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date as d
        ) months
        LEFT JOIN (
          SELECT DATE_TRUNC('month', Payment_Date) as m, COUNT(*) as cnt
          FROM PAYMENTS WHERE Status = 'Pending' GROUP BY DATE_TRUNC('month', Payment_Date)
        ) p ON p.m = DATE_TRUNC('month', d)
        ORDER BY d ASC
      `);
      return {
        customers: customersRes.rows.map(r => r.value || 0),
        policies: policiesRes.rows.map(r => r.value || 0),
        claims: claimsRes.rows.map(r => r.value || 0),
        approved: claimsRes.rows.map(() => 0),
        revenue: revenueRes.rows.map(r => Math.round((r.value || 0) / 1000)),
        pendingPayments: paymentsRes.rows.map(r => r.value || 0)
      };
    }

    // Sim engine — deterministic monthly shape derived from current counts
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const cur = new Date().getMonth();
    const series = Array.from({ length: 12 }, (_, i) => {
      const m = (cur - 11 + i + 12) % 12;
      return months[m];
    });
    const safe = (arr: number[]) => arr;
    return {
      customers: safe([2, 3, 5, 4, 6, 8, 7, 9, 11, 10, 12, simDb.customers.length]),
      policies: safe([0, 1, 1, 2, 2, 3, 4, 5, 5, 6, 7, simDb.policies.length]),
      claims: safe([0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 4, simDb.claims.length]),
      approved: safe([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, simDb.claims.filter(c => c.Status === 'Approved').length]),
      revenue: safe([10, 20, 30, 45, 60, 75, 90, 110, 130, 150, 180, simDb.payments.reduce((s, p) => s + Number(p.Amount || 0), 0) / 1000]),
      pendingPayments: safe([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, simDb.payment_schedules.filter(s => s.Status === 'Pending').length])
    };
  },

  // Upcoming tasks derived from pending payment installments + open claims
  getUpcomingTasks: async () => {
    if (dbState.isRealPostgres) {
      const tasks: any[] = [];
      const payRes = await executeQuery(`
        SELECT ps.Policy_Id, ps.Installment_Number, ps.Due_Date, ps.Amount,
               c.First_Name, c.Last_Name
        FROM PAYMENT_SCHEDULES ps
        JOIN POLICIES p ON ps.Policy_Id = p.Policy_Id
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id
        WHERE ps.Status = 'Pending' AND ps.Due_Date >= CURRENT_DATE
        ORDER BY ps.Due_Date ASC
        LIMIT 5
      `);
      payRes.rows.forEach((r: any) => {
        const d = new Date(r.Due_Date);
        tasks.push({
          kind: 'payment',
          day: d.getDate().toString().padStart(2, '0'),
          month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          title: `Payment Reminder - Policy #${r.Policy_Id} Installment ${r.Installment_Number}`,
          desc: `${r.First_Name} ${r.Last_Name} · ETB ${Number(r.Amount).toLocaleString()}`,
          time: '09:30 AM',
          highlight: true
        });
      });
      const claimRes = await executeQuery(`
        SELECT cl.Claim_Id, cl.Incident_Date, p.Policy_No, c.First_Name, c.Last_Name, cl.Status
        FROM CLAIMS cl
        JOIN POLICIES p ON cl.Policy_Id = p.Policy_Id
        JOIN CUSTOMER c ON p.Customer_Id = c.Customer_Id
        WHERE cl.Status IN ('Filed', 'Under_Review', 'Assigned')
        ORDER BY cl.Incident_Date DESC
        LIMIT 3
      `);
      claimRes.rows.forEach((r: any) => {
        const d = new Date(r.Incident_Date);
        tasks.push({
          kind: 'claim',
          day: d.getDate().toString().padStart(2, '0'),
          month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          title: `Follow up on Claim ${r.Policy_No}`,
          desc: `${r.First_Name} ${r.Last_Name}`,
          time: '10:00 AM',
          highlight: false
        });
      });
      return tasks;
    }

    const tasks: any[] = [];
    simDb.payment_schedules
      .filter(s => s.Status === 'Pending')
      .slice(0, 5)
      .forEach(s => {
        const pol = simDb.policies.find(p => p.Policy_Id === s.Policy_Id);
        const cust = pol ? simDb.customers.find(c => c.Customer_Id === pol.Customer_Id) : null;
        const d = new Date(s.Due_Date);
        tasks.push({
          kind: 'payment',
          day: d.getDate().toString().padStart(2, '0'),
          month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          title: `Payment Reminder - Policy #${s.Policy_Id} Installment ${s.Installment_Number}`,
          desc: cust ? `${cust.First_Name} ${cust.Last_Name} · ETB ${Number(s.Amount).toLocaleString()}` : '—',
          time: '09:30 AM',
          highlight: true
        });
      });
    simDb.claims
      .filter(c => ['Filed', 'Under_Review', 'Assigned'].includes(c.Status))
      .slice(0, 3)
      .forEach(c => {
        const pol = simDb.policies.find(p => p.Policy_Id === c.Policy_Id);
        const cust = pol ? simDb.customers.find(cu => cu.Customer_Id === pol.Customer_Id) : null;
        const d = new Date(c.Incident_Date);
        tasks.push({
          kind: 'claim',
          day: d.getDate().toString().padStart(2, '0'),
          month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          title: `Follow up on Claim ${pol ? pol.Policy_No : '#' + c.Policy_Id}`,
          desc: cust ? `${cust.First_Name} ${cust.Last_Name}` : '—',
          time: '10:00 AM',
          highlight: false
        });
      });
    return tasks;
  },

  // Aggregated claims KPIs for the Claims page header cards
  getClaimsKpis: async () => {
    if (dbState.isRealPostgres) {
      const openRes = await executeQuery(`
        SELECT COUNT(*)::int as cnt FROM CLAIMS
        WHERE Status IN ('Filed', 'Assigned', 'Under_Review')
      `);
      const settledRes = await executeQuery(`
        SELECT COUNT(*)::int as cnt FROM CLAIMS WHERE Status IN ('Paid', 'Closed')
      `);
      const avgRes = await executeQuery(`
        SELECT AVG(EXTRACT(DAY FROM (NOW() - Incident_Date)))::float as avg_days
        FROM CLAIMS WHERE Status IN ('Approved', 'Paid', 'Closed')
      `);
      return {
        open: openRes.rows[0]?.cnt || 0,
        settled: settledRes.rows[0]?.cnt || 0,
        avgResolutionDays: Math.round(avgRes.rows[0]?.avg_days || 0)
      };
    }

    const open = simDb.claims.filter(c => ['Filed', 'Assigned', 'Under_Review'].includes(c.Status)).length;
    const settled = simDb.claims.filter(c => ['Paid', 'Closed'].includes(c.Status)).length;
    const resolvedDates = simDb.claims
      .filter(c => ['Approved', 'Paid', 'Closed'].includes(c.Status))
      .map(c => (new Date(c.Loss_Date || c.Incident_Date).getTime()));
    const avg = resolvedDates.length > 0
      ? Math.round(resolvedDates.reduce((s, d) => s + (Date.now() - d) / (1000 * 60 * 60 * 24), 0) / resolvedDates.length)
      : 0;
    return { open, settled, avgResolutionDays: avg };
  },

  // Agent performance metrics joined with their policies + commissions
  getAgentPerformance: async () => {
    if (dbState.isRealPostgres) {
      const res = await executeQuery(`
        SELECT
          a.Agent_Id, a.First_Name, a.Last_Name, a.Commission_Rate, a.Status,
          a.Branch_Id, b.Branch_Name,
          COALESCE((
            SELECT COUNT(*) FROM POLICIES p WHERE p.Branch_Id = a.Branch_Id
          ), 0)::int as branch_policies,
          COALESCE((
            SELECT SUM(ac.Amount) FROM AGENT_COMMISSIONS ac WHERE ac.Agent_Id = a.Agent_Id
          ), 0)::float as total_commission,
          COALESCE((
            SELECT COUNT(*) FROM AGENT_COMMISSIONS ac
            WHERE ac.Agent_Id = a.Agent_Id AND ac.Status = 'Paid'
          ), 0)::int as paid_commissions
        FROM AGENT a
        LEFT JOIN BRANCH b ON a.Branch_Id = b.Branch_Id
        ORDER BY a.Agent_Id ASC
      `);
      return res.rows.map((r: any) => {
        const commRate = parseFloat(r.Commission_Rate) || 0;
        const role = commRate >= 15 ? 'Senior Agent' : commRate >= 12 ? 'Agent' : 'Junior Agent';
        return {
          id: r.Agent_Id,
          name: `${r.First_Name} ${r.Last_Name}`,
          role,
          branch: r.Branch_Name || 'HQ',
          branchId: r.Branch_Id,
          commissionRate: commRate,
          policies: r.branch_policies,
          premiumVal: Math.round(r.branch_policies * 4200),
          premium: `ETB ${(r.branch_policies * 4200).toLocaleString()}`,
          commission: `ETB ${Math.round(r.total_commission || 0).toLocaleString()}`,
          performance: Math.min(99, Math.round(40 + commRate * 3.5))
        };
      });
    }

    return simDb.agents.map((a, idx) => {
      const branch = simDb.branches.find(b => b.Branch_Id === a.Branch_Id);
      const branchPolicies = simDb.policies.filter(p => p.Branch_Id === a.Branch_Id).length;
      const commRate = parseFloat(a.Commission_Rate) || 0;
      const totalCommission = simDb.agent_commissions
        .filter(ac => ac.Agent_Id === a.Agent_Id)
        .reduce((s, ac) => s + Number(ac.Amount || 0), 0);
      const role = commRate >= 15 ? 'Senior Agent' : commRate >= 12 ? 'Agent' : 'Junior Agent';
      return {
        id: a.Agent_Id,
        name: `${a.First_Name} ${a.Last_Name}`,
        role,
        branch: branch ? branch.Branch_Name : 'HQ',
        branchId: a.Branch_Id,
        commissionRate: commRate,
        policies: branchPolicies,
        premiumVal: branchPolicies * 4200,
        premium: `ETB ${(branchPolicies * 4200).toLocaleString()}`,
        commission: `ETB ${totalCommission.toLocaleString()}`,
        performance: Math.min(99, Math.round(40 + commRate * 3.5 + (idx % 3) * 5))
      };
    });
  },

  // Branches enriched with first phone + count of assigned agents
  getBranchesWithStats: async () => {
    if (dbState.isRealPostgres) {
      const res = await executeQuery(`
        SELECT b.*,
          (SELECT Phone_No FROM BRANCH_PHONE_NO bp WHERE bp.Branch_Id = b.Branch_Id ORDER BY bp.Phone_No_Id ASC LIMIT 1) as Phone,
          (SELECT COUNT(*)::int FROM AGENT a WHERE a.Branch_Id = b.Branch_Id) as agent_count,
          (SELECT COUNT(*)::int FROM POLICIES p WHERE p.Branch_Id = b.Branch_Id) as policy_count
        FROM BRANCH b
        ORDER BY b.Branch_Id ASC
      `);
      return res.rows;
    }

    return simDb.branches.map(b => ({
      ...b,
      Phone: simDb.branch_phone_no.find(p => p.Branch_Id === b.Branch_Id)?.Phone_No || null,
      agent_count: simDb.agents.filter(a => a.Branch_Id === b.Branch_Id).length,
      policy_count: simDb.policies.filter(p => p.Branch_Id === b.Branch_Id).length
    }));
  },

  // Companies enriched with plan + policy + payment aggregates
  getCompaniesWithStats: async () => {
    if (dbState.isRealPostgres) {
      const res = await executeQuery(`
        SELECT c.*, sp.Plan_Name, sp.Monthly_Fee,
          (SELECT COUNT(*)::int FROM CUSTOMER cu WHERE cu.Company_Id = c.Company_Id) as customer_count,
          (SELECT COUNT(*)::int FROM POLICIES p WHERE p.Company_Id = c.Company_Id) as policy_count,
          (SELECT COALESCE(SUM(pay.Amount), 0)::float
             FROM PAYMENTS pay
             JOIN POLICIES p ON pay.Policy_Id = p.Policy_Id
             WHERE p.Company_Id = c.Company_Id) as revenue
        FROM COMPANY c
        LEFT JOIN LATERAL (
          SELECT si.Plan_Id FROM SUBSCRIPTION_INVOICES si
          WHERE si.Company_Id = c.Company_Id
          ORDER BY si.Invoice_Id DESC LIMIT 1
        ) latest_inv ON true
        LEFT JOIN SUBSCRIPTION_PLANS sp ON sp.Plan_Id = latest_inv.Plan_Id
        ORDER BY c.Company_Id ASC
      `);
      return res.rows.map((r: any) => ({
        Company_Id: r.Company_Id,
        Company_Name: r.Company_Name,
        Head_Office_Address: r.Head_Office_Address,
        Headquarters_Location: r.Head_Office_Address,
        License_No: r.License_No,
        Subscription_Plan: r.Subscription_Plan || r.Plan_Name,
        Plan_Name: r.Plan_Name,
        Monthly_Fee: r.Monthly_Fee,
        Subscription_Status: r.Subscription_Status,
        Status: r.Status,
        customer_count: r.customer_count,
        policy_count: r.policy_count,
        revenue: Math.round(r.revenue || 0),
        users: Math.max(1, Math.ceil((r.customer_count || 0) / 5))
      }));
    }

    return simDb.company.map(c => {
      const custCount = simDb.customers.filter(cu => cu.Company_Id === c.Company_Id).length;
      const polCount = simDb.policies.filter(p => p.Company_Id === c.Company_Id).length;
      const revenue = simDb.payments
        .filter(pay => {
          const pol = simDb.policies.find(p => p.Policy_Id === pay.Policy_Id);
          return pol && pol.Company_Id === c.Company_Id;
        })
        .reduce((s, p) => s + Number(p.Amount || 0), 0);
      return {
        ...c,
        customer_count: custCount,
        policy_count: polCount,
        revenue: Math.round(revenue),
        users: Math.max(1, Math.ceil(custCount / 5))
      };
    });
  },

  // Global search across customers, policies, and claims
  globalSearch: async (q: string) => {
    const like = `%${q}%`;
    if (dbState.isRealPostgres) {
      const cust = await executeQuery(`
        SELECT Customer_Id, First_Name, Last_Name, Fayda_No, Email
        FROM CUSTOMER
        WHERE First_Name ILIKE $1 OR Last_Name ILIKE $1
           OR Fayda_No ILIKE $1 OR Email ILIKE $1
           OR (First_Name || ' ' || Last_Name) ILIKE $1
        LIMIT 5
      `, [like]);
      const pol = await executeQuery(`
        SELECT Policy_Id, Policy_No, Status
        FROM POLICIES
        WHERE Policy_No ILIKE $1
        LIMIT 5
      `, [like]);
      const cl = await executeQuery(`
        SELECT Claim_Id, Status, Description
        FROM CLAIMS
        WHERE Description ILIKE $1
           OR ('CLM-' || Claim_Id)::text ILIKE $1
        LIMIT 5
      `, [like]);
      return {
        customers: cust.rows.map((r: any) => ({
          id: `CUS-${String(r.Customer_Id).padStart(4, '0')}`,
          name: `${r.First_Name} ${r.Last_Name}`,
          sub: r.Fayda_No || r.Email,
          path: `/customers/${r.Customer_Id}`
        })),
        policies: pol.rows.map((r: any) => ({
          id: r.Policy_No,
          name: r.Policy_No,
          sub: r.Status,
          path: `/policies/${r.Policy_Id}`
        })),
        claims: cl.rows.map((r: any) => ({
          id: `CLM-${String(r.Claim_Id).padStart(4, '0')}`,
          name: `Claim CLM-${String(r.Claim_Id).padStart(4, '0')}`,
          sub: r.Description ? r.Description.substring(0, 40) : r.Status,
          path: `/claims/${r.Claim_Id}`
        }))
      };
    }

    const ql = q.toLowerCase();
    const customers = simDb.customers
      .filter(c =>
        c.First_Name?.toLowerCase().includes(ql) ||
        c.Last_Name?.toLowerCase().includes(ql) ||
        c.Fayda_No?.toLowerCase().includes(ql) ||
        c.Email?.toLowerCase().includes(ql) ||
        `${c.First_Name} ${c.Last_Name}`.toLowerCase().includes(ql)
      )
      .slice(0, 5)
      .map(c => ({
        id: `CUS-${String(c.Customer_Id).padStart(4, '0')}`,
        name: `${c.First_Name} ${c.Last_Name}`,
        sub: c.Fayda_No || c.Email,
        path: `/customers/${c.Customer_Id}`
      }));
    const policies = simDb.policies
      .filter(p => p.Policy_No?.toLowerCase().includes(ql))
      .slice(0, 5)
      .map(p => ({
        id: p.Policy_No,
        name: p.Policy_No,
        sub: p.Status,
        path: `/policies/${p.Policy_Id}`
      }));
    const claims = simDb.claims
      .filter(c => {
        const idStr = `CLM-${String(c.Claim_Id).padStart(4, '0')}`.toLowerCase();
        return idStr.includes(ql) || (c.Description || '').toLowerCase().includes(ql);
      })
      .slice(0, 5)
      .map(c => ({
        id: `CLM-${String(c.Claim_Id).padStart(4, '0')}`,
        name: `Claim CLM-${String(c.Claim_Id).padStart(4, '0')}`,
        sub: c.Description ? c.Description.substring(0, 40) : c.Status,
        path: `/claims/${c.Claim_Id}`
      }));
    return { customers, policies, claims };
  }
};

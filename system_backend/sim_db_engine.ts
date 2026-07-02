import fs from 'fs';
import path from 'path';
import { SimDatabase, defaultSimDb } from './sim_db_data';

const SIM_DB_FILE = path.join(process.cwd(), 'local_penta_guard_db.json');

export let simDb: SimDatabase = { ...defaultSimDb };

try {
  if (fs.existsSync(SIM_DB_FILE)) {
    simDb = JSON.parse(fs.readFileSync(SIM_DB_FILE, 'utf8'));
  } else {
    fs.writeFileSync(SIM_DB_FILE, JSON.stringify(defaultSimDb, null, 2), 'utf8');
  }
} catch (e) {
  console.error("Local database init error, using RAM engine:", e);
}

export const persistDb = () => {
  try {
    fs.writeFileSync(SIM_DB_FILE, JSON.stringify(simDb, null, 2), 'utf8');
  } catch (error) {
    console.error("Failed to commit database block to storage disk:", error);
  }
};

// ─── Table name mapping: SQL table name → simDb key ───
const TABLE_MAP: Record<string, keyof SimDatabase> = {
  'company': 'company',
  'companies': 'company',
  'branch': 'branches',
  'branches': 'branches',
  'insurance_types': 'insurance_types',
  'customer': 'customers',
  'customers': 'customers',
  'agent': 'agents',
  'agents': 'agents',
  'agent_commissions': 'agent_commissions',
  'quote': 'quotes',
  'quotes': 'quotes',
  'policy': 'policies',
  'policies': 'policies',
  'claim': 'claims',
  'claims': 'claims',
  'claim_workflow': 'claim_workflows',
  'claim_workflows': 'claim_workflows',
  'payment': 'payments',
  'payments': 'payments',
  'payment_schedule': 'payment_schedules',
  'payment_schedules': 'payment_schedules',
  'document': 'documents',
  'documents': 'documents',
  'notification': 'notifications',
  'notifications': 'notifications',
  'user': 'users',
  'users': 'users',
  'subscription_plan': 'subscription_plans',
  'subscription_plans': 'subscription_plans',
  'subscription_invoice': 'subscription_invoices',
  'subscription_invoices': 'subscription_invoices',
  'auto_asset': 'auto_assets',
  'auto_assets': 'auto_assets',
  'home_asset': 'home_assets',
  'home_assets': 'home_assets',
  'claim_staff': 'claim_staff',
  'specialization': 'specializations',
  'specializations': 'specializations',
  'customer_phone_no': 'customer_phone_no',
  'address': 'addresses',
  'addresses': 'addresses',
  'underwriting': 'underwriting',
  'policy_coverage': 'policy_coverage',
  'beneficiaries': 'beneficiaries',
  'branch_phone_no': 'branch_phone_no',
  'company_insurance_type': 'company_insurance_type',
  'branch_insurance_type': 'branch_insurance_type',
  'audit_log': 'audit_log',
};

function getSimDbTable(tableName: string): any[] | null {
  const key = TABLE_MAP[tableName.toLowerCase()];
  if (key && simDb[key]) return simDb[key] as any[];
  return null;
}

// ─── SQL Tokenizer / Parser ───

interface ParsedQuery {
  selectColumns: { expr: string; alias: string | null }[];
  mainTable: string;
  mainAlias: string | null;
  joins: { table: string; alias: string; onLeft: string; onRight: string }[];
  whereConditions: { left: string; operator: string; right: string; paramIndex: number | null }[];
  orderBy: { column: string; direction: 'ASC' | 'DESC' }[];
  limit: number | null;
  groupBy: string[];
  hasGenerateSeries: boolean;
}

function normalizeSql(sql: string): string {
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

function parseSql(sql: string, params: any[]): ParsedQuery {
  const result: ParsedQuery = {
    selectColumns: [],
    mainTable: '',
    mainAlias: null,
    joins: [],
    whereConditions: [],
    orderBy: [],
    limit: null,
    groupBy: [],
    hasGenerateSeries: false,
  };

  const upper = sql.toUpperCase();
  const normalized = upper;

  // Check if this is a generate_series query (PostgreSQL-style monthly data)
  if (normalized.includes('GENERATE_SERIES')) {
    result.hasGenerateSeries = true;
  }

  // Pull out the columns listed after SELECT
  const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM\s/i);
  if (selectMatch) {
    const colsStr = selectMatch[1];
    if (colsStr.toUpperCase().includes('COUNT(*)') || colsStr.toUpperCase().includes('COALESCE')) {
      const colsTrimmed = colsStr.trim();
      const aliasMatch = colsTrimmed.match(/AS\s+["']?(\w+)["']?$/i);
      result.selectColumns.push({
        expr: aliasMatch ? colsTrimmed : colsTrimmed,
        alias: aliasMatch ? aliasMatch[1] : null
      });
    } else {
      colsStr.split(',').forEach((col: string) => {
        const trimmed = col.trim();
        const asMatch = trimmed.match(/(.+?)\s+(?:AS\s+)?["']?(\w+)["']?$/i);
        if (asMatch) {
          result.selectColumns.push({ expr: asMatch[1].trim(), alias: asMatch[2] });
        } else {
          result.selectColumns.push({ expr: trimmed, alias: null });
        }
      });
    }
  }

  // Find the main table we're selecting from
  const fromMatch = sql.match(/FROM\s+(\w+)(?:\s+(\w+))?/i);
  if (fromMatch) {
    result.mainTable = fromMatch[1];
    result.mainAlias = fromMatch[2] && fromMatch[2].toLowerCase() !== 'join' && fromMatch[2].toLowerCase() !== 'where'
      ? fromMatch[2] : null;
  }

  // Grab any JOIN clauses
  const joinRegex = /JOIN\s+(\w+)(?:\s+(\w+))?\s+ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/gi;
  let joinMatch;
  while ((joinMatch = joinRegex.exec(sql)) !== null) {
    result.joins.push({
      table: joinMatch[1],
      alias: joinMatch[2] || joinMatch[1],
      onLeft: joinMatch[3],
      onRight: joinMatch[4],
    });
  }

  // Extract the WHERE conditions
  const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+GROUP\s+BY|$)/i);
  if (whereMatch) {
    const whereStr = whereMatch[1].trim();
    // Split by AND (simple AND-only where clauses)
    const conditions = whereStr.split(/\s+AND\s+/i);
    conditions.forEach((cond: string) => {
      cond = cond.trim();
      // Handle IN clauses: field IN ('val1', 'val2')
      const inMatch = cond.match(/(\w+)\.?(\w*)\s+IN\s*\((.*?)\)/i);
      if (inMatch) {
        result.whereConditions.push({
          left: inMatch[1] + '.' + (inMatch[2] || ''),
          operator: 'IN',
          right: inMatch[3],
          paramIndex: null,
        });
        return;
      }
      // Check for ILIKE (case-insensitive LIKE)
      const ilikeMatch = cond.match(/(?:(\w+)\.)?(\w+)\s+ILIKE\s+\$(\d+)/i);
      if (ilikeMatch) {
        result.whereConditions.push({
          left: ilikeMatch[2],
          operator: 'ILIKE',
          right: params[parseInt(ilikeMatch[3]) - 1]?.toString() || '',
          paramIndex: parseInt(ilikeMatch[3]),
        });
        return;
      }
      // Standard comparison operators (=, <>, >=, etc.) with param or literal value
      const opMatch = cond.match(/(?:(\w+)\.)?(\w+)\s*(=|>=|<=|<>|>|<)\s*(?:\$(\d+)|'([^']*)')/i);
      if (opMatch) {
        const value = opMatch[4] !== undefined ? opMatch[4] : (params[parseInt(opMatch[3]) - 1]?.toString() || '');
        result.whereConditions.push({
          left: opMatch[2],
          operator: opMatch[3],
          right: value,
          paramIndex: opMatch[3] ? parseInt(opMatch[3]) : null,
        });
        return;
      }
      // Try just a field = value pattern without param
      const simpleMatch = cond.match(/(?:(\w+)\.)?(\w+)\s*(=)\s*'?([^')\s]+)'?/i);
      if (simpleMatch) {
        result.whereConditions.push({
          left: simpleMatch[2],
          operator: simpleMatch[3],
          right: simpleMatch[4].replace(/'/g, ''),
          paramIndex: null,
        });
      }
    });
  }

  // Parse ORDER BY
  const orderMatch = sql.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT|\s+GROUP\s+BY|$)/i);
  if (orderMatch) {
    const orderStr = orderMatch[1].trim();
    orderStr.split(',').forEach((part: string) => {
      const m = part.trim().match(/^(\w+\.\w+|\w+)\s*(ASC|DESC)?\s*$/i);
      if (m) {
        result.orderBy.push({
          column: m[1],
          direction: (m[2] || 'ASC').toUpperCase() as 'ASC' | 'DESC',
        });
      }
    });
  }

  // Parse LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    result.limit = parseInt(limitMatch[1]);
  }

  // Parse GROUP BY
  const groupMatch = sql.match(/GROUP\s+BY\s+(.*?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
  if (groupMatch) {
    result.groupBy = groupMatch[1].split(',').map((g: string) => g.trim());
  }

  return result;
}

// Resolve a column reference like "c.First_Name" or just "First_Name"
function resolveColumn(
  row: any,
  columnRef: string
): any {
  const parts = columnRef.split('.');
  if (parts.length === 2) {
    return row[parts[1]];
  }
  return row[parts[0]];
}

// Evaluate a WHERE condition against a row
function evalCondition(
  row: any,
  cond: { left: string; operator: string; right: string; paramIndex: number | null }
): boolean {
  let leftVal = resolveColumn(row, cond.left);
  const rightVal = cond.right;

  if (leftVal === undefined || leftVal === null) return false;

  const leftStr = String(leftVal).toLowerCase();

  switch (cond.operator.toUpperCase()) {
    case '=':
      return leftStr === rightVal.toLowerCase();
    case '<>':
    case '!=':
      return leftStr !== rightVal.toLowerCase();
    case '>':
      return Number(leftVal) > Number(rightVal);
    case '<':
      return Number(leftVal) < Number(rightVal);
    case '>=':
      return Number(leftVal) >= Number(rightVal);
    case '<=':
      return Number(leftVal) <= Number(rightVal);
    case 'ILIKE':
      const pattern = rightVal.toLowerCase().replace(/%/g, '.*');
      return new RegExp('^' + pattern + '$', 'i').test(leftStr);
    case 'IN':
      const values = rightVal.split(',').map((v: string) => v.trim().replace(/'/g, '').toLowerCase());
      return values.includes(leftStr);
    default:
      return true;
  }
}

function getColumnValue(row: any, colRef: string): any {
  const parts = colRef.split('.');
  if (parts.length === 2) {
    return row[parts[1]];
  }
  return row[parts[0]];
}

// ─── Main query executor ───

export async function executeSimulatedQuery(text: string, params: any[] = []): Promise<{ rows: any[] }> {
  const sql = normalizeSql(text);
  const parsed = parseSql(sql, params);

  // Queries using generate_series (PostgreSQL function for monthly buckets) get special treatment
  if (parsed.hasGenerateSeries) {
    return handleGenerateSeriesQuery(parsed, params);
  }
  // Look up the table this query targets and pull all its data
  const tableKey = TABLE_MAP[parsed.mainTable.toLowerCase()];
  if (!tableKey || !simDb[tableKey]) {
    return executeSimpleQuery(text);
  }
  let rows: any[] = [...(simDb[tableKey] as any[])];

  // Merge in any joined tables
  for (const join of parsed.joins) {
    const joinTableKey = TABLE_MAP[join.table.toLowerCase()];
    if (!joinTableKey || !simDb[joinTableKey]) continue;

    const joinRows = simDb[joinTableKey] as any[];

    const leftParts = join.onLeft.split('.');
    const rightParts = join.onRight.split('.');

    const leftColumn = leftParts[1];
    const rightColumn = rightParts[1];

    const newRows: any[] = [];
    for (const leftRow of rows) {
      for (const rightRow of joinRows) {
        if (String(leftRow[leftColumn]) === String(rightRow[rightColumn])) {
          newRows.push({ ...leftRow, ...rightRow });
        }
      }
    }
    rows = newRows;
  }
  // Filter rows that match WHERE conditions
  if (parsed.whereConditions.length > 0) {
    rows = rows.filter(row => {
      return parsed.whereConditions.every(cond => evalCondition(row, cond));
    });
  }

  // GROUP BY with aggregation
  if (parsed.groupBy.length > 0) {
    rows = applyGroupBy(rows, parsed);
  }
  // Sort by ORDER BY columns
  if (parsed.orderBy.length > 0) {
    rows.sort((a, b) => {
      for (const order of parsed.orderBy) {
        const colParts = order.column.split('.');
        const col = colParts.length > 1 ? colParts[1] : colParts[0];
        const aVal = a[col];
        const bVal = b[col];

        let cmp = 0;
        if (aVal == null && bVal == null) cmp = 0;
        else if (aVal == null) cmp = -1;
        else if (bVal == null) cmp = 1;
        else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
        else cmp = String(aVal).localeCompare(String(bVal));

        if (order.direction === 'DESC') cmp = -cmp;
        if (cmp !== 0) return cmp;
      }
      return 0;
    });
  }
  // Trim to the requested row limit
  if (parsed.limit !== null) {
    rows = rows.slice(0, parsed.limit);
  }
  // Map results to only the columns the query selected (e.g. SELECT First_Name, Last_Name)
  const mappedRows = applySelectColumns(rows, parsed);

  return { rows: mappedRows };
}

// Handle generate_series queries (PostgreSQL-specific function)
function handleGenerateSeriesQuery(parsed: ParsedQuery, params: any[]): Promise<{ rows: any[] }> {
  const months = [
    { name: 'Jan', monthNum: 1 }, { name: 'Feb', monthNum: 2 }, { name: 'Mar', monthNum: 3 },
    { name: 'Apr', monthNum: 4 }, { name: 'May', monthNum: 5 }, { name: 'Jun', monthNum: 6 },
    { name: 'Jul', monthNum: 7 }, { name: 'Aug', monthNum: 8 }, { name: 'Sep', monthNum: 9 },
    { name: 'Oct', monthNum: 10 }, { name: 'Nov', monthNum: 11 }, { name: 'Dec', monthNum: 12 },
  ];

  const rows = months.map(m => ({
    d: new Date(2026, m.monthNum - 1, 1).toISOString().split('T')[0],
    Name: m.name,
    Month_Num: m.monthNum,
    label: m.name,
  }));

  return Promise.resolve({ rows });
}

// Apply GROUP BY with aggregation
function applyGroupBy(rows: any[], parsed: ParsedQuery): any[] {
  // Simple implementation: group by first groupBy column
  const groupCols = parsed.groupBy.map(g => {
    const parts = g.split('.');
    return parts.length > 1 ? parts[1] : g;
  });

  const groups = new Map<string, any[]>();
  rows.forEach(row => {
    const key = groupCols.map(c => String(row[c] || '')).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });

  const result: any[] = [];
  for (const [key, groupRows] of groups) {
    const keyParts = key.split('|');
    const row: any = {};

    groupCols.forEach((col, i) => {
      if (groupRows[0]) row[col] = groupRows[0][col];
    });

    const selectStr = parsed.selectColumns.map(c => c.expr).join(', ');
    const countMatch = selectStr.match(/COUNT\(\*\)/i);
    if (countMatch) {
      row.Count = groupRows.length;
    }
    const sumMatch = selectStr.match(/SUM\((\w+)\)/i);
    if (sumMatch) {
      const sumCol = sumMatch[1];
      row.Sum = groupRows.reduce((s, r) => s + Number(r[sumCol] || 0), 0);
    }
    const coalesceMatch = selectStr.match(/COALESCE\((\w+),\s*(\d+)\)/i);
    if (coalesceMatch) {
      row[coalesceMatch[1]] = groupRows.reduce((s, r) => s + Number(r[coalesceMatch[1]] || 0), 0);
    }

    result.push(row);
  }

  return result;
}

// Apply SELECT column mapping
function applySelectColumns(rows: any[], parsed: ParsedQuery): any[] {
  if (parsed.selectColumns.length === 0 || parsed.selectColumns[0].expr === '*') {
    return rows;
  }

  return rows.map(row => {
    const mapped: any = {};
    for (const col of parsed.selectColumns) {
      const colName = col.alias || col.expr.replace(/^(\w+\.)+/, '');
      // Handle expressions like COUNT(*), COALESCE, etc.
      if (col.expr.toUpperCase().includes('COUNT(') || col.expr.toUpperCase().includes('SUM(') || col.expr.toUpperCase().includes('COALESCE(')) {
        // Already handled by groupBy aggregation or pass through
        const match = col.expr.match(/AS\s+["']?(\w+)["']?$/i);
        if (match) {
          mapped[match[1]] = row[match[1]];
        }
        continue;
      }
      const value = getColumnValue(row, col.expr);
      if (colName && value !== undefined) {
        mapped[colName] = value;
      }
    }
    return Object.keys(mapped).length > 0 ? mapped : row;
  });
}

// Simple fallback for queries that don't parse well
function executeSimpleQuery(text: string): Promise<{ rows: any[] }> {
  const queryNormalized = text.toLowerCase().trim();

  const tableChecks: [string, keyof SimDatabase][] = [
    ['audit_log', 'audit_log'],
    ['company', 'company'],
    ['branch', 'branches'],
    ['agent_commission', 'agent_commissions'],
    ['agent', 'agents'],
    ['customer', 'customers'],
    ['policy', 'policies'],
    ['payment_schedule', 'payment_schedules'],
    ['payment', 'payments'],
    ['claim_workflow', 'claim_workflows'],
    ['claim', 'claims'],
    ['document', 'documents'],
    ['notification', 'notifications'],
    ['user', 'users'],
    ['subscription_plan', 'subscription_plans'],
    ['subscription_invoice', 'subscription_invoices'],
    ['auto_asset', 'auto_assets'],
    ['home_asset', 'home_assets'],
    ['insurance_type', 'insurance_types'],
    ['quote', 'quotes'],
    ['underwriting', 'underwriting'],
    ['claim_staff', 'claim_staff'],
    ['specialization', 'specializations'],
    ['customer_phone_no', 'customer_phone_no'],
    ['address', 'addresses'],
    ['branch_phone_no', 'branch_phone_no'],
    ['policy_coverage', 'policy_coverage'],
    ['beneficiaries', 'beneficiaries'],
    ['company_insurance_type', 'company_insurance_type'],
    ['branch_insurance_type', 'branch_insurance_type'],
  ];

  for (const [name, key] of tableChecks) {
    if (queryNormalized.includes('select') && queryNormalized.includes(name)) {
      const data = simDb[key] as any[];
      return Promise.resolve({ rows: [...data] });
    }
  }

  return Promise.resolve({ rows: [] });
}

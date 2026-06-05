
-- Drop in reverse order if re-running
DROP TABLE IF EXISTS
    NOTIFICATIONS, PAYMENT_SCHEDULES, PAYMENTS,
    DOCUMENTS, CLAIM_WORKFLOW, CLAIMS, STAFF_PHONE_NO,
    STAFF_SPECIALIZATION, CLAIM_STAFF,
    BENEFICIARIES, HEALTH_PLAN, LIFE_SPEC, HOME_ASSET, AUTO_ASSET,
    POLICY_COVERAGE, AGENT_COMMISSIONS, POLICIES, UMBRELLA_LINK,
    UNDERWRITING, QUOTES, AGENT,
    ADDRESS, CUSTOMER_PHONE_NO, CUSTOMER,
    BRANCH_INSURANCE_TYPE, COMPANY_INSURANCE_TYPE, INSURANCE_TYPES,
    BRANCH_PHONE_NO, BRANCH,
    SUBSCRIPTION_INVOICES, SUBSCRIPTION_PLANS,
    COMPANY_CONTACT_NO, COMPANY,
    UMBRELLA_ASSET_TYPE, PROVIDER_NETWORK, RELATIONSHIP_TYPE,
    USAGE_TYPE, ADDRESS_TYPE, PAYMENT_METHODS, SPECIALIZATIONS
CASCADE;

-- =============================================================================
--  SECTION A: LOOKUP / REFERENCE TABLES (7)
-- =============================================================================

CREATE TABLE SPECIALIZATIONS (
    Specialization_Id   SERIAL          PRIMARY KEY,
    Specialization_Name VARCHAR(100)    NOT NULL UNIQUE
);

CREATE TABLE PAYMENT_METHODS (
    Payment_Method_Id   SERIAL          PRIMARY KEY,
    Method_Type         VARCHAR(50)     NOT NULL UNIQUE
);

CREATE TABLE ADDRESS_TYPE (
    Address_Type_Id     SERIAL          PRIMARY KEY,
    Type_Name           VARCHAR(50)     NOT NULL UNIQUE
);

CREATE TABLE USAGE_TYPE (
    Usage_Type_Id       SERIAL          PRIMARY KEY,
    Type_Name           VARCHAR(50)     NOT NULL UNIQUE
);

CREATE TABLE RELATIONSHIP_TYPE (
    Relationship_Id     SERIAL          PRIMARY KEY,
    Relationship_Name   VARCHAR(50)     NOT NULL UNIQUE
);

CREATE TABLE PROVIDER_NETWORK (
    Provider_Network_Id SERIAL          PRIMARY KEY,
    Network_Name        VARCHAR(100)    NOT NULL,
    Network_Type        VARCHAR(50)     NOT NULL
);

CREATE TABLE UMBRELLA_ASSET_TYPE (
    Umbrella_Asset_Type_Id  SERIAL      PRIMARY KEY,
    Type_Name               VARCHAR(50) NOT NULL UNIQUE
);

-- =============================================================================
--  SECTION B: PLATFORM ADMINISTRATION — SaaS LAYER (4)
-- =============================================================================

CREATE TABLE COMPANY (
    Company_Id          SERIAL          PRIMARY KEY,
    Company_Name        VARCHAR(150)    NOT NULL,
    Head_Office_Address TEXT            NOT NULL,
    License_No          VARCHAR(50)     NOT NULL UNIQUE,
    Subscription_Plan   VARCHAR(20)     NOT NULL CHECK (Subscription_Plan IN ('Starter', 'Professional', 'Enterprise')),
    Subscription_Status VARCHAR(20)     NOT NULL CHECK (Subscription_Status IN ('Active', 'Suspended', 'Trial', 'Cancelled')),
    Subscription_Start  DATE            NOT NULL,
    Subscription_End    DATE,                              
    Max_Branches        INTEGER         NOT NULL,
    Max_Policies        INTEGER         NOT NULL,
    Onboarded_At        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Active'
);

CREATE TABLE COMPANY_CONTACT_NO (
    Company_Id          INTEGER         NOT NULL REFERENCES COMPANY(Company_Id) ON DELETE CASCADE,
    Phone_No_Id         INTEGER         NOT NULL,
    Phone_No            VARCHAR(20)     NOT NULL,
    PRIMARY KEY (Company_Id, Phone_No_Id)
);

CREATE TABLE SUBSCRIPTION_PLANS (
    Plan_Id             SERIAL          PRIMARY KEY,
    Plan_Name           VARCHAR(20)     NOT NULL UNIQUE CHECK (Plan_Name IN ('Starter', 'Professional', 'Enterprise')),
    Monthly_Fee         NUMERIC(12,2)   NOT NULL,
    Max_Branches        INTEGER         NOT NULL,
    Max_Policies        INTEGER         NOT NULL,
    Max_Staff           INTEGER         NOT NULL,
    Features            JSONB           
);

CREATE TABLE SUBSCRIPTION_INVOICES (
    Invoice_Id          SERIAL          PRIMARY KEY,
    Company_Id          INTEGER         NOT NULL REFERENCES COMPANY(Company_Id),
    Plan_Id             INTEGER         NOT NULL REFERENCES SUBSCRIPTION_PLANS(Plan_Id),
    Amount              NUMERIC(12,2)   NOT NULL,
    Invoice_Date        DATE            NOT NULL,
    Due_Date            DATE            NOT NULL,
    Paid_Date           DATE,                              
    Status              VARCHAR(20)     NOT NULL CHECK (Status IN ('Unpaid', 'Paid', 'Overdue', 'Cancelled'))
);

-- =============================================================================
--  SECTION C: COMPANY BRANCH STRUCTURE (4)
-- =============================================================================

CREATE TABLE BRANCH (
    Branch_Id           SERIAL          PRIMARY KEY,
    Company_Id          INTEGER         NOT NULL REFERENCES COMPANY(Company_Id),
    Branch_Name         VARCHAR(150)    NOT NULL,
    Region              VARCHAR(100)    NOT NULL,
    City                VARCHAR(100)    NOT NULL,
    Woreda              VARCHAR(100),
    Kebele              VARCHAR(100),
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Active'
);

CREATE TABLE BRANCH_PHONE_NO (
    Branch_Id           INTEGER         NOT NULL REFERENCES BRANCH(Branch_Id) ON DELETE CASCADE,
    Phone_No_Id         INTEGER         NOT NULL,
    Phone_No            VARCHAR(20)     NOT NULL,
    PRIMARY KEY (Branch_Id, Phone_No_Id)
);

CREATE TABLE INSURANCE_TYPES (
    Insurance_Type_Id   SERIAL          PRIMARY KEY,
    Type_Name           VARCHAR(50)     NOT NULL UNIQUE, 
    Description         TEXT
);

CREATE TABLE COMPANY_INSURANCE_TYPE (
    Company_Id          INTEGER         NOT NULL REFERENCES COMPANY(Company_Id) ON DELETE CASCADE,
    Insurance_Type_Id   INTEGER         NOT NULL REFERENCES INSURANCE_TYPES(Insurance_Type_Id) ON DELETE CASCADE,
    PRIMARY KEY (Company_Id, Insurance_Type_Id)
);

CREATE TABLE BRANCH_INSURANCE_TYPE (
    Branch_Id           INTEGER         NOT NULL REFERENCES BRANCH(Branch_Id) ON DELETE CASCADE,
    Insurance_Type_Id   INTEGER         NOT NULL REFERENCES INSURANCE_TYPES(Insurance_Type_Id) ON DELETE CASCADE,
    PRIMARY KEY (Branch_Id, Insurance_Type_Id)
);

-- =============================================================================
--  SECTION D: CUSTOMER (3)
-- =============================================================================

CREATE TABLE CUSTOMER (
    Customer_Id         SERIAL          PRIMARY KEY,
    Company_Id          INTEGER         NOT NULL REFERENCES COMPANY(Company_Id),   
    First_Name          VARCHAR(100)    NOT NULL,
    Last_Name           VARCHAR(100)    NOT NULL,
    DOB                 DATE,
    Email               VARCHAR(150),
    Fayda_No            VARCHAR(50),                       
    Gender              VARCHAR(10)     CHECK (Gender IN ('Male', 'Female', 'Other')),
    Registration_Date   DATE            NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (Company_Id, Fayda_No)                          
);

CREATE TABLE CUSTOMER_PHONE_NO (
    Customer_Id         INTEGER         NOT NULL REFERENCES CUSTOMER(Customer_Id) ON DELETE CASCADE,
    Phone_No_Id         INTEGER         NOT NULL,
    Phone_No            VARCHAR(20)     NOT NULL,
    PRIMARY KEY (Customer_Id, Phone_No_Id)
);

CREATE TABLE ADDRESS (
    Address_No          SERIAL          PRIMARY KEY,
    Customer_Id         INTEGER         NOT NULL REFERENCES CUSTOMER(Customer_Id) ON DELETE CASCADE,
    Address_Type_Id     INTEGER         NOT NULL REFERENCES ADDRESS_TYPE(Address_Type_Id),  
    Region              VARCHAR(100)    NOT NULL,
    City                VARCHAR(100)    NOT NULL,
    Woreda              VARCHAR(100),
    Kebele              VARCHAR(100)
);

-- =============================================================================
--  SECTION E: AGENT MANAGEMENT (1)
-- =============================================================================

CREATE TABLE AGENT (
    Agent_Id            SERIAL          PRIMARY KEY,
    Branch_Id           INTEGER         NOT NULL REFERENCES BRANCH(Branch_Id),
    -- [Company_Id removed in v3 normalization]
    First_Name          VARCHAR(100)    NOT NULL,
    Last_Name           VARCHAR(100)    NOT NULL,
    License_No          VARCHAR(50)     NOT NULL UNIQUE,
    Commission_Rate     NUMERIC(5,2)    NOT NULL CHECK (Commission_Rate >= 0 AND Commission_Rate <= 100),
    Email               VARCHAR(150),
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Active',
    Hired_Date          DATE
);

-- =============================================================================
--  SECTION I (partial): CLAIM_STAFF
-- =============================================================================

CREATE TABLE CLAIM_STAFF (
    Claim_Staff_Id      SERIAL          PRIMARY KEY,
    Company_Id          INTEGER         NOT NULL REFERENCES COMPANY(Company_Id),   
    Specialization_Id   INTEGER         REFERENCES SPECIALIZATIONS(Specialization_Id),
    First_Name          VARCHAR(100)    NOT NULL,
    Last_Name           VARCHAR(100)    NOT NULL,
    Email               VARCHAR(150),
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Active'
);

CREATE TABLE STAFF_SPECIALIZATION (
    Claim_Staff_Id      INTEGER         NOT NULL REFERENCES CLAIM_STAFF(Claim_Staff_Id) ON DELETE CASCADE,
    Specialization_Id   INTEGER         NOT NULL REFERENCES SPECIALIZATIONS(Specialization_Id) ON DELETE CASCADE,
    PRIMARY KEY (Claim_Staff_Id, Specialization_Id)
);

CREATE TABLE STAFF_PHONE_NO (
    Claim_Staff_Id      INTEGER         NOT NULL REFERENCES CLAIM_STAFF(Claim_Staff_Id) ON DELETE CASCADE,
    Phone_No_Id         INTEGER         NOT NULL,
    Phone_No            VARCHAR(20)     NOT NULL,
    PRIMARY KEY (Claim_Staff_Id, Phone_No_Id)
);

-- =============================================================================
--  SECTION F: QUOTES AND UNDERWRITING (2)
-- =============================================================================

CREATE TABLE QUOTES (
    Quote_Id            SERIAL          PRIMARY KEY,
    -- [Company_Id removed in v3 normalization]
    Customer_Id         INTEGER         NOT NULL REFERENCES CUSTOMER(Customer_Id),
    Agent_Id            INTEGER         NOT NULL REFERENCES AGENT(Agent_Id),
    Branch_Id           INTEGER         NOT NULL REFERENCES BRANCH(Branch_Id),     
    Insurance_Type_Id   INTEGER         NOT NULL REFERENCES INSURANCE_TYPES(Insurance_Type_Id),
    Quote_Date          DATE            NOT NULL DEFAULT CURRENT_DATE,
    Expiration_Date     DATE            NOT NULL,
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Expired', 'Converted', 'Draft', 'Underwriting', 'Approved', 'Declined')),
    Premium_Amount      NUMERIC(14,2)   NOT NULL
);

CREATE TABLE UNDERWRITING (
    Underwriting_Id     SERIAL          PRIMARY KEY,
    Quote_Id            INTEGER         NOT NULL UNIQUE REFERENCES QUOTES(Quote_Id), 
    Risk_Score          NUMERIC(5,2),
    Risk_Level          VARCHAR(20)     NOT NULL CHECK (Risk_Level IN ('Low', 'Medium', 'High', 'Declined')),
    Risk_Factors        TEXT,
    Adjusted_Premium    NUMERIC(14,2),
    Decision            VARCHAR(20)     NOT NULL CHECK (Decision IN ('Approved', 'Referred', 'Declined')),
    Reviewed_By         INTEGER         REFERENCES CLAIM_STAFF(Claim_Staff_Id),
    Review_Date         DATE,
    Notes               TEXT
);

-- =============================================================================
--  SECTION G: POLICIES (3)
-- =============================================================================

CREATE TABLE UMBRELLA_LINK (
    Umbrella_Link_Id        SERIAL      PRIMARY KEY,
    Umbrella_Asset_Type_Id  INTEGER     NOT NULL REFERENCES UMBRELLA_ASSET_TYPE(Umbrella_Asset_Type_Id),  
    Min_Base_Policy         NUMERIC(14,2) NOT NULL,
    Umbrella_Limit          NUMERIC(14,2) NOT NULL
);

CREATE TABLE POLICIES (
    Policy_Id           SERIAL          PRIMARY KEY,
    Company_Id          INTEGER         NOT NULL REFERENCES COMPANY(Company_Id),   
    Customer_Id         INTEGER         NOT NULL REFERENCES CUSTOMER(Customer_Id), 
    Branch_Id           INTEGER         NOT NULL REFERENCES BRANCH(Branch_Id),     
    Quote_Id            INTEGER         NOT NULL UNIQUE REFERENCES QUOTES(Quote_Id), 
    Insurance_Type_Id   INTEGER         NOT NULL REFERENCES INSURANCE_TYPES(Insurance_Type_Id),
    Umbrella_Link_Id    INTEGER         REFERENCES UMBRELLA_LINK(Umbrella_Link_Id), 
    Policy_No           VARCHAR(50)     NOT NULL UNIQUE,
    Start_Date          DATE            NOT NULL,
    End_Date            DATE            NOT NULL,
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                        CHECK (Status IN ('Active', 'Lapsed', 'Cancelled', 'Expired', 'Pending')),
    Total_Premium       NUMERIC(14,2)   NOT NULL
);

CREATE TABLE POLICY_COVERAGE (
    Policy_Coverage_Id  SERIAL          PRIMARY KEY,
    Policy_Id           INTEGER         NOT NULL REFERENCES POLICIES(Policy_Id) ON DELETE CASCADE,
    Coverage_Name       VARCHAR(100)    NOT NULL,
    Coverage_Limit      NUMERIC(14,2)   NOT NULL,
    Deductible          NUMERIC(14,2)   NOT NULL DEFAULT 0
);

-- =============================================================================
--  SECTION H: ASSET / INSURANCE-SPECIFIC TABLES (5)
-- =============================================================================

CREATE TABLE AUTO_ASSET (
    Auto_Asset_Id       SERIAL          PRIMARY KEY,
    Policy_Id           INTEGER         NOT NULL UNIQUE REFERENCES POLICIES(Policy_Id),  
    Policy_Coverage_Id  INTEGER         REFERENCES POLICY_COVERAGE(Policy_Coverage_Id),
    Estimated_Value     NUMERIC(14,2)   NOT NULL,
    Year                SMALLINT        NOT NULL,
    Plate_Number        VARCHAR(20)     NOT NULL UNIQUE,
    Model               VARCHAR(100)    NOT NULL,
    VIN                 VARCHAR(17)     NOT NULL UNIQUE
);

CREATE TABLE HOME_ASSET (
    Home_Asset_Id       SERIAL          PRIMARY KEY,
    Policy_Id           INTEGER         NOT NULL UNIQUE REFERENCES POLICIES(Policy_Id),  
    Address_Id          INTEGER         REFERENCES ADDRESS(Address_No),
    Policy_Coverage_Id  INTEGER         REFERENCES POLICY_COVERAGE(Policy_Coverage_Id),
    Usage_Type_Id       INTEGER         NOT NULL REFERENCES USAGE_TYPE(Usage_Type_Id),  
    Estimated_Value     NUMERIC(14,2)   NOT NULL,
    Year_Built          SMALLINT
);

CREATE TABLE LIFE_SPEC (
    Life_Spec_Id        SERIAL          PRIMARY KEY,
    Policy_Id           INTEGER         NOT NULL UNIQUE REFERENCES POLICIES(Policy_Id),  
    Occupation          VARCHAR(100),
    Policy_Type         VARCHAR(20)     NOT NULL CHECK (Policy_Type IN ('Term', 'Whole', 'Universal', 'Endowment')),
    Medical_History     TEXT
);

CREATE TABLE HEALTH_PLAN (
    Health_Plan_Id      SERIAL          PRIMARY KEY,
    Policy_Id           INTEGER         NOT NULL UNIQUE REFERENCES POLICIES(Policy_Id),  
    Policy_Coverage_Id  INTEGER         REFERENCES POLICY_COVERAGE(Policy_Coverage_Id),
    Provider_Network_Id INTEGER         NOT NULL REFERENCES PROVIDER_NETWORK(Provider_Network_Id),  
    Deductible          NUMERIC(14,2)   NOT NULL DEFAULT 0
);

CREATE TABLE BENEFICIARIES (
    Beneficiary_Id      SERIAL          PRIMARY KEY,
    Life_Spec_Id        INTEGER         NOT NULL REFERENCES LIFE_SPEC(Life_Spec_Id) ON DELETE CASCADE,
    First_Name          VARCHAR(100)    NOT NULL,
    Last_Name           VARCHAR(100)    NOT NULL,
    Relationship_Id     INTEGER         NOT NULL REFERENCES RELATIONSHIP_TYPE(Relationship_Id),  
    DOB                 DATE,
    Percentage          NUMERIC(5,2)    NOT NULL CHECK (Percentage > 0 AND Percentage <= 100)
);

-- =============================================================================
--  SECTION I (continued): CLAIMS
-- =============================================================================

CREATE TABLE CLAIMS (
    Claim_Id            SERIAL          PRIMARY KEY,
    -- [Company_Id removed in v3 normalization]
    Policy_Id           INTEGER         NOT NULL REFERENCES POLICIES(Policy_Id),
    Claim_Staff_Id      INTEGER         NOT NULL REFERENCES CLAIM_STAFF(Claim_Staff_Id),
    Incident_Date       DATE            NOT NULL,
    Loss_Date           DATE,
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Filed'
                                        CHECK (Status IN ('Filed','Assigned','Under_Review','Approved','Rejected','Paid','Closed')),
    Description         TEXT
);

CREATE TABLE CLAIM_WORKFLOW (
    Step_Id             SERIAL          PRIMARY KEY,
    Claim_Id            INTEGER         NOT NULL REFERENCES CLAIMS(Claim_Id) ON DELETE CASCADE,
    Step_Number         INTEGER         NOT NULL,
    Step_Name           VARCHAR(30)     NOT NULL
                                        CHECK (Step_Name IN ('Filed','Assigned','Under_Review','Document_Check',
                                                             'Field_Inspection','Supervisor_Approval',
                                                             'Approved','Rejected','Paid')),
    Assigned_To         INTEGER         REFERENCES CLAIM_STAFF(Claim_Staff_Id),  
    Action_Taken        TEXT,
    Step_Date           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    Notes               TEXT,
    UNIQUE (Claim_Id, Step_Number)
);

-- =============================================================================
--  SECTION J: DOCUMENTS (1)
-- =============================================================================

CREATE TABLE DOCUMENTS (
    Document_Id         SERIAL          PRIMARY KEY,
    -- [Company_Id removed in v3 normalization]
    Policy_Id           INTEGER         REFERENCES POLICIES(Policy_Id),    
    Claim_Id            INTEGER         REFERENCES CLAIMS(Claim_Id),        
    File_Name           VARCHAR(255)    NOT NULL,
    File_Path           TEXT            NOT NULL,
    Uploaded_Date       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    Uploaded_By         INTEGER         REFERENCES CLAIM_STAFF(Claim_Staff_Id),  
    Document_Type       VARCHAR(50)     NOT NULL,
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Active'
                                        CHECK (Status IN ('Active', 'Archived', 'Deleted')),
    Description         TEXT
);

-- =============================================================================
--  SECTION K: PAYMENTS (2)
-- =============================================================================

CREATE TABLE PAYMENTS (
    Payment_Id          SERIAL          PRIMARY KEY,
    Policy_Id           INTEGER         NOT NULL REFERENCES POLICIES(Policy_Id),
    Payment_Method_Id   INTEGER         NOT NULL REFERENCES PAYMENT_METHODS(Payment_Method_Id),
    Amount              NUMERIC(14,2)   NOT NULL,
    Payment_Date        DATE            NOT NULL DEFAULT CURRENT_DATE,
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                        CHECK (Status IN ('Pending', 'Completed', 'Failed', 'Refunded'))
);

CREATE TABLE PAYMENT_SCHEDULES (
    Policy_Id           INTEGER         NOT NULL REFERENCES POLICIES(Policy_Id) ON DELETE CASCADE,
    Installment_Number  INTEGER         NOT NULL,
    Due_Date            DATE            NOT NULL,
    Amount              NUMERIC(14,2)   NOT NULL,
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                        CHECK (Status IN ('Pending', 'Paid', 'Overdue', 'Waived')),
    PRIMARY KEY (Policy_Id, Installment_Number)
);

-- =============================================================================
--  SECTION L: NOTIFICATIONS (1)
-- =============================================================================

CREATE TABLE NOTIFICATIONS (
    Notification_Id     SERIAL          PRIMARY KEY,
    -- [Company_Id removed in v3 normalization]
    Customer_Id         INTEGER         NOT NULL REFERENCES CUSTOMER(Customer_Id),
    Policy_Id           INTEGER         REFERENCES POLICIES(Policy_Id),    
    Claim_Id            INTEGER         REFERENCES CLAIMS(Claim_Id),        
    Channel             VARCHAR(20)     NOT NULL CHECK (Channel IN ('SMS', 'Email', 'Push', 'In-App')),
    Message_Type        VARCHAR(30)     NOT NULL
                                        CHECK (Message_Type IN (
                                            'Payment_Due','Payment_Received','Policy_Expiry',
                                            'Claim_Filed','Claim_Update','Claim_Approved',
                                            'Claim_Rejected','Quote_Expiry','Welcome','Renewal',
                                            'System_Update')),
    Message_Body        TEXT            NOT NULL,
    Sent_At             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Sent'
                                        CHECK (Status IN ('Sent', 'Delivered', 'Failed', 'Read'))
);

-- =============================================================================
--  AGENT_COMMISSIONS — placed last as it references both AGENT and POLICIES
-- =============================================================================

CREATE TABLE AGENT_COMMISSIONS (
    Commission_Id       SERIAL          PRIMARY KEY,
    Agent_Id            INTEGER         NOT NULL REFERENCES AGENT(Agent_Id),
    Policy_Id           INTEGER         NOT NULL REFERENCES POLICIES(Policy_Id),
    Amount              NUMERIC(14,2)   NOT NULL,
    Payment_Date        DATE,                               
    Status              VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                        CHECK (Status IN ('Pending', 'Paid', 'Cancelled'))
);

-- =============================================================================
--  INDEXES 
-- =============================================================================

CREATE INDEX idx_customer_company       ON CUSTOMER(Company_Id);
CREATE INDEX idx_branch_company         ON BRANCH(Company_Id);
CREATE INDEX idx_claim_staff_company    ON CLAIM_STAFF(Company_Id);
CREATE INDEX idx_policies_company       ON POLICIES(Company_Id);
CREATE INDEX idx_policies_customer      ON POLICIES(Customer_Id);
CREATE INDEX idx_policies_branch        ON POLICIES(Branch_Id);
CREATE INDEX idx_quotes_customer        ON QUOTES(Customer_Id);
CREATE INDEX idx_quotes_branch          ON QUOTES(Branch_Id);
CREATE INDEX idx_claims_policy          ON CLAIMS(Policy_Id);
CREATE INDEX idx_payments_policy        ON PAYMENTS(Policy_Id);
CREATE INDEX idx_notifications_customer ON NOTIFICATIONS(Customer_Id);

-- =============================================================================
--  VERIFICATION QUERIES (Diagnostics)
-- =============================================================================

-- Full policy chain: customer → quote → policy → asset → claim
SELECT
    c.first_name || ' ' || c.last_name   AS customer,
    q.premium_amount                      AS quoted_premium,
    u.decision                            AS underwriting,
    p.policy_no,
    p.total_premium,
    a.model                               AS vehicle,
    cl.status                             AS claim_status
FROM policies p
JOIN customer  c  ON c.customer_id  = p.customer_id
JOIN quotes    q  ON q.quote_id     = p.quote_id
JOIN underwriting u ON u.quote_id   = q.quote_id
JOIN auto_asset a  ON a.policy_id   = p.policy_id
JOIN claims    cl  ON cl.policy_id  = p.policy_id;

-- Company derivation for CLAIMS (no Company_Id stored — resolved via FK chain)
SELECT cl.claim_id, p.policy_no, co.company_name
FROM claims cl
JOIN policies p ON p.policy_id = cl.policy_id
JOIN company co ON co.company_id = p.company_id;

-- Company derivation for NOTIFICATIONS (via Customer)
SELECT n.notification_id, n.message_type, co.company_name
FROM notifications n
JOIN customer c ON c.customer_id = n.customer_id
JOIN company co ON co.company_id = c.company_id;

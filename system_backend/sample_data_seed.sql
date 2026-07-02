-- ============================================================================
-- PENTA GUARD - INSURANCE MANAGEMENT PLATFORM (SaaS Edition V3.0)
-- PostgreSQL Sample Data Seeding Script (Matched with System Sandbox Engine)
-- ============================================================================

BEGIN;

-- 1. SPECIALIZATIONS
INSERT INTO SPECIALIZATIONS (Specialization_Id, Specialization_Name) VALUES
(1, 'Motor Claims'),
(2, 'Property Claims'),
(3, 'Life & Pension'),
(4, 'Health & Medical')
ON CONFLICT (Specialization_Id) DO NOTHING;

-- 2. PAYMENT_METHODS
INSERT INTO PAYMENT_METHODS (Payment_Method_Id, Method_Type) VALUES
(1, 'CBE Birr'),
(2, 'Telebirr'),
(3, 'Bank Wire Direct'),
(4, 'Credit Card')
ON CONFLICT (Payment_Method_Id) DO NOTHING;

-- 3. ADDRESS_TYPE
INSERT INTO ADDRESS_TYPE (Address_Type_Id, Type_Name) VALUES
(1, 'Home Residential'),
(2, 'Business Office'),
(3, 'Billing Desk')
ON CONFLICT (Address_Type_Id) DO NOTHING;

-- 4. USAGE_TYPE
INSERT INTO USAGE_TYPE (Usage_Type_Id, Type_Name) VALUES
(1, 'Residential Primary'),
(2, 'Commercial Office'),
(3, 'Rental Apartment')
ON CONFLICT (Usage_Type_Id) DO NOTHING;

-- 5. RELATIONSHIP_TYPE
INSERT INTO RELATIONSHIP_TYPE (Relationship_Id, Relationship_Name) VALUES
(1, 'Spouse'),
(2, 'Child'),
(3, 'Parent'),
(4, 'Business Partner')
ON CONFLICT (Relationship_Id) DO NOTHING;

-- 6. PROVIDER_NETWORK
INSERT INTO PROVIDER_NETWORK (Provider_Network_Id, Network_Name, Network_Type) VALUES
(1, 'Standard Addis Care', 'HMO'),
(2, 'Elite Ethiopia Health Link', 'PPO')
ON CONFLICT (Provider_Network_Id) DO NOTHING;

-- 7. UMBRELLA_ASSET_TYPE
INSERT INTO UMBRELLA_ASSET_TYPE (Umbrella_Asset_Type_Id, Type_Name) VALUES
(1, 'Fleet Vehicle Aggregate'),
(2, 'Multi-Premise Business')
ON CONFLICT (Umbrella_Asset_Type_Id) DO NOTHING;


-- 8. COMPANY (Nile Insurance S.C Tenant)
INSERT INTO COMPANY (Company_Id, Company_Name, Head_Office_Address, License_No, Subscription_Plan, Subscription_Status, Subscription_Start, Max_Branches, Max_Policies, Status) VALUES (
    1, 'Nile Insurance S.C', 
    'Nile Tower, Ras Desta Damtew St, Addis Ababa, Ethiopia', 
    'NBE-LIC-008272', 'Professional', 'Active', '2026-01-01', 
    10, 5000, 'Active'
) ON CONFLICT (Company_Id) DO NOTHING;

-- 9. COMPANY_CONTACT_NO
INSERT INTO COMPANY_CONTACT_NO (Company_Id, Phone_No_Id, Phone_No) VALUES
(1, 1, '+251-11-551-6000')
ON CONFLICT (Company_Id, Phone_No_Id) DO NOTHING;


-- 10. SUBSCRIPTION_PLANS
INSERT INTO SUBSCRIPTION_PLANS (Plan_Id, Plan_Name, Monthly_Fee, Max_Branches, Max_Policies, Max_Staff, Features) VALUES
(1, 'Starter', 2999.00, 3, 500, 10, '{"dashboard": true, "clients": true}'),
(2, 'Professional', 7999.00, 10, 5000, 100, '{"dashboard": true, "clients": true, "claims": true, "customReports": true}'),
(3, 'Enterprise', 14999.00, 50, 50000, 500, '{"dashboard": true, "clients": true, "claims": true, "customReports": true, "whiteLabeling": true, "customApi": true}')
ON CONFLICT (Plan_Id) DO NOTHING;

-- 11. SUBSCRIPTION_INVOICES
INSERT INTO SUBSCRIPTION_INVOICES (Invoice_Id, Company_Id, Plan_Id, Amount, Invoice_Date, Due_Date, Paid_Date, Status) VALUES
(101, 1, 2, 7999.00, '2026-05-01', '2026-05-15', '2026-05-03', 'Paid'),
(102, 1, 2, 7999.00, '2026-06-01', '2026-06-15', NULL, 'Unpaid')
ON CONFLICT (Invoice_Id) DO NOTHING;


-- 12. BRANCH
INSERT INTO BRANCH (Branch_Id, Company_Id, Branch_Name, Region, City, Woreda, Kebele, Status) VALUES
(1, 1, 'Bole Hub Branch', 'Addis Ababa', 'Addis Ababa', '03', '12', 'Active'),
(2, 1, 'Piazza Sub-Branch', 'Addis Ababa', 'Addis Ababa', '01', '04', 'Active'),
(3, 1, 'Adama Express Office', 'Oromia', 'Adama', '04', '01', 'Active'),
(4, 1, 'Hawassa Lakeside Center', 'Sidama', 'Hawassa', '02', '09', 'Active')
ON CONFLICT (Branch_Id) DO NOTHING;

-- 13. BRANCH_PHONE_NO
INSERT INTO BRANCH_PHONE_NO (Branch_Id, Phone_No_Id, Phone_No) VALUES
(1, 1, '+251-11-663-1221'),
(2, 1, '+251-11-155-3211')
ON CONFLICT (Branch_Id, Phone_No_Id) DO NOTHING;


-- 14. INSURANCE_TYPES
INSERT INTO INSURANCE_TYPES (Insurance_Type_Id, Type_Name, Description) VALUES
(1, 'Motor Comprehensive', 'Protects private and commercial vehicles against crash damage, third-party liability, and theft'),
(2, 'Home & Real Estate', 'Covers physical dwellings, commercial structures, properties, fire, and natural perils'),
(3, 'Specialized Life Spec', 'Provides financial security for designated life policy beneficiaries with term/whole features'),
(4, 'Group Health Plan', 'Corporate medical health insurance plans including inpatient care and clinical networks')
ON CONFLICT (Insurance_Type_Id) DO NOTHING;

-- 15. COMPANY_INSURANCE_TYPE
INSERT INTO COMPANY_INSURANCE_TYPE (Company_Id, Insurance_Type_Id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4)
ON CONFLICT (Company_Id, Insurance_Type_Id) DO NOTHING;

-- 16. BRANCH_INSURANCE_TYPE
INSERT INTO BRANCH_INSURANCE_TYPE (Branch_Id, Insurance_Type_Id) VALUES
(1, 1),
(1, 4),
(2, 1),
(2, 2)
ON CONFLICT (Branch_Id, Insurance_Type_Id) DO NOTHING;


-- 17. CUSTOMER
INSERT INTO CUSTOMER (Customer_Id, Company_Id, First_Name, Last_Name, DOB, Email, Fayda_No, Gender, Registration_Date) VALUES
(1, 1, 'Almaz', 'Daniel', '1988-10-14', 'almaz.daniel@gmail.com', 'ET-9941920', 'Female', '2026-03-01'),
(2, 1, 'Yoseph', 'Girmah', '1975-04-20', 'yoseph.g@outlook.com', 'ET-1124490', 'Male', '2026-04-12'),
(3, 1, 'Kidist', 'Solomon', '1992-07-29', 'kidy.solo@gmail.com', 'ET-8873210', 'Female', '2026-05-18')
ON CONFLICT (Customer_Id) DO NOTHING;

-- 18. CUSTOMER_PHONE_NO
INSERT INTO CUSTOMER_PHONE_NO (Customer_Id, Phone_No_Id, Phone_No) VALUES
(1, 1, '+251-91-123-4567'),
(2, 1, '+251-92-098-7654')
ON CONFLICT (Customer_Id, Phone_No_Id) DO NOTHING;

-- 19. ADDRESS
INSERT INTO ADDRESS (Address_No, Customer_Id, Address_Type_Id, Region, City, Woreda, Kebele) VALUES
(1, 1, 1, 'Addis Ababa', 'Addis Ababa', '03', '11'),
(2, 2, 2, 'Oromia', 'Bishoftu', '01', '03')
ON CONFLICT (Address_No) DO NOTHING;


-- 20. CLAIM_STAFF
INSERT INTO CLAIM_STAFF (Claim_Staff_Id, Company_Id, Specialization_Id, First_Name, Last_Name, Email, Status) VALUES
(1, 1, 1, 'Tewodros', 'Hailu', 'ted.hailu@nileinsurance.com', 'Active'),
(2, 1, 2, 'Samrawit', 'Girma', 'sam.girma@nileinsurance.com', 'Active')
ON CONFLICT (Claim_Staff_Id) DO NOTHING;

-- 21. STAFF_PHONE_NO
INSERT INTO STAFF_PHONE_NO (Claim_Staff_Id, Phone_No_Id, Phone_No) VALUES
(1, 1, '+251-91-111-2222')
ON CONFLICT (Claim_Staff_Id, Phone_No_Id) DO NOTHING;

-- 21b. STAFF_SPECIALIZATION (M:M junction)
INSERT INTO STAFF_SPECIALIZATION (Claim_Staff_Id, Specialization_Id) VALUES
(1, 1),
(1, 4),
(2, 2)
ON CONFLICT (Claim_Staff_Id, Specialization_Id) DO NOTHING;


-- 22. AGENT
INSERT INTO AGENT (Agent_Id, Branch_Id, First_Name, Last_Name, License_No, Commission_Rate, Email, Status, Hired_Date) VALUES
(101, 1, 'Abebe', 'Kebede', 'LIC-738-921', 15.50, 'abebe.k@agents.nile.com', 'Active', '2024-03-01'),
(102, 1, 'Mekdes', 'Tadesse', 'LIC-654-321', 12.00, 'mekdy.t@agents.nile.com', 'Active', '2025-01-10'),
(103, 2, 'Hagos', 'Berhe', 'LIC-112-443', 9.50, 'hagos.b@agents.nile.com', 'Active', '2025-06-15'),
(104, 2, 'Lemlem', 'Worku', 'LIC-998-112', 12.00, 'lemlem.w@agents.nile.com', 'Active', '2025-02-18')
ON CONFLICT (Agent_Id) DO NOTHING;


-- 23. QUOTES
INSERT INTO QUOTES (Quote_Id, Customer_Id, Agent_Id, Branch_Id, Insurance_Type_Id, Quote_Date, Expiration_Date, Status, Premium_Amount) VALUES
(1, 1, 101, 1, 1, '2026-05-01', '2026-06-01', 'Converted', 250000.00),
(2, 2, 102, 1, 2, '2026-05-03', '2026-06-03', 'Converted', 150000.00),
(3, 3, 103, 2, 1, '2026-05-25', '2026-06-25', 'Pending', 180000.00)
ON CONFLICT (Quote_Id) DO NOTHING;

-- 24. UNDERWRITING
INSERT INTO UNDERWRITING (Underwriting_Id, Quote_Id, Risk_Score, Risk_Level, Risk_Factors, Adjusted_Premium, Decision, Reviewed_By, Review_Date, Notes) VALUES
(1, 1, 35, 'Low', 'Experienced driver, zero claim registry last 3 years', 250000.00, 'Approved', 1, '2026-05-02', 'Recommended for instant issuance'),
(2, 2, 65, 'Medium', 'Commercial wood storage structure', 165000.00, 'Approved', 2, '2026-05-04', 'Required mandatory high-grade fire extinguisher set-up on site')
ON CONFLICT (Underwriting_Id) DO NOTHING;


-- 25. POLICIES
INSERT INTO POLICIES (Policy_Id, Company_Id, Customer_Id, Branch_Id, Quote_Id, Insurance_Type_Id, Umbrella_Link_Id, Policy_No, Start_Date, End_Date, Status, Total_Premium) VALUES
(1, 1, 1, 1, 1, 1, NULL, 'POL-MTR-994101', '2026-05-05', '2027-05-05', 'Active', 250000.00),
(2, 1, 2, 1, 2, 2, NULL, 'POL-PROP-441121', '2026-05-06', '2027-05-06', 'Active', 150000.00)
ON CONFLICT (Policy_Id) DO NOTHING;

-- 26. POLICY_COVERAGE
INSERT INTO POLICY_COVERAGE (Policy_Coverage_Id, Policy_Id, Coverage_Name, Coverage_Limit, Deductible) VALUES
(1, 1, 'Third Party Legal Liability', 5000000.00, 5000.00),
(2, 1, 'Own Crash Damage & Fire', 250000.00, 1000.00),
(3, 2, 'Commercial Property Structural Fire Coverage', 10000000.00, 10000.00)
ON CONFLICT (Policy_Coverage_Id) DO NOTHING;

-- 27. AGENT_COMMISSIONS
INSERT INTO AGENT_COMMISSIONS (Commission_Id, Agent_Id, Policy_Id, Amount, Payment_Date, Status) VALUES
(1, 101, 1, 38750.00, '2026-05-15', 'Paid'),
(2, 102, 2, 18000.00, '2026-05-20', 'Paid')
ON CONFLICT (Commission_Id) DO NOTHING;


-- 28. AUTO_ASSET
INSERT INTO AUTO_ASSET (Auto_Asset_Id, Policy_Id, Policy_Coverage_Id, Estimated_Value, Year, Plate_Number, Model, VIN) VALUES
(1, 1, 2, 2500000.00, 2021, 'A.A-B03912', 'Toyota Hilux Double Cabin', 'MTRYT202199410A')
ON CONFLICT (Auto_Asset_Id) DO NOTHING;

-- 29. HOME_ASSET
INSERT INTO HOME_ASSET (Home_Asset_Id, Policy_Id, Address_Id, Policy_Coverage_Id, Usage_Type_Id, Estimated_Value, Year_Built) VALUES
(1, 2, 2, 3, 2, 12000000.00, 2018)
ON CONFLICT (Home_Asset_Id) DO NOTHING;


-- 30. CLAIMS
INSERT INTO CLAIMS (Claim_Id, Policy_Id, Claim_Staff_Id, Incident_Date, Loss_Date, Status, Description) VALUES
(1, 1, 1, '2026-05-12', '2026-05-12', 'Under_Review', 'Minor rear-end crash on Ring Road. Estimating rear metal bumper rebuilding work.'),
(2, 2, 2, '2026-05-15', '2026-05-16', 'Filed', 'Water pipe leak in server room. Minor floor damage reported.')
ON CONFLICT (Claim_Id) DO NOTHING;

-- 31. CLAIM_WORKFLOW
INSERT INTO CLAIM_WORKFLOW (Step_Id, Claim_Id, Step_Number, Step_Name, Assigned_To, Action_Taken, Step_Date, Notes) VALUES
(1, 1, 1, 'Filed', 1, 'Customer reported incident on hotline. Case logged.', '2026-05-12', 'Photos uploaded to Nile Core Vault.'),
(2, 1, 2, 'Field_Inspection', 1, 'Claim Adjuster vetted the vehicle at Bole workshop.', '2026-05-14', 'Est. repair cost: ETB 18,200.')
ON CONFLICT (Step_Id) DO NOTHING;


-- 32. DOCUMENTS
INSERT INTO DOCUMENTS (Document_Id, Policy_Id, Claim_Id, File_Name, File_Path, Uploaded_Date, Uploaded_By, Document_Type, Status, Description) VALUES
(1, 1, 1, 'police_report_bole_ring_road.pdf', '/vault/claims/police_report_bole_ring_road.pdf', '2026-05-12', 1, 'ClaimEvidence', 'Active', 'Inquest and diagram of the crash scene issued by Federal Police.'),
(2, 1, NULL, 'driver_license_almaz_d.pdf', '/vault/policies/driver_license_almaz_d.pdf', '2026-05-05', NULL, 'ID', 'Active', 'Scanned digital copy of insured primary operator licence')
ON CONFLICT (Document_Id) DO NOTHING;


-- 33. PAYMENTS
INSERT INTO PAYMENTS (Payment_Id, Policy_Id, Payment_Method_Id, Amount, Payment_Date, Status) VALUES
(1, 1, 2, 125000.00, '2026-05-05', 'Completed'),
(2, 2, 3, 75000.00, '2026-05-06', 'Completed')
ON CONFLICT (Payment_Id) DO NOTHING;

-- 34. PAYMENT_SCHEDULES
INSERT INTO PAYMENT_SCHEDULES (Policy_Id, Installment_Number, Due_Date, Amount, Status) VALUES
(1, 1, '2026-05-05', 125000.00, 'Paid'),
(1, 2, '2026-11-05', 125000.00, 'Pending'),
(2, 1, '2026-05-06', 75000.00, 'Paid'),
(2, 2, '2026-11-06', 75000.00, 'Pending')
ON CONFLICT (Policy_Id, Installment_Number) DO NOTHING;


-- 35. NOTIFICATIONS
INSERT INTO NOTIFICATIONS (Notification_Id, Customer_Id, Policy_Id, Claim_Id, Channel, Message_Type, Message_Body, Sent_At, Status) VALUES
(1, 1, 1, NULL, 'SMS', 'Welcome', 'Dear Almaz, Nile Insurance S.C welcomes you! Your Motor Comprehensive POL-MTR-994101 is now active.', '2026-05-05 10:00:00', 'Delivered')
ON CONFLICT (Notification_Id) DO NOTHING;

-- 36. USERS (Demo Accounts)
INSERT INTO USERS (User_Id, Email, Password_Hash, Role, Company_Id, First_Name, Last_Name, Status) VALUES
(1, 'admin@nile.com', '$2b$10$dXxG3eN7UoUComxaVF2pZOmyizYZvLyql.1ozVeRywfC1yWmzOvMq', 'admin', 1, 'Yonas', 'Girma', 'Active'),
(2, 'agent@nile.com', '$2b$10$U.bHa4lriTSYqESJGqlGu.E9nMirrssooWtEs3ThZxixWIegnSIQq', 'agent', 1, 'Abebe', 'Kebede', 'Active'),
(3, 'claims@nile.com', '$2b$10$JpiZ15MXqx4sJ0fCJs324u6phRGrasAfSIZsdkI2I9irYg1xtoWuS', 'claim_staff', 1, 'Tewodros', 'Hailu', 'Active'),
(4, 'super@pentaguard.com', '$2b$10$/pSBEZ.IxbwN9XK2OEGrUeta0rAYpOjhFlpHpGItFYiF0XP2MZKkK', 'super_admin', NULL, 'Super', 'Admin', 'Active')
ON CONFLICT (User_Id) DO NOTHING;

COMMIT;

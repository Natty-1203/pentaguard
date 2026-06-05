// PENTA GUARD - MOCK DATA STRUCTURE & DEFINITIONS

export interface SimDatabase {
  specializations: any[];
  payment_methods: any[];
  address_type: any[];
  usage_type: any[];
  relationship_type: any[];
  provider_network: any[];
  umbrella_asset_type: any[];
  company: any[];
  company_contact_no: any[];
  subscription_plans: any[];
  subscription_invoices: any[];
  branches: any[];
  branch_phone_no: any[];
  insurance_types: any[];
  company_insurance_type: any[];
  branch_insurance_type: any[];
  customers: any[];
  customer_phone_no: any[];
  addresses: any[];
  claim_staff: any[];
  staff_phone_no: any[];
  staff_specialization: any[];
  agents: any[];
  agent_commissions: any[];
  quotes: any[];
  underwriting: any[];
  policies: any[];
  policy_coverage: any[];
  umbrella_link: any[];
  auto_assets: any[];
  home_assets: any[];
  life_spec: any[];
  health_plans: any[];
  beneficiaries: any[];
  claims: any[];
  claim_workflows: any[];
  documents: any[];
  payments: any[];
  payment_schedules: any[];
  notifications: any[];
}

export const defaultSimDb: SimDatabase = {
  specializations: [
    { Specialization_Id: 1, Specialization_Name: 'Motor Claims' },
    { Specialization_Id: 2, Specialization_Name: 'Property Claims' },
    { Specialization_Id: 3, Specialization_Name: 'Life & Pension' },
    { Specialization_Id: 4, Specialization_Name: 'Health & Medical' }
  ],
  payment_methods: [
    { Payment_Method_Id: 1, Method_Type: 'CBE Birr' },
    { Payment_Method_Id: 2, Method_Type: 'Telebirr' },
    { Payment_Method_Id: 3, Method_Type: 'Bank Wire Direct' },
    { Payment_Method_Id: 4, Method_Type: 'Credit Card' }
  ],
  address_type: [
    { Address_Type_Id: 1, Type_Name: 'Home Residential' },
    { Address_Type_Id: 2, Type_Name: 'Business Office' },
    { Address_Type_Id: 3, Type_Name: 'Billing Desk' }
  ],
  usage_type: [
    { Usage_Type_Id: 1, Type_Name: 'Residential Primary' },
    { Usage_Type_Id: 2, Type_Name: 'Commercial Office' },
    { Usage_Type_Id: 3, Type_Name: 'Rental Apartment' }
  ],
  relationship_type: [
    { Relationship_Id: 1, Relationship_Name: 'Spouse' },
    { Relationship_Id: 2, Relationship_Name: 'Child' },
    { Relationship_Id: 3, Relationship_Name: 'Parent' },
    { Relationship_Id: 4, Relationship_Name: 'Business Partner' }
  ],
  provider_network: [
    { Provider_Network_Id: 1, Network_Name: 'Standard Addis Care', Network_Type: 'HMO' },
    { Provider_Network_Id: 2, Network_Name: 'Elite Ethiopia Health Link', Network_Type: 'PPO' }
  ],
  umbrella_asset_type: [
    { Umbrella_Asset_Type_Id: 1, Type_Name: 'Fleet Vehicle Aggregate' },
    { Umbrella_Asset_Type_Id: 2, Type_Name: 'Multi-Premise Business' }
  ],
  company: [
    {
      Company_Id: 1,
      Company_Name: 'Nile Insurance S.C',
      Head_Office_Address: 'Nile Tower, Ras Desta Damtew St, Addis Ababa, Ethiopia',
      License_No: 'NBE-LIC-008272',
      Subscription_Plan: 'Professional',
      Subscription_Status: 'Active',
      Subscription_Start: '2026-01-01',
      Subscription_End: null,
      Max_Branches: 10,
      Max_Policies: 5000,
      Onboarded_At: '2026-01-01T09:00:00Z',
      Status: 'Active'
    }
  ],
  company_contact_no: [
    { Company_Id: 1, Phone_No_Id: 1, Phone_No: '+251-11-551-6000' }
  ],
  subscription_plans: [
    { Plan_Id: 1, Plan_Name: 'Starter', Monthly_Fee: 2999.00, Max_Branches: 3, Max_Policies: 500, Max_Staff: 10, Features: { dashboard: true, clients: true } },
    { Plan_Id: 2, Plan_Name: 'Professional', Monthly_Fee: 7999.00, Max_Branches: 10, Max_Policies: 5000, Max_Staff: 100, Features: { dashboard: true, clients: true, claims: true, customReports: true } },
    { Plan_Id: 3, Plan_Name: 'Enterprise', Monthly_Fee: 14999.00, Max_Branches: 50, Max_Policies: 50000, Max_Staff: 500, Features: { dashboard: true, clients: true, claims: true, customReports: true, whiteLabeling: true, customApi: true } }
  ],
  subscription_invoices: [
    { Invoice_Id: 101, Company_Id: 1, Plan_Id: 2, Amount: 7999.00, Invoice_Date: '2026-05-01', Due_Date: '2026-05-15', Paid_Date: '2026-05-03', Status: 'Paid' },
    { Invoice_Id: 102, Company_Id: 1, Plan_Id: 2, Amount: 7999.00, Invoice_Date: '2026-06-01', Due_Date: '2026-06-15', Paid_Date: null, Status: 'Unpaid' }
  ],
  branches: [
    { Branch_Id: 1, Company_Id: 1, Branch_Name: 'Bole Hub Branch', Region: 'Addis Ababa', City: 'Addis Ababa', Woreda: '03', Kebele: '12', Status: 'Active' },
    { Branch_Id: 2, Company_Id: 1, Branch_Name: 'Piazza Sub-Branch', Region: 'Addis Ababa', City: 'Addis Ababa', Woreda: '01', Kebele: '04', Status: 'Active' },
    { Branch_Id: 3, Company_Id: 1, Branch_Name: 'Adama Express Office', Region: 'Oromia', City: 'Adama', Woreda: '04', Kebele: '01', Status: 'Active' },
    { Branch_Id: 4, Company_Id: 1, Branch_Name: 'Hawassa Lakeside Center', Region: 'Sidama', City: 'Hawassa', Woreda: '02', Kebele: '09', Status: 'Active' }
  ],
  branch_phone_no: [
    { Branch_Id: 1, Phone_No_Id: 1, Phone_No: '+251-11-663-1221' },
    { Branch_Id: 2, Phone_No_Id: 1, Phone_No: '+251-11-155-3211' }
  ],
  insurance_types: [
    { Insurance_Type_Id: 1, Type_Name: 'Motor Comprehensive', Description: 'Protects private and commercial vehicles against crash damage, third-party liability, and theft' },
    { Insurance_Type_Id: 2, Type_Name: 'Home & Real Estate', Description: 'Covers physical dwellings, commercial structures, properties, fire, and natural perils' },
    { Insurance_Type_Id: 3, Type_Name: 'Specialized Life Spec', Description: 'Provides financial security for designated life policy beneficiaries with term/whole features' },
    { Insurance_Type_Id: 4, Type_Name: 'Group Health Plan', Description: 'Corporate medical health insurance plans including inpatient care and clinical networks' }
  ],
  company_insurance_type: [
    { Company_Id: 1, Insurance_Type_Id: 1 },
    { Company_Id: 1, Insurance_Type_Id: 2 },
    { Company_Id: 1, Insurance_Type_Id: 3 },
    { Company_Id: 1, Insurance_Type_Id: 4 }
  ],
  branch_insurance_type: [
    { Branch_Id: 1, Insurance_Type_Id: 1 },
    { Branch_Id: 1, Insurance_Type_Id: 4 },
    { Branch_Id: 2, Insurance_Type_Id: 1 },
    { Branch_Id: 2, Insurance_Type_Id: 2 }
  ],
  customers: [
    { Customer_Id: 1, Company_Id: 1, First_Name: 'Almaz', Last_Name: 'Daniel', DOB: '1988-10-14', Email: 'almaz.daniel@gmail.com', Fayda_No: 'ET-9941920', Gender: 'Female', Registration_Date: '2026-03-01' },
    { Customer_Id: 2, Company_Id: 1, First_Name: 'Yoseph', Last_Name: 'Girmah', DOB: '1975-04-20', Email: 'yoseph.g@outlook.com', Fayda_No: 'ET-1124490', Gender: 'Male', Registration_Date: '2026-04-12' },
    { Customer_Id: 3, Company_Id: 1, First_Name: 'Kidist', Last_Name: 'Solomon', DOB: '1992-07-29', Email: 'kidy.solo@gmail.com', Fayda_No: 'ET-8873210', Gender: 'Female', Registration_Date: '2026-05-18' }
  ],
  customer_phone_no: [
    { Customer_Id: 1, Phone_No_Id: 1, Phone_No: '+251-91-123-4567' },
    { Customer_Id: 2, Phone_No_Id: 1, Phone_No: '+251-92-098-7654' }
  ],
  addresses: [
    { Address_No: 1, Customer_Id: 1, Address_Type_Id: 1, Region: 'Addis Ababa', City: 'Addis Ababa', Woreda: '03', Kebele: '11' },
    { Address_No: 2, Customer_Id: 2, Address_Type_Id: 2, Region: 'Oromia', City: 'Bishoftu', Woreda: '01', Kebele: '03' }
  ],
  claim_staff: [
    { Claim_Staff_Id: 1, Company_Id: 1, Specialization_Id: 1, First_Name: 'Tewodros', Last_Name: 'Hailu', Email: 'ted.hailu@nileinsurance.com', Status: 'Active' },
    { Claim_Staff_Id: 2, Company_Id: 1, Specialization_Id: 2, First_Name: 'Samrawit', Last_Name: 'Girma', Email: 'sam.girma@nileinsurance.com', Status: 'Active' }
  ],
  staff_phone_no: [
    { Claim_Staff_Id: 1, Phone_No_Id: 1, Phone_No: '+251-91-111-2222' }
  ],
  staff_specialization: [
    { Claim_Staff_Id: 1, Specialization_Id: 1 },
    { Claim_Staff_Id: 1, Specialization_Id: 4 },
    { Claim_Staff_Id: 2, Specialization_Id: 2 }
  ],
  agents: [
    { Agent_Id: 101, Branch_Id: 1, First_Name: 'Abebe', Last_Name: 'Kebede', License_No: 'LIC-738-921', Commission_Rate: 15.5, Email: 'abebe.k@agents.nile.com', Status: 'Active', Hired_Date: '2024-03-01' },
    { Agent_Id: 102, Branch_Id: 1, First_Name: 'Mekdes', Last_Name: 'Tadesse', License_No: 'LIC-654-321', Commission_Rate: 12.00, Email: 'mekdy.t@agents.nile.com', Status: 'Active', Hired_Date: '2025-01-10' },
    { Agent_Id: 103, Branch_Id: 2, First_Name: 'Hagos', Last_Name: 'Berhe', License_No: 'LIC-112-443', Commission_Rate: 9.50, Email: 'hagos.b@agents.nile.com', Status: 'Active', Hired_Date: '2025-06-15' },
    { Agent_Id: 104, Branch_Id: 2, First_Name: 'Lemlem', Last_Name: 'Worku', License_No: 'LIC-998-112', Commission_Rate: 12.00, Email: 'lemlem.w@agents.nile.com', Status: 'Active', Hired_Date: '2025-02-18' }
  ],
  agent_commissions: [
    { Commission_Id: 1, Agent_Id: 101, Policy_Id: 1, Amount: 38750.00, Payment_Date: '2026-05-15', Status: 'Paid' },
    { Commission_Id: 2, Agent_Id: 102, Policy_Id: 2, Amount: 18000.00, Payment_Date: '2026-05-20', Status: 'Paid' }
  ],
  quotes: [
    { Quote_Id: 1, Customer_Id: 1, Agent_Id: 101, Branch_Id: 1, Insurance_Type_Id: 1, Quote_Date: '2026-05-01', Expiration_Date: '2026-06-01', Status: 'Converted', Premium_Amount: 250000.00 },
    { Quote_Id: 2, Customer_Id: 2, Agent_Id: 102, Branch_Id: 1, Insurance_Type_Id: 2, Quote_Date: '2026-05-03', Expiration_Date: '2026-06-03', Status: 'Converted', Premium_Amount: 150000.00 },
    { Quote_Id: 3, Customer_Id: 3, Agent_Id: 103, Branch_Id: 2, Insurance_Type_Id: 1, Quote_Date: '2026-05-25', Expiration_Date: '2026-06-25', Status: 'Pending', Premium_Amount: 180000.00 }
  ],
  underwriting: [
    { Underwriting_Id: 1, Quote_Id: 1, Risk_Score: 35, Risk_Level: 'Low', Risk_Factors: 'Experienced driver, zero claim registry last 3 years', Adjusted_Premium: 250000.00, Decision: 'Approved', Reviewed_By: 1, Review_Date: '2026-05-02', Notes: 'Recommended for instant issuance' },
    { Underwriting_Id: 2, Quote_Id: 2, Risk_Score: 65, Risk_Level: 'Medium', Risk_Factors: 'Commercial wood storage structure', Adjusted_Premium: 165000.00, Decision: 'Approved', Reviewed_By: 2, Review_Date: '2026-05-04', Notes: 'Required mandatory high-grade fire extinguisher set-up on site' }
  ],
  policies: [
    { Policy_Id: 1, Company_Id: 1, Customer_Id: 1, Branch_Id: 1, Quote_Id: 1, Insurance_Type_Id: 1, Umbrella_Link_Id: null, Policy_No: 'POL-MTR-994101', Start_Date: '2026-05-05', End_Date: '2027-05-05', Status: 'Active', Total_Premium: 250000.00 },
    { Policy_Id: 2, Company_Id: 1, Customer_Id: 2, Branch_Id: 1, Quote_Id: 2, Insurance_Type_Id: 2, Umbrella_Link_Id: null, Policy_No: 'POL-PROP-441121', Start_Date: '2026-05-06', End_Date: '2027-05-06', Status: 'Active', Total_Premium: 150000.00 }
  ],
  policy_coverage: [
    { Policy_Coverage_Id: 1, Policy_Id: 1, Coverage_Name: 'Third Party Legal Liability', Coverage_Limit: 5000000.00, Deductible: 5000.00 },
    { Policy_Coverage_Id: 2, Policy_Id: 1, Coverage_Name: 'Own Crash Damage & Fire', Coverage_Limit: 250000.00, Deductible: 1000.00 },
    { Policy_Coverage_Id: 3, Policy_Id: 2, Coverage_Name: 'Commercial Property Structural Fire Coverage', Coverage_Limit: 10000000.00, Deductible: 10000.00 }
  ],
  umbrella_link: [],
  auto_assets: [
    { Auto_Asset_Id: 1, Policy_Id: 1, Policy_Coverage_Id: 2, Estimated_Value: 2500000.00, Year: 2021, Plate_Number: 'A.A-B03912', Model: 'Toyota Hilux Double Cabin', VIN: 'MTRYT202199410A' }
  ],
  home_assets: [
    { Home_Asset_Id: 1, Policy_Id: 2, Address_Id: 2, Policy_Coverage_Id: 3, Usage_Type_Id: 2, Estimated_Value: 12000000.00, Year_Built: 2018 }
  ],
  life_spec: [],
  health_plans: [],
  beneficiaries: [],
  claims: [
    { Claim_Id: 1, Policy_Id: 1, Claim_Staff_Id: 1, Incident_Date: '2026-05-12', Loss_Date: '2026-05-12', Status: 'Under_Review', Description: 'Minor rear-end crash on Ring Road. Estimating rear metal bumper rebuilding work.' },
    { Claim_Id: 2, Policy_Id: 2, Claim_Staff_Id: 2, Incident_Date: '2026-05-15', Loss_Date: '2026-05-16', Status: 'Filed', Description: 'Water pipe leak in server room. Minor floor damage reported.' }
  ],
  claim_workflows: [
    { Step_Id: 1, Claim_Id: 1, Step_Number: 1, Step_Name: 'Filed', Assigned_To: 1, Action_Taken: 'Customer reported incident on hotline. Case logged.', Step_Date: '2026-05-12', Notes: 'Photos uploaded to Nile Core Vault.' },
    { Step_Id: 2, Claim_Id: 1, Step_Number: 2, Step_Name: 'Field_Inspection', Assigned_To: 1, Action_Taken: 'Claim Adjuster vetted the vehicle at Bole workshop.', Step_Date: '2026-05-14', Notes: 'Est. repair cost: ETB 18,200.' }
  ],
  documents: [
    { Document_Id: 1, Policy_Id: 1, Claim_Id: 1, File_Name: 'police_report_bole_ring_road.pdf', File_Path: '/vault/claims/police_report_bole_ring_road.pdf', Uploaded_Date: '2026-05-12', Uploaded_By: 1, Document_Type: 'ClaimEvidence', Status: 'Active', Description: 'Inquest and diagram of the crash scene issued by Federal Police.' },
    { Document_Id: 2, Policy_Id: 1, Claim_Id: null, File_Name: 'driver_license_almaz_d.pdf', File_Path: '/vault/policies/driver_license_almaz_d.pdf', Uploaded_Date: '2026-05-05', Uploaded_By: null, Document_Type: 'ID', Status: 'Active', Description: 'Scanned digital copy of insured primary operator licence' }
  ],
  payments: [
    { Payment_Id: 1, Policy_Id: 1, Payment_Method_Id: 2, Amount: 125000.00, Payment_Date: '2026-05-05', Status: 'Completed' },
    { Payment_Id: 2, Policy_Id: 2, Payment_Method_Id: 3, Amount: 75000.00, Payment_Date: '2026-05-06', Status: 'Completed' }
  ],
  payment_schedules: [
    { Policy_Id: 1, Installment_Number: 1, Due_Date: '2026-05-05', Amount: 125000.00, Status: 'Paid' },
    { Policy_Id: 1, Installment_Number: 2, Due_Date: '2026-11-05', Amount: 125000.00, Status: 'Pending' },
    { Policy_Id: 2, Installment_Number: 1, Due_Date: '2026-05-06', Amount: 75000.00, Status: 'Paid' },
    { Policy_Id: 2, Installment_Number: 2, Due_Date: '2026-11-06', Amount: 75000.00, Status: 'Pending' }
  ],
  notifications: [
    { Notification_Id: 1, Customer_Id: 1, Policy_Id: 1, Claim_Id: null, Channel: 'SMS', Message_Type: 'Welcome', Message_Body: 'Dear Almaz, Nile Insurance S.C welcomes you! Your Motor Comprehensive POL-MTR-994101 is now active.', Sent_At: '2026-05-05T10:00:00Z', Status: 'Delivered' }
  ]
};

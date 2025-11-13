import { User, Case } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'clerk001',
    role: 'clerk',
    fullName: 'Rajesh Kumar',
    email: 'rajesh.kumar@court.gov.in'
  },
  {
    id: '2',
    username: 'police001',
    role: 'police',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@police.gov.in'
  },
  {
    id: '3',
    username: 'admin001',
    role: 'admin',
    fullName: 'Amit Patel',
    email: 'amit.patel@admin.gov.in'
  }
];

export const mockCases: Case[] = [
  {
    id: '1',
    caseNo: 'CR-2024-001',
    name: 'Vikram Singh',
    age: 32,
    address: '123 MG Road, Bangalore, Karnataka - 560001',
    fatherName: 'Rajendra Singh',
    motherName: 'Sunita Singh',
    aadharNo: '234567891234',
    officerName: 'Inspector Ramesh Yadav',
    crimeType: 'Cyber Fraud',
    crimeDetails: 'Phishing attack targeting senior citizens, fraudulent emails sent posing as bank officials resulting in theft of ₹2,50,000',
    fingerDemographicDetails: 'Right thumb print captured - Loop pattern, 12 ridge characteristics identified',
    courtJudgement: 'Pending',
    judgeName: 'Justice M.K. Sharma',
    status: 'In Court',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-11-10')
  },
  {
    id: '2',
    caseNo: 'CR-2024-002',
    name: 'Anjali Verma',
    age: 28,
    address: '456 Nehru Street, Mumbai, Maharashtra - 400001',
    fatherName: 'Suresh Verma',
    motherName: 'Kavita Verma',
    aadharNo: '345678912345',
    officerName: 'Sub-Inspector Meera Desai',
    crimeType: 'Identity Theft',
    crimeDetails: 'Unauthorized access to personal information, creation of fake social media profiles for defamation',
    fingerDemographicDetails: 'Left index print captured - Whorl pattern, 15 ridge characteristics identified',
    courtJudgement: 'Guilty - 2 years imprisonment and ₹50,000 fine',
    judgeName: 'Justice Anita Rao',
    status: 'Closed',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-10-25')
  },
  {
    id: '3',
    caseNo: 'CR-2024-003',
    name: 'Arjun Malhotra',
    age: 35,
    address: '789 Park Avenue, Delhi - 110001',
    fatherName: 'Vijay Malhotra',
    motherName: 'Neha Malhotra',
    aadharNo: '456789123456',
    officerName: 'Inspector Karan Singh',
    crimeType: 'Data Breach',
    crimeDetails: 'Unauthorized access to company database, theft of customer data affecting 10,000+ users',
    fingerDemographicDetails: 'Right index print captured - Arch pattern, 10 ridge characteristics identified',
    courtJudgement: 'Pending',
    judgeName: 'Justice R.K. Verma',
    status: 'Under Investigation',
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-11-12')
  },
  {
    id: '4',
    caseNo: 'CR-2024-004',
    name: 'Sonia Kapoor',
    age: 41,
    address: '321 Lake Road, Hyderabad, Telangana - 500001',
    fatherName: 'Ashok Kapoor',
    motherName: 'Rani Kapoor',
    aadharNo: '567891234567',
    officerName: 'Inspector Vijay Kumar',
    crimeType: 'Ransomware Attack',
    crimeDetails: 'Deployment of ransomware on corporate network, demanding ₹50 lakhs in cryptocurrency',
    fingerDemographicDetails: 'Left middle print captured - Loop pattern, 14 ridge characteristics identified',
    courtJudgement: 'Pending',
    judgeName: 'Justice S.P. Singh',
    status: 'Open',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-11-13')
  }
];

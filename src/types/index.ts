export type UserRole = 'clerk' | 'police' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email: string;
}

export interface Case {
  id: string;
  caseNo: string;
  name: string;
  age: number;
  address: string;
  fatherName: string;
  motherName: string;
  aadharNo: string;
  officerName: string;
  crimeType: string;
  crimeDetails: string;
  fingerDemographicDetails: string;
  courtJudgement: string;
  judgeName: string;
  status: 'Open' | 'Under Investigation' | 'In Court' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

export type PurposeType = 'Visit Resident' | 'Delivery' | 'Barangay Errand' | 'Others';

export interface Resident {
  id: number;
  name: string;
  address: string;
}

export interface Visitor {
  id: number;
  driverName: string;
  plateNumber: string;
  purpose: PurposeType;
  residentId?: number | null;
  status: 'active' | 'logged_out';
  timeIn: number; // epoch ms
  timeOut?: number | null; // epoch ms
}



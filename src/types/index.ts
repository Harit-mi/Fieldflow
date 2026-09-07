export type JobStatus = 'Scheduled' | 'En Route' | 'In Progress' | 'Complete' | 'Paid';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance_cents: number;
}

export interface Job {
  id: string;
  customer: Customer;
  scheduled_date: string;
  status: JobStatus;
  service_type: string;
  notes: string;
  invoice_amount_cents?: number; // Total amount owed
}

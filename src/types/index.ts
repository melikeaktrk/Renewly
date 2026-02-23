export type User = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Subscription = {
  id: string;
  name: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  startDate: string;
  nextBillingDate: string;
  autoRenew: boolean;
  reminderDaysBefore: number;
  categoryId: string;
  status: string;
};

export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationLog = {
  id: string;
  message: string;
  scheduledFor: string;
  createdAt: string;
};

export type DashboardSummary = {
  monthlyTotal: number;
  yearlyTotal: number;
};

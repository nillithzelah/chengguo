export type RoleType = '' | '*' | 'admin' | 'internal_boss' | 'internal_service' | 'internal_user' | 'external_boss' | 'external_service' | 'external_user';
export interface UserState {
  name?: string;
  avatar?: string;
  job?: string;
  organization?: string;
  location?: string;
  email?: string;
  introduction?: string;
  personalWebsite?: string;
  jobName?: string;
  organizationName?: string;
  locationName?: string;
  phone?: string;
  registrationDate?: string;
  accountId?: string;
  certification?: number;
  role: RoleType;
  // 设备信息
  deviceInfo?: {
    ip?: string;
    city?: string;
    phoneBrand?: string;
    phoneModel?: string;
  };
}

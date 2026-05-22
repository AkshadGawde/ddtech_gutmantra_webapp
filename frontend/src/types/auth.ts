export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: WhatsAppUser;
  isNewUser?: boolean;
  error?: string;
}

export interface WhatsAppUser {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  verified?: boolean;
  address?: UserAddress;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserAddress {
  apartment?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
}

export interface OTPError {
  success: false;
  message: string;
  attemptsRemaining?: number;
  retryAfter?: number;
}

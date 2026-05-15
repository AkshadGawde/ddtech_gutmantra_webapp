import type { User as FirebaseUser } from "firebase/auth";

export interface FirestoreAddress {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  apartment?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  fullAddress?: string;
}

export interface FirestoreUserDocument {
  email?: string;
  phone?: string;
  wordpressUserId?: string;
  name?: string;
  profileImage?: string;
  role?: string;
  address?: FirestoreAddress;
  createdAt?: any;
  updatedAt?: any;
}

export function getUserInitials(name?: string): string {
  const normalized = String(name ?? "").trim();
  if (!normalized) return "U";

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function formatAddress(address?: FirestoreAddress): string {
  if (!address) return "";

  const lines: string[] = [];

  const streetLine = [address.streetAddress, address.apartment].filter(Boolean).join(", ");
  if (streetLine) {
    lines.push(streetLine);
  }

  const cityStatePin = [address.city, address.state].filter(Boolean).join(", ");
  const cityStatePinWithCode = address.pinCode
    ? `${cityStatePin}${cityStatePin ? " " : ""}${address.pinCode}`
    : cityStatePin;

  if (cityStatePinWithCode) {
    lines.push(cityStatePinWithCode);
  }

  if (address.country) {
    lines.push(address.country);
  }

  return lines.filter(Boolean).join("\n");
}

export function getDisplayName(
  userDoc?: Partial<FirestoreUserDocument>,
  firebaseUser?: FirebaseUser | null
): string {
  const addressName = [
    userDoc?.address?.firstName?.trim(),
    userDoc?.address?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  if (addressName) {
    return addressName;
  }

  if (userDoc?.name?.trim()) {
    return userDoc.name.trim();
  }

  if (firebaseUser?.displayName?.trim()) {
    return firebaseUser.displayName.trim();
  }

  const email = userDoc?.email || firebaseUser?.email || "";
  const username = email.split("@")[0];
  return username || "User";
}

export function normalizeFirestoreUserDoc(
  data: Record<string, any>,
  firebaseUser?: FirebaseUser | null
): FirestoreUserDocument {
  const addressFromDoc: FirestoreAddress = {
    firstName: data?.address?.firstName ?? "",
    lastName: data?.address?.lastName ?? "",
    streetAddress: data?.address?.streetAddress ?? data?.street ?? "",
    apartment: data?.address?.apartment ?? data?.apartment ?? "",
    city: data?.address?.city ?? data?.city ?? "",
    state: data?.address?.state ?? data?.state ?? "",
    pinCode:
      data?.address?.pinCode ??
      data?.zipCode ??
      data?.postalCode ??
      data?.billing_postcode ?? "",
    country: data?.address?.country ?? data?.country ?? "India",
    fullAddress:
      data?.address?.fullAddress ?? data?.fullAddress ?? "",
  };

  return {
    email: data?.email ?? firebaseUser?.email ?? "",
    phone: data?.phone ?? firebaseUser?.phoneNumber ?? "",
    wordpressUserId: data?.wordpressUserId ?? data?.wordpress_user_id ?? "",
    name:
      data?.name ??
      firebaseUser?.displayName ??
      String(data?.email ?? firebaseUser?.email ?? "").split("@")[0],
    profileImage: data?.profileImage ?? "",
    role: data?.role ?? "user",
    address: addressFromDoc,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  };
}

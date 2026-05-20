import type { User as FirebaseUser } from "firebase/auth";

/* =========================================================
    ADDRESS TYPES
========================================================= */

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

/* =========================================================
    USER DOCUMENT TYPE
========================================================= */

export interface FirestoreUserDocument {
  email?: string;

  phone?: string;

  wordpressUserId?: string;

  name?: string;

  profileImage?: string;

  role?: string;

  phoneVerified?: boolean;

  authMode?: "email" | "google" | "phone";

  address?: FirestoreAddress;

  createdAt?: any;

  updatedAt?: any;
}

/* =========================================================
    GET USER INITIALS
========================================================= */

export function getUserInitials(
  name?: string
): string {
  const normalized = String(name ?? "").trim();

  if (!normalized) return "U";

  const parts = normalized
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return `${parts[0]
    .charAt(0)
    .toUpperCase()}${parts[
    parts.length - 1
  ]
    .charAt(0)
    .toUpperCase()}`;
}

/* =========================================================
    FORMAT ADDRESS
========================================================= */

export function formatAddress(
  address?: FirestoreAddress
): string {
  if (!address) return "";

  const lines: string[] = [];

  const streetLine = [
    address.streetAddress,
    address.apartment,
  ]
    .filter(Boolean)
    .join(", ");

  if (streetLine) {
    lines.push(streetLine);
  }

  const cityStatePin = [
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(", ");

  const cityStatePinWithCode =
    address.pinCode
      ? `${cityStatePin}${
          cityStatePin ? " " : ""
        }${address.pinCode}`
      : cityStatePin;

  if (cityStatePinWithCode) {
    lines.push(cityStatePinWithCode);
  }

  if (address.country) {
    lines.push(address.country);
  }

  return lines
    .filter(Boolean)
    .join("\n");
}

/* =========================================================
    GET DISPLAY NAME
========================================================= */

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

  const email =
    userDoc?.email ||
    firebaseUser?.email ||
    "";

  const username = email.split("@")[0];

  return username || "User";
}

/* =========================================================
    NORMALIZE USER DOC
========================================================= */

export function normalizeFirestoreUserDoc(
  data: Record<string, any>,
  firebaseUser?: FirebaseUser | null
): FirestoreUserDocument {
  const addressFromDoc: FirestoreAddress = {
    firstName:
      data?.address?.firstName ?? "",

    lastName:
      data?.address?.lastName ?? "",

    streetAddress:
      data?.address?.streetAddress ??
      data?.street ??
      "",

    apartment:
      data?.address?.apartment ??
      data?.apartment ??
      "",

    city:
      data?.address?.city ??
      data?.city ??
      "",

    state:
      data?.address?.state ??
      data?.state ??
      "",

    pinCode:
      data?.address?.pinCode ??
      data?.zipCode ??
      data?.postalCode ??
      data?.billing_postcode ??
      "",

    country:
      data?.address?.country ??
      data?.country ??
      "India",

    fullAddress:
      data?.address?.fullAddress ??
      data?.fullAddress ??
      "",
  };

  /* DETECT AUTH MODE */

  let authMode:
    | "email"
    | "google"
    | "phone" = "email";

  if (firebaseUser?.phoneNumber) {
    authMode = "phone";
  } else if (
    firebaseUser?.providerData?.some(
      (provider) =>
        provider.providerId ===
        "google.com"
    )
  ) {
    authMode = "google";
  }

  return {
    email:
      data?.email ??
      firebaseUser?.email ??
      "",

    phone:
      data?.phone ??
      firebaseUser?.phoneNumber ??
      "",

    wordpressUserId:
      data?.wordpressUserId ??
      data?.wordpress_user_id ??
      "",

    name:
      data?.name ??
      firebaseUser?.displayName ??
      String(
        data?.email ??
          firebaseUser?.email ??
          ""
      ).split("@")[0],

    profileImage:
      data?.profileImage ??
      firebaseUser?.photoURL ??
      "",

    role: data?.role ?? "user",

    phoneVerified:
      data?.phoneVerified ?? true,

    authMode:
      data?.authMode ?? authMode,

    address: addressFromDoc,

    createdAt: data?.createdAt,

    updatedAt: data?.updatedAt,
  };
}
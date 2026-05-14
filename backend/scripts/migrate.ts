import fs from "fs";
import { parse } from "csv-parse/sync";

import {
  initializeFirebaseAdmin,
  getFirestoreDb,
} from "../src/services/firebaseAdmin.js";

import {
  logMigration,
  createUser,
} from "../src/utils/migrationUtils.js";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function normalizeString(value?: string): string {
  return String(value ?? "").trim();
}

function buildFullAddress(user: UserCSV): string {
  return [
    normalizeString(user.billing_address_1),
    normalizeString(user.billing_address_2),
    normalizeString(user.billing_city),
    normalizeString(user.billing_state),
    normalizeString(user.billing_postcode),
    normalizeString(user.billing_country),
  ]
    .filter(Boolean)
    .join(", ");
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UserCSV {
  ID?: string;

  user_email?: string;
  billing_phone?: string;
  user_pass?: string;

  billing_first_name?: string;
  billing_last_name?: string;

  shipping_first_name?: string;
  shipping_last_name?: string;

  billing_address_1?: string;
  billing_address_2?: string;

  billing_city?: string;
  billing_state?: string;
  billing_postcode?: string;
  billing_country?: string;
}

interface AddressData {
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

// ─────────────────────────────────────────────────────────────
// Address Builder
// ─────────────────────────────────────────────────────────────

function buildAddressData(user: UserCSV): AddressData {
  const address: AddressData = {
    firstName: normalizeString(
      user.shipping_first_name || user.billing_first_name
    ),

    lastName: normalizeString(
      user.shipping_last_name || user.billing_last_name
    ),

    streetAddress: normalizeString(user.billing_address_1),

    apartment: normalizeString(user.billing_address_2),

    city: normalizeString(user.billing_city),

    state: normalizeString(user.billing_state),

    pinCode: normalizeString(user.billing_postcode),

    country: normalizeString(user.billing_country),

    fullAddress: buildFullAddress(user),
  };

  return address;
}

function hasAddressData(address: AddressData): boolean {
  return Boolean(
    address.firstName ||
      address.lastName ||
      address.streetAddress ||
      address.apartment ||
      address.city ||
      address.state ||
      address.pinCode ||
      address.country ||
      address.fullAddress
  );
}

// ─────────────────────────────────────────────────────────────
// Firebase Init
// ─────────────────────────────────────────────────────────────

initializeFirebaseAdmin();

// ─────────────────────────────────────────────────────────────
// Migration
// ─────────────────────────────────────────────────────────────

async function migrateUsers(filePath: string): Promise<void> {
  console.log("🚀 Starting user migration...");

  const startTime = Date.now();

  let recordsProcessed = 0;
  let recordsSuccessful = 0;
  let recordsFailed = 0;

  const errors: string[] = [];

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`User CSV file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");

    const users: UserCSV[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
      trim: true,
    });

    console.log(`📄 Found ${users.length} users to migrate`);

    const db = getFirestoreDb();

    for (const user of users) {
      recordsProcessed++;

      try {
        const emailKey = normalizeString(user.user_email);

        const wordpressUserIdKey = normalizeString(user.ID);

        // Skip completely invalid rows
        if (!emailKey && !wordpressUserIdKey) {
          console.warn(
            "⚠️ Skipping invalid row with no email and no wordpress_user_id"
          );

          continue;
        }

        // Skip creation if email missing
        if (!emailKey) {
          console.warn(
            `⚠️ Skipping user with wordpress_user_id=${wordpressUserIdKey} because email is missing`
          );

          continue;
        }

        const addressData = buildAddressData(user);

        // ─────────────────────────────────────────
        // Find Existing User
        // ─────────────────────────────────────────

        let userQuery = await db
          .collection("users")
          .where("email", "==", emailKey)
          .get();

        if (userQuery.empty && wordpressUserIdKey) {
          userQuery = await db
            .collection("users")
            .where("wordpressUserId", "==", wordpressUserIdKey)
            .get();
        }

        // ─────────────────────────────────────────
        // Existing User → Merge Address
        // ─────────────────────────────────────────

        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];

          const existingData = userDoc.data();

          const mergedAddress: Record<string, unknown> = {
            ...(existingData.address || {}),
          };

          if (hasAddressData(addressData)) {
            for (const [key, value] of Object.entries(addressData)) {
              if (value) {
                mergedAddress[key] = value;
              }
            }
          }

          await db
            .collection("users")
            .doc(userDoc.id)
            .set(
              {
                address: mergedAddress,
              },
              { merge: true }
            );

          console.log(
            `⏭️ User exists — merged address: ${
              user.user_email || user.ID
            }`
          );

          recordsSuccessful++;

          continue;
        }

        // ─────────────────────────────────────────
        // Create New User
        // ─────────────────────────────────────────

        const userId = await createUser({
          email: emailKey,

          phone: normalizeString(user.billing_phone),

          wordpressUserId: wordpressUserIdKey,

          legacyPasswordHash: normalizeString(user.user_pass),

          migrationStatus: "pending",

          ...(hasAddressData(addressData)
            ? { address: addressData }
            : {}),
        });

        console.log(
          `✅ Migrated user: ${user.user_email} (${userId})`
        );

        recordsSuccessful++;
      } catch (error) {
        recordsFailed++;

        const errorMsg =
          error instanceof Error
            ? error.message
            : String(error);

        const userEmailKey =
          normalizeString(user.user_email) || "undefined";

        errors.push(`${userEmailKey}: ${errorMsg}`);

        console.error(
          `❌ Failed to migrate user ${userEmailKey}:`,
          error
        );
      }
    }

    // ─────────────────────────────────────────
    // Migration Log
    // ─────────────────────────────────────────

    await logMigration({
      type: "users",
      status: "completed",

      recordsProcessed,
      recordsSuccessful,
      recordsFailed,

      errors: errors.slice(0, 10),
    });

    const duration = (
      (Date.now() - startTime) /
      1000
    ).toFixed(2);

    console.log(
      `\n✨ User migration completed in ${duration}s: ${recordsSuccessful} successful, ${recordsFailed} failed\n`
    );
  } catch (error) {
    console.error("❌ User migration failed:", error);

    await logMigration({
      type: "users",
      status: "failed",

      recordsProcessed,
      recordsSuccessful,
      recordsFailed,

      errors: [
        error instanceof Error
          ? error.message
          : String(error),
      ],
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("=======================================");
  console.log("   🌍 WordPress Address Migration");
  console.log("=======================================\n");

  const args = process.argv.slice(2);

  const usersCSV = args[0] || "data/users.csv";

  console.log(`📂 Using CSV file:`);
  console.log(`   Users: ${usersCSV}\n`);

  await migrateUsers(usersCSV);

  console.log("✅ Migration complete!");

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);

  process.exit(1);
});


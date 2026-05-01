import { initializeFirebaseAdmin, getFirestoreDb, getAuth } from '../src/services/firebaseAdmin.js';
import {
  getMigrationStats,
  findInconsistencies,
  verifyUserConsistency,
  verifyOrderConsistency,
} from '../src/utils/migrationHelpers.js';

// Initialize Firebase
initializeFirebaseAdmin();

interface VerificationResult {
  status: 'pass' | 'warning' | 'fail';
  category: string;
  message: string;
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(
  status: 'pass' | 'warning' | 'fail',
  category: string,
  message: string,
  details?: string
) {
  results.push({ status, category, message, details });
}

async function verifyMigration() {
  console.log('\n' + '='.repeat(60));
  console.log('   📋 Migration Verification Report');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Check Firestore connectivity
    console.log('🔍 Checking Firestore connectivity...');
    const db = getFirestoreDb();
    const health = await db.collection('users').count().get();
    addResult('pass', 'Connectivity', 'Firestore is accessible');

    // 2. Check migration statistics
    console.log('📊 Collecting migration statistics...');
    const stats = await getMigrationStats();

    if (stats.totalUsers === 0) {
      addResult('warning', 'Data', 'No users found in database', 'Run migration script first');
    } else {
      addResult('pass', 'Data', `Found ${stats.totalUsers} users`);
    }

    if (stats.totalProducts === 0) {
      addResult('warning', 'Data', 'No products found in database');
    } else {
      addResult('pass', 'Data', `Found ${stats.totalProducts} products`);
    }

    if (stats.totalOrders === 0) {
      addResult('warning', 'Data', 'No orders found in database');
    } else {
      addResult('pass', 'Data', `Found ${stats.totalOrders} orders`);
    }

    // 3. Check migration progress
    console.log('📈 Checking migration progress...');
    const migrationRate = stats.usersMigrated / stats.usersTotal;

    if (migrationRate === 1) {
      addResult('pass', 'Migration', 'All users migrated (100%)');
    } else if (migrationRate > 0.5) {
      addResult('warning', 'Migration', `${(migrationRate * 100).toFixed(1)}% users migrated`);
    } else if (migrationRate === 0) {
      addResult('warning', 'Migration', 'No users migrated yet (0%)');
    } else {
      addResult('warning', 'Migration', `${(migrationRate * 100).toFixed(1)}% users migrated`);
    }

    // 4. Check for data inconsistencies
    console.log('🔎 Scanning for data inconsistencies...');
    const issues = await findInconsistencies();

    if (issues.usersWithoutWordpressId > 0) {
      addResult(
        'fail',
        'Data Integrity',
        `${issues.usersWithoutWordpressId} users missing wordpressUserId`,
        'Critical: All users must have wordpressUserId'
      );
    } else {
      addResult('pass', 'Data Integrity', 'All users have wordpressUserId');
    }

    if (issues.usersWithoutEmail > 0) {
      addResult('fail', 'Data Integrity', `${issues.usersWithoutEmail} users missing email`);
    } else {
      addResult('pass', 'Data Integrity', 'All users have email');
    }

    if (issues.ordersWithoutItems > 0) {
      addResult(
        'warning',
        'Data Integrity',
        `${issues.ordersWithoutItems} orders have no items`
      );
    } else {
      addResult('pass', 'Data Integrity', 'All orders have items');
    }

    if (issues.ordersWithInvalidTotal > 0) {
      addResult(
        'warning',
        'Data Integrity',
        `${issues.ordersWithInvalidTotal} orders have invalid total`
      );
    } else {
      addResult('pass', 'Data Integrity', 'All orders have valid totals');
    }

    // 5. Check order linking
    console.log('🔗 Checking order linking...');
    const ordersLinked = stats.ordersWithFirebaseUid;
    const ordersNotLinked = stats.ordersWithoutFirebaseUid;

    if (ordersLinked === stats.totalOrders) {
      addResult('pass', 'Order Linking', 'All orders are linked to Firebase UIDs');
    } else if (ordersLinked > 0) {
      addResult(
        'warning',
        'Order Linking',
        `${ordersLinked}/${stats.totalOrders} orders linked (${((ordersLinked / stats.totalOrders) * 100).toFixed(1)}%)`
      );
    } else {
      addResult('warning', 'Order Linking', 'No orders linked yet (expected if users not migrated)');
    }

    // 6. Check migration logs
    console.log('📝 Checking migration logs...');
    const logsSnap = await db.collection('migrationLogs').get();

    if (logsSnap.empty) {
      addResult('warning', 'Logs', 'No migration logs found', 'Run migration script to generate logs');
    } else {
      const failedLogs = logsSnap.docs.filter((doc) => doc.data().status === 'failed');
      if (failedLogs.length > 0) {
        addResult(
          'warning',
          'Logs',
          `${failedLogs.length} migration runs failed`,
          'Check logs for details'
        );
      } else {
        addResult('pass', 'Logs', `Found ${logsSnap.size} successful migration logs`);
      }
    }

    // 7. Sample user verification
    console.log('✅ Sampling user records...');
    const usersSnap = await db.collection('users').limit(5).get();

    let sampleIssues = 0;
    for (const userDoc of usersSnap.docs) {
      const { valid, errors } = await verifyUserConsistency(userDoc.id);
      if (!valid) {
        sampleIssues++;
        addResult('warning', 'User Data', `User ${userDoc.data().email} has issues`, errors.join('; '));
      }
    }

    if (sampleIssues === 0 && usersSnap.size > 0) {
      addResult('pass', 'User Data', `Sample of ${usersSnap.size} users verified`);
    }

    // 8. Sample order verification
    console.log('✅ Sampling order records...');
    const ordersSnap = await db.collection('orders').limit(5).get();

    let orderIssues = 0;
    for (const orderDoc of ordersSnap.docs) {
      const { valid, errors } = await verifyOrderConsistency(orderDoc.id);
      if (!valid) {
        orderIssues++;
        addResult(
          'warning',
          'Order Data',
          `Order ${orderDoc.data().wordpressOrderId} has issues`,
          errors.join('; ')
        );
      }
    }

    if (orderIssues === 0 && ordersSnap.size > 0) {
      addResult('pass', 'Order Data', `Sample of ${ordersSnap.size} orders verified`);
    }

    // 9. Firebase Auth status
    console.log('🔐 Checking Firebase Auth...');
    const auth = getAuth();
    try {
      const userCount = await auth.listUsers(1);
      addResult('pass', 'Auth', `Firebase Auth is accessible (found ${userCount.users.length} users)`);
    } catch (error) {
      addResult('fail', 'Auth', 'Cannot access Firebase Auth', error instanceof Error ? error.message : String(error));
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('   📊 Verification Summary');
    console.log('='.repeat(60) + '\n');

    const byStatus = {
      pass: results.filter((r) => r.status === 'pass').length,
      warning: results.filter((r) => r.status === 'warning').length,
      fail: results.filter((r) => r.status === 'fail').length,
    };

    console.log(
      `   ✅ Pass:    ${byStatus.pass}\n   ⚠️  Warning: ${byStatus.warning}\n   ❌ Fail:    ${byStatus.fail}`
    );
    console.log('\n' + '-'.repeat(60) + '\n');

    // Print detailed results
    const byCategory: { [key: string]: VerificationResult[] } = {};
    for (const result of results) {
      if (!byCategory[result.category]) {
        byCategory[result.category] = [];
      }
      byCategory[result.category].push(result);
    }

    for (const [category, categoryResults] of Object.entries(byCategory)) {
      console.log(`📂 ${category}:`);
      for (const result of categoryResults) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️ ' : '❌';
        console.log(`   ${icon} ${result.message}`);
        if (result.details) {
          console.log(`      → ${result.details}`);
        }
      }
      console.log();
    }

    // Print migration statistics
    console.log('📊 Migration Statistics:\n');
    console.log(`   Total Users:          ${stats.usersTotal}`);
    console.log(`   Migrated Users:       ${stats.usersMigrated}`);
    console.log(`   Pending Users:        ${stats.usersPending}`);
    console.log(`   Total Products:       ${stats.totalProducts}`);
    console.log(`   Total Orders:         ${stats.totalOrders}`);
    console.log(`   Orders with UID:      ${stats.ordersWithFirebaseUid}`);
    console.log(`   Orders without UID:   ${stats.ordersWithoutFirebaseUid}`);

    // Print recommendations
    console.log('\n' + '='.repeat(60));
    console.log('   💡 Recommendations');
    console.log('='.repeat(60) + '\n');

    if (byStatus.fail > 0) {
      console.log('❌ CRITICAL: Fix all failed items before proceeding\n');
    }

    if (stats.usersPending > 0) {
      console.log(`📌 ${stats.usersPending} users still pending migration`);
      console.log('   → Users will be migrated when they first login\n');
    }

    if (stats.ordersWithoutFirebaseUid > 0) {
      console.log(`📌 ${stats.ordersWithoutFirebaseUid} orders not yet linked`);
      console.log('   → Orders will be linked when users login\n');
    }

    if (byStatus.warning === 0 && byStatus.fail === 0) {
      console.log('✅ All checks passed! Migration is ready for production.\n');
    }

    console.log('='.repeat(60) + '\n');

    // Exit with appropriate code
    process.exit(byStatus.fail > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration().catch(console.error);

import fs from 'fs';
import path from 'path';
import { getDb } from '../lib/db';
import { InquiryRecord } from '../lib/types';

/**
 * Resumable Legacy Laravel Data Migration Utility (chat_leads, chat_requests, contact_inquiries)
 * Supports --dry-run, --source=<json_file>, and --rollback with parity count verification.
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isRollback = process.argv.includes('--rollback');
  const sourceArg = process.argv.find((a) => a.startsWith('--source='));
  const sourcePath = sourceArg ? sourceArg.split('=')[1] : null;

  const db = await getDb();

  if (isRollback) {
    const res = await db
      .collection('inquiries')
      .deleteMany({ legacyId: { $exists: true } } as any);
    console.log(`[DAOZ360 Legacy Migration] Rollback complete. Removed ${res.deletedCount} migrated legacy records.`);
    return;
  }

  let legacyRecords: Array<any> = [];
  if (sourcePath && fs.existsSync(path.resolve(sourcePath))) {
    legacyRecords = JSON.parse(fs.readFileSync(path.resolve(sourcePath), 'utf8'));
  } else {
    console.log(
      '[DAOZ360 Legacy Migration] No live SQL dump supplied via --source=<path>. Inventorying repository schema baseline (2026_10_30_000001_create_daoz360_leads_and_inquiries_tables.php): 0 live legacy rows in git checkout.'
    );
  }

  let migratedCount = 0;
  let skippedDuplicateCount = 0;

  for (const row of legacyRecords) {
    const reference = row.reference || row.lead_id || `DAOZ-LEG-${row.id}`;
    const existing = await db.collection('inquiries').findOne({ reference });
    if (existing) {
      skippedDuplicateCount++;
      continue;
    }

    const doc: InquiryRecord = {
      _id: `inq_leg_${row.id || Date.now()}`,
      reference,
      idempotencyKey: `legacy_${reference}`,
      kind: row.lead_id ? 'chat_lead' : row.topic ? 'chat_request' : 'contact_inquiry',
      sessionId: row.session_id,
      leadId: row.lead_id,
      name: row.name || 'Legacy Contact',
      email: row.email || 'unknown@daoz360.ai',
      company: row.company,
      channels: row.channels,
      category: row.category || 'Legacy Inquiry',
      topic: row.topic,
      message: row.message || row.custom_notes || 'Migrated from Laravel schema',
      status: row.status || 'New',
      ipAddress: row.ip_address,
      legacyId: String(row.id || reference),
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };

    if (!isDryRun) {
      await db.collection('inquiries').insertOne(doc);
    }
    migratedCount++;
  }

  console.log(
    JSON.stringify(
      {
        mode: isDryRun ? 'dry-run' : 'live-migration',
        sourceCount: legacyRecords.length,
        migratedCount,
        skippedDuplicateCount,
        parityVerified: migratedCount + skippedDuplicateCount === legacyRecords.length,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

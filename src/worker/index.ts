import { ensureDatabaseIndexes, getDb } from '../lib/db';
import { processDuePublishingJobs } from '../lib/services/publishing';
import { syncWorkspaceAnalytics } from '../lib/services/analytics';

const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;
const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS || 5000);
const MAX_CONCURRENCY = Number(process.env.WORKER_MAX_CONCURRENCY || 5);

let isShuttingDown = false;

async function runRetentionCleanup(): Promise<number> {
  const db = await getDb();
  const now = new Date();
  const expiredOAuth = await db
    .collection('oauth_transactions')
    .deleteMany({ expiresAt: { $lte: now } });
  const expiredSessions = await db
    .collection('sessions')
    .deleteMany({ expiresAt: { $lte: now } });
  return expiredOAuth.deletedCount + expiredSessions.deletedCount;
}

export async function runWorkerTick(): Promise<{
  workerId: string;
  claimedCount: number;
  succeededCount: number;
  failedCount: number;
  ambiguousCount: number;
  cleanedExpiredRecords: number;
}> {
  const publishRes = await processDuePublishingJobs({
    workerId: WORKER_ID,
    maxJobs: MAX_CONCURRENCY,
  });

  const cleanedExpiredRecords = await runRetentionCleanup();

  return {
    workerId: WORKER_ID,
    ...publishRes,
    cleanedExpiredRecords,
  };
}

async function main() {
  const runOnce = process.argv.includes('--once');
  console.log(`[DAOZ360 Worker] Starting independent worker (${WORKER_ID})...`);

  const idxInfo = await ensureDatabaseIndexes();
  console.log(
    `[DAOZ360 Worker] Storage mode: ${idxInfo.mode} (${idxInfo.indexesCreated.length} indexes verified)`
  );

  if (runOnce) {
    const tick = await runWorkerTick();
    const db = await getDb();
    const workspaces = await db.collection('workspaces').find({ status: 'active' }).toArray();
    for (const ws of workspaces) {
      await syncWorkspaceAnalytics(ws._id);
    }
    console.log(`[DAOZ360 Worker] Single tick completed:`, JSON.stringify(tick));
    process.exit(0);
  }

  process.on('SIGTERM', () => {
    console.log('[DAOZ360 Worker] SIGTERM received, draining active lease...');
    isShuttingDown = true;
  });
  process.on('SIGINT', () => {
    console.log('[DAOZ360 Worker] SIGINT received, draining active lease...');
    isShuttingDown = true;
  });

  while (!isShuttingDown) {
    try {
      const tick = await runWorkerTick();
      if (tick.claimedCount > 0 || tick.cleanedExpiredRecords > 0) {
        console.log(`[DAOZ360 Worker] Cycle processed:`, JSON.stringify(tick));
      }
    } catch (err) {
      console.error('[DAOZ360 Worker] Cycle error:', err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.log('[DAOZ360 Worker] Shutdown complete.');
  process.exit(0);
}

  main();


import { ensureDatabaseIndexes, getDb } from '../lib/db';

async function main() {
  console.log('[DAOZ360 DB Setup] Initializing collections, compound tenant indexes, and TTL indexes...');
  const res = await ensureDatabaseIndexes();
  const db = await getDb();
  const usersCount = await db.collection('users').countDocuments({});
  const workspacesCount = await db.collection('workspaces').countDocuments({});
  const providersCount = await db.collection('provider_app_settings').countDocuments({});

  console.log(`[DAOZ360 DB Setup] Mode: ${res.mode}`);
  console.log(`[DAOZ360 DB Setup] Indexes Verified (${res.indexesCreated.length}):`, res.indexesCreated.join(', '));
  console.log(
    `[DAOZ360 DB Setup] Seed summary: ${usersCount} users, ${workspacesCount} workspaces, ${providersCount} provider configurations.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

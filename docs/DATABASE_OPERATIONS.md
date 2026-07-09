# Backup, Restore, Retention & Disaster Recovery

## Overview

This document covers data protection procedures for the backend's two primary data stores:

| Store       | Purpose                                              | Persistence                |
| ----------- | ---------------------------------------------------- | -------------------------- |
| **MongoDB** | Users, OTP tokens, refresh tokens, posts, email jobs | `mongo_data` Docker volume |
| **Redis**   | Rate-limit counters, blacklists, locks, OTP attempts | `redis_data` Docker volume |

---

## 1. MongoDB Backups

### 1.1 Manual Backup (mongodump)

```bash
# From the host machine
docker exec backend_mongo mongodump \
  --uri="mongodb://localhost:27017" \
  --archive="/tmp/backup_$(date +%Y%m%d_%H%M%S).archive" \
  --gzip

# Copy the archive out of the container
docker cp backend_mongo:/tmp/backup_*.archive ./backups/
```

### 1.2 Automated Daily Backup (cron)

Add to the host's crontab (`crontab -e`):

```cron
# Daily MongoDB backup at 02:00 UTC, keep 7 days
0 2 * * * docker exec backend_mongo mongodump \
  --uri="mongodb://localhost:27017" \
  --archive="/tmp/backup_$(date +\%Y\%m\%d).archive" \
  --gzip && \
  docker cp backend_mongo:/tmp/backup_$(date +\%Y\%m\%d).archive \
  /opt/backups/mongo/ && \
  docker exec backend_mongo rm /tmp/backup_$(date +\%Y\%m\%d).archive && \
  find /opt/backups/mongo/ -name "*.archive" -mtime +7 -delete
```

### 1.3 Restore from Backup

```bash
# Stop the app first to prevent writes during restore
docker compose stop app

# Restore from archive
docker cp ./backups/backup_20260709.archive backend_mongo:/tmp/restore.archive
docker exec backend_mongo mongorestore \
  --uri="mongodb://localhost:27017" \
  --archive="/tmp/restore.archive" \
  --gzip \
  --drop

# Restart
docker compose start app
```

### 1.4 Point-in-Time Recovery

For point-in-time recovery, use MongoDB Atlas continuous backups or enable
WiredTiger journaling (enabled by default) with periodic snapshots:

```bash
# Create a consistent snapshot while the DB is running
docker exec backend_mongo mongodump \
  --uri="mongodb://localhost:27017" \
  --oplog \
  --archive="/tmp/pitr_$(date +%Y%m%d_%H%M%S).archive" \
  --gzip
```

---

## 2. Redis Backups

Redis stores transient data (rate limits, blacklists, locks). Loss is
acceptable — counters reset and tokens can be re-authenticated.

### 2.1 Automatic Persistence (AOF)

Already configured in `docker-compose.yml`:

```yaml
command: redis-server --appendonly yes
```

### 2.2 Manual RDB Snapshot

```bash
docker exec backend_redis redis-cli BGSAVE
docker cp backend_redis:/data/dump.rdb ./backups/redis/
```

### 2.3 Restore

```bash
docker compose stop app redis
docker cp ./backups/redis/dump.rdb backend_redis:/data/dump.rdb
docker compose start redis app
```

---

## 3. Data Retention Policies

| Data                   | TTL                            | Enforcement                                      |
| ---------------------- | ------------------------------ | ------------------------------------------------ |
| OTP tokens             | 10 minutes                     | MongoDB TTL index (`expiresAt`) + cleanup worker |
| Expired refresh tokens | Deleted on use or after 7 days | Cleanup worker                                   |
| Revoked refresh tokens | 7 days after revocation        | Cleanup worker                                   |
| Completed email jobs   | 7 days                         | Cleanup worker                                   |
| Failed email jobs      | 7 days                         | Cleanup worker                                   |
| Rate-limit counters    | 15 minutes                     | Redis key expiry                                 |
| OTP attempt counters   | 15 minutes                     | Redis key expiry                                 |
| Token blacklists       | Remaining JWT TTL              | Redis key expiry                                 |
| Distributed locks      | 5 seconds                      | Redis PX expiry                                  |

The **cleanup worker** (`src/workers/cleanupWorker.ts`) runs hourly and
prunes records that MongoDB's TTL indexes may not have removed yet
(TTL deletion is asynchronous and can lag under load).

---

## 4. Disaster Recovery

### 4.1 Recovery Time Objectives

| Scenario          | RTO                                | RPO                       |
| ----------------- | ---------------------------------- | ------------------------- |
| Container crash   | < 30 seconds (auto-restart)        | 0 (data on volumes)       |
| Volume corruption | < 15 minutes (restore from backup) | ≤ 24 hours (daily backup) |
| Full host failure | < 1 hour (rebuild + restore)       | ≤ 24 hours                |

### 4.2 Recovery Procedures

**Container crash:**

```bash
docker compose up -d   # Docker restarts automatically (restart: unless-stopped)
```

**Database corruption:**

```bash
# 1. Stop app
docker compose stop app

# 2. Drop and restore
docker exec backend_mongo mongosh --eval "db.getSiblingDB('backend_starter').dropDatabase()"
docker exec backend_mongo mongorestore \
  --uri="mongodb://localhost:27017" \
  --archive="/tmp/backup_latest.archive" \
  --gzip

# 3. Restart
docker compose start app
```

**Complete host rebuild:**

```bash
# 1. Pull the repository
git clone <repo-url> && cd backend-starter-pack

# 2. Copy backups to the new host
scp -r backups/ newhost:/path/to/project/

# 3. Start with existing volumes or restore
docker compose up -d

# 4. If volumes are lost, restore from backup
docker compose stop app
docker exec backend_mongo mongorestore \
  --uri="mongodb://localhost:27017" \
  --archive="/tmp/backup_latest.archive" --gzip
docker compose start app
```

### 4.3 Replica Set Recovery

If the single-node replica set becomes unhealthy:

```bash
# Check replica set status
docker exec backend_mongo mongosh --eval "rs.status()"

# Re-initialize if needed (single-node)
docker exec backend_mongo mongosh --eval "
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017' }]
  })
"
```

---

## 5. Monitoring Checklist

- [ ] MongoDB replica set status: `rs.status()` shows `stateStr: "PRIMARY"`
- [ ] Backup freshness: latest backup < 24 hours old
- [ ] Cleanup worker logs: no errors in last 24 hours
- [ ] Disk usage: `mongo_data` volume < 80% capacity
- [ ] Redis memory: `INFO memory` shows `used_memory` < `maxmemory`

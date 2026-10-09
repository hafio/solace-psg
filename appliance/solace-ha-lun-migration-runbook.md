# Solace HA Appliance LUN Migration Runbook

> **Applies to:** Solace 3560 Appliance Event Broker — Redundant HA Pair  
> **Reference:** Solace Official Docs — [Replacing a LUN and Migrating the Disk Spool Files for a Redundant Appliance Event Broker Pair](https://docs.solace.com/Messaging/Guaranteed-Msg/Replacing-LUNs-and-Migrating.htm)  
> **Last Updated:** 2026-10-09

---

## Table of Contents

- [Overview](#overview)
- [Stage 1 — Pre-Replacement](#stage-1--pre-replacement)
  - [1.1 — Back Up Broker Configuration](#11--back-up-broker-configuration)
  - [1.2 — Verify Initial HA State](#12--verify-initial-ha-state)
  - [1.3 — Provide HBA WWNs to Storage Team](#13--provide-hba-wwns-to-storage-team)
  - [1.4 — Detect New LUN on Both Appliances](#14--detect-new-lun-on-both-appliances)
  - [1.5 — Confirm New LUN Visibility on Both Appliances](#15--confirm-new-lun-visibility-on-both-appliances)
  - [1.6 — Partition and Create Filesystem (Primary Only)](#16--partition-and-create-filesystem-primary-only)
  - [1.7 — Restart the Backup Appliance ⚠️](#17--restart-the-backup-appliance-)
  - [1.8 — Verify Config-Sync is Up on Both Appliances](#18--verify-config-sync-is-up-on-both-appliances)
  - [1.9 — (If Replication Enabled) Disable Reject-Msg-to-Sender on Replication Queue](#19--if-replication-enabled-disable-reject-msg-to-sender-on-replication-queue)
- [Stage 2 — Replacement (Change Window)](#stage-2--replacement-change-window)
  - [2.1 — Stop Inbound Messages / Disable Bridges](#21--stop-inbound-messages--disable-bridges)
  - [2.2 — Verify Upstream Bridge State](#22--verify-upstream-bridge-state)
  - [2.3 — Wait for Queues to Drain](#23--wait-for-queues-to-drain)
  - [2.4 — Shutdown msg-backbone (Backup First, Then Primary)](#24--shutdown-msg-backbone-backup-first-then-primary)
  - [2.5 — Verify Primary Spool State and Defragmentation](#25--verify-primary-spool-state-and-defragmentation)
  - [2.6 — Shutdown Message Spool (Primary First, Then Backup)](#26--shutdown-message-spool-primary-first-then-backup)
  - [2.7 — LUN Data Handling — Choose Option A or Option B](#27--lun-data-handling--choose-option-a-or-option-b)
    - [Option A — Migrate Data (Preserve Messages)](#-option-a--migrate-data-preserve-messages)
    - [Option B — Fresh Start (Drop All Messages)](#-option-b--fresh-start-drop-all-messages)
  - [2.8 — Configure New LUN WWN on Both Appliances](#28--configure-new-lun-wwn-on-both-appliances)
  - [2.9 — Re-enable Message Spool](#29--re-enable-message-spool)
  - [2.10 — Re-enable msg-backbone (Primary First, Then Backup)](#210--re-enable-msg-backbone-primary-first-then-backup)
  - [2.11 — Verify Config-Sync](#211--verify-config-sync)
  - [2.12 — (If Replication Enabled) Re-enable Reject-Msg-to-Sender on Replication Queue](#212--if-replication-enabled-re-enable-reject-msg-to-sender-on-replication-queue)
  - [2.13 — (Optional) Update Max Spool Usage](#213--optional-update-max-spool-usage)
  - [2.14 — Re-enable Inbound Messages / Bridges](#214--re-enable-inbound-messages--bridges)
  - [2.15 — Verify Bridges and Messaging](#215--verify-bridges-and-messaging)
- [Stage 3 — Post-Replacement](#stage-3--post-replacement)
  - [3.1 — Remove Old LUN from Both Appliances](#31--remove-old-lun-from-both-appliances)
  - [3.2 — Confirm Old LUN No Longer Visible](#32--confirm-old-lun-no-longer-visible)
  - [3.3 — Final Verification](#33--final-verification)
- [Stage 4 — Rollback](#stage-4--rollback)
  - [4.1 — Revert to Old LUN WWN](#41--revert-to-old-lun-wwn)
  - [4.2 — Re-enable Message Spool](#42--re-enable-message-spool)
  - [4.3 — Re-enable msg-backbone](#43--re-enable-msg-backbone)
  - [4.4 — Re-enable Inbound Messages / Bridges](#44--re-enable-inbound-messages--bridges)
  - [4.5 — Verify Bridges and Messaging](#45--verify-bridges-and-messaging)
- [Key Notes and Common Pitfalls](#key-notes-and-common-pitfalls)

---

## Overview

This runbook describes the end-to-end procedure for replacing a SAN LUN on a Solace HA appliance pair. Two options are available for Step 2.7:

| Option | Description | Message Impact |
|---|---|---|
| **Option A — Migrate Data** | Copy all spool data from old LUN to new LUN | ✅ All spooled messages preserved |
| **Option B — Fresh Start** | Skip data copy; reset spool on new LUN | ❌ All spooled messages discarded |

The procedure is divided into four stages:

| Stage | Description |
|---|---|
| **1. Pre-Replacement** | All preparation activities — no impact to running brokers |
| **2. Replacement** | LUN swap and service verification during the change window |
| **3. Post-Replacement** | Cleanup after successful cutover |
| **4. Rollback** | Steps to revert to the old LUN if the new LUN fails |

> ⚠️ **This procedure causes a full service disruption on both appliances in the HA pair. Plan a maintenance window accordingly.**

---

## Stage 1 — Pre-Replacement

### 1.1 — Back Up Broker Configuration

On **both** primary and backup appliances:

```
solace> copy current-config <filename>
solace> enable
solace# backup
```

Copy both backup files to an external server before proceeding.

---

### 1.2 — Verify Initial HA State

On the **primary** appliance:
```
solace-primary> show message-spool detail
```
Verify:
- `Config Status: Enabled (Primary)`
- `Operational Status: AD-Active`
- Valid `Disk Key (Primary)` and `Disk Key (Backup)` values shown

On the **backup** appliance:
```
solace-backup> show message-spool detail
```
Verify:
- `Config Status: Enabled (Backup)`
- `Operational Status: AD-Standby`

> ⚠️ Do not proceed if the HA pair is not in the correct state. Resolve any redundancy or spool issues before continuing.

---

### 1.3 — Provide HBA WWNs to Storage Team

Provide the **HBA WWN1 and WWN2** of both primary and backup appliances to the storage administrator to configure the new SAN LUN.

Wait for the storage administrator to confirm the new LUN is provisioned and obtain the **new LUN WWN**.

---

### 1.4 — Detect New LUN on Both Appliances

On **both** primary and backup appliances (as root or sysadmin):

```bash
multipath -ll
rescan-scsi-bus.sh --nosync -f -r -m
rescan-scsi-bus.sh -a
multipath -ll
```

> **Note:** If the new LUN does not appear after rescanning, confirm the SAN is correctly configured and the Solace HBA port is zoned for the new LUN, then re-run the rescan commands. If still not visible, a reboot of the appliance may be required (with approval).

---

### 1.5 — Confirm New LUN Visibility on Both Appliances

On **both** primary and backup appliances:

```
solace> show hardware details
```

Confirm:
- The new LUN appears (e.g. as `LUN 1`) with the correct size
- The LUN WWN matches what the storage administrator provided in Step 1.3

> ⚠️ **Do not proceed until the new LUN is visible on both appliances.**

---

### 1.6 — Partition and Create Filesystem (Primary Only)

Run the following command **only on the primary appliance** (as root or sysadmin):

```bash
sudo provision-lun-for-ad --lun=<wwn>
```

Where `<wwn>` is the new LUN WWN as it appears in the `multipath -ll` output (may be prefixed with `3` in `/dev/mapper/`).

> **Why primary only?** For a redundant HA pair, `provision-lun-for-ad` only needs to run on one broker — the Config-Sync facility propagates the filesystem configuration to the mate.

---

### 1.7 — Restart the Backup Appliance ⚠️

Since `provision-lun-for-ad` was run on the primary only, the **backup appliance must be restarted** to pick up the new LUN partitioning via Config-Sync:

```
solace-backup> enable
solace-backup# reload
```

> ⚠️ **This step is critical.** Without restarting the backup, the backup broker will not recognise the new LUN partitions (p1/p2), resulting in `Disk Mount Error` on the backup after migration.

Wait for the backup appliance to fully restart and rejoin the HA pair before proceeding.

---

### 1.8 — Verify Config-Sync is Up on Both Appliances

On **both** primary and backup appliances:

```
solace> show config-sync
```

Verify:
- `Admin Status: Enabled`
- `Oper Status: Up`

> ⚠️ **Do not proceed if Config-Sync is not Up.** This could result in configuration divergence after the migration.

---

### 1.9 — (If Replication Enabled) Disable Reject-Msg-to-Sender on Replication Queue

*Skip this step if no Message VPNs use Solace Replication.*

Check replication status:
```
solace> show replication details
solace> show message-vpn * replication
```

Disable reject-msg-to-sender-on-discard on the **primary** appliance for each replicated VPN:
```
solace> enable
solace# configure
solace(configure)# message-vpn <message-vpn-name>
solace(configure/message-vpn)# replication queue
solace(configure/message-vpn/replication/queue)# no reject-msg-to-sender-on-discard
```

---

## Stage 2 — Replacement (Change Window)

### 2.1 — Stop Inbound Messages / Disable Bridges

Coordinate with application teams to disable upstream bridges and stop inbound message flow to the broker being migrated.

---

### 2.2 — Verify Upstream Bridge State

Confirm that upstream bridges show `Incoming Up` (i.e. the upstream side is still active but no new messages are being sent to this broker).

---

### 2.3 — Wait for Queues to Drain

Monitor queues and wait until all messages have drained before proceeding.

> **Note:** If using Option B (Fresh Start / drop all messages), draining is not strictly required but is still recommended to minimise disruption to consuming applications.

---

### 2.4 — Shutdown msg-backbone (Backup First, Then Primary)

On the **backup** appliance first:
```
solace-backup# configure
solace-backup(configure)# service msg-backbone shutdown
All clients will be disconnected.
Do you want to continue (y/n)? y
```

Then on the **primary** appliance:
```
solace-primary# configure
solace-primary(configure)# service msg-backbone shutdown
All clients will be disconnected.
Do you want to continue (y/n)? y
```

---

### 2.5 — Verify Primary Spool State and Defragmentation

On the **primary** appliance:
```
solace-primary> show message-spool detail
```

Confirm:
- `Operational Status: AD-Active`
- `Datapath Status: Up`
- `Synchronization Status: Synced`
- All flows show **zeroes** in the `Currently Used` column
- `Defragmentation Status: Idle`

On the **backup** appliance:
```
solace-backup> show message-spool detail
```

Confirm:
- `Defragmentation Status: Idle`

> If defragmentation is not `Idle` on either broker, wait for it to complete before proceeding.

---

### 2.6 — Shutdown Message Spool (Primary First, Then Backup)

On the **primary** appliance:
```
solace-primary(configure)# hardware message-spool shutdown
All message spooling will be stopped.
Do you want to continue (y/n)? y
solace-primary(configure)# end
```

Then on the **backup** appliance:
```
solace-backup(configure)# hardware message-spool shutdown
All message spooling will be stopped.
Do you want to continue (y/n)? y
solace-backup(configure)# end
```

---

### 2.7 — LUN Data Handling — Choose Option A or Option B

---

#### ✅ Option A — Migrate Data (Preserve Messages)

Use this option if you need to **retain all spooled Guaranteed Messages** on the new LUN.

On the **primary** appliance, enter the shell:

```
solace-primary# shell redundantLunMigration
login: support
Password: <support password>
```

Elevate to root:
```bash
[support@solace-primary ~]$ su -
Password: <root or sysadmin password>
```

**Migrate AD Keys (p1 and p2):**

```bash
[root@solace-primary ~]# adkey-tool migrate \
  --src-device /dev/mapper/<old LUN wwn>p1 \
  --dest-device /dev/mapper/<new LUN wwn>p1

[root@solace-primary ~]# adkey-tool migrate \
  --src-device /dev/mapper/<old LUN wwn>p2 \
  --dest-device /dev/mapper/<new LUN wwn>p2
```

> **Note:** The LUN WWN may be prefixed with `3` in `/dev/mapper/`. For example, WWN `60:01:40:57:d2:4f:4b:77:...` appears as `/dev/mapper/360014057d24f4b77...p1`.

**Create Temporary Mount Directories:**

```bash
[root@solace-primary ~]# mkdir -p /tmp/old_lun_p1
[root@solace-primary ~]# mkdir -p /tmp/old_lun_p2
[root@solace-primary ~]# mkdir -p /tmp/new_lun_p1
[root@solace-primary ~]# mkdir -p /tmp/new_lun_p2
```

**Mount Old and New LUN Partitions:**

```bash
[root@solace-primary ~]# mount /dev/mapper/<old LUN wwn>p1 /tmp/old_lun_p1
[root@solace-primary ~]# mount /dev/mapper/<old LUN wwn>p2 /tmp/old_lun_p2
[root@solace-primary ~]# mount /dev/mapper/<new LUN wwn>p1 /tmp/new_lun_p1
[root@solace-primary ~]# mount /dev/mapper/<new LUN wwn>p2 /tmp/new_lun_p2
```

**Copy Spool Data from Old LUN to New LUN:**

```bash
[root@solace-primary ~]# cp -a /tmp/old_lun_p1/* /tmp/new_lun_p1/
[root@solace-primary ~]# cp -a /tmp/old_lun_p2/* /tmp/new_lun_p2/
```

**Unmount All Partitions:**

```bash
[root@solace-primary ~]# umount /tmp/old_lun_p1
[root@solace-primary ~]# umount /tmp/old_lun_p2
[root@solace-primary ~]# umount /tmp/new_lun_p1
[root@solace-primary ~]# umount /tmp/new_lun_p2
```

**Return to CLI:**

```bash
[root@solace-primary ~]# exit
[support@solace-primary ~]$ exit
```

Proceed to **Step 2.8**.

---

#### ❌ Option B — Fresh Start (Drop All Messages)

Use this option if you **do not need to preserve spooled messages** and want to start fresh on the new LUN. This skips the shell-level data migration entirely.

> ⚠️ **All currently spooled Guaranteed Messages will be permanently discarded.** Ensure this is agreed upon with application teams before proceeding.

No shell-level action required. Proceed directly to **Step 2.8**, then follow the Option B note in **Step 2.9** to perform the spool reset before re-enabling the spool.

---

### 2.8 — Configure New LUN WWN on Both Appliances

On the **primary** appliance:
```
solace-primary# configure
solace-primary(configure)# hardware message-spool disk-array wwn <new LUN wwn>
WARNING: To avoid the loss of messages it is important that the proper disk
migration procedure is followed. Please consult the Feature Provisioning Guide
for details. Do you want to continue (y/n)? y
```

On the **backup** appliance:
```
solace-backup# configure
solace-backup(configure)# hardware message-spool disk-array wwn <new LUN wwn>
WARNING: To avoid the loss of messages...
Do you want to continue (y/n)? y
```

> ⚠️ If this step fails on either appliance, proceed immediately to **Stage 4 — Rollback**.

---

### 2.9 — Re-enable Message Spool

> **Option B users only — perform spool reset on primary BEFORE re-enabling:**
> ```
> solace-primary# admin
> solace-primary(admin)# system message-spool
> solace-primary(admin/system/message-spool)# reset
> solace-primary(admin/system/message-spool)# end
> ```
> The `reset` command deletes all spooled messages and reinitialises the spool on the new LUN. It does **not** affect broker configuration (queues, VPNs, client profiles etc. are preserved). Use `reset full` to also reset message IDs back to 1.

On the **primary** appliance:
```
solace-primary(configure)# no hardware message-spool shutdown primary
```

On the **backup** appliance:
```
solace-backup(configure)# no hardware message-spool shutdown backup
```

Verify on both appliances:
```
solace-primary> show message-spool detail
solace-backup> show message-spool detail
```

Expected:
- Primary: `Operational Status: AD-Active`, `Disk Contents: Ready`
- Backup: `Operational Status: AD-Standby`, `Disk Contents: Ready`

---

### 2.10 — Re-enable msg-backbone (Primary First, Then Backup)

On the **primary** appliance:
```
solace-primary(configure)# no service msg-backbone shutdown
```

On the **backup** appliance:
```
solace-backup(configure)# no service msg-backbone shutdown
```

---

### 2.11 — Verify Config-Sync

On **both** appliances:
```
solace> show config-sync
```

Verify:
- `Admin Status: Enabled`
- `Oper Status: Up`

> If Config-Sync does not come up, investigate immediately to prevent configuration divergence.

---

### 2.12 — (If Replication Enabled) Re-enable Reject-Msg-to-Sender on Replication Queue

*Skip if no Message VPNs use Solace Replication.*

On the **primary** appliance:
```
solace> enable
solace# configure
solace(configure)# message-vpn <message-vpn-name>
solace(configure/message-vpn)# replication queue
solace(configure/message-vpn/replication/queue)# reject-msg-to-sender-on-discard
solace(configure/message-vpn/replication/queue)# end
```

Verify replication status:
```
solace# show replication details
solace# show message-vpn * replication
solace# show redundancy
solace# show config-sync
```

---

### 2.13 — (Optional) Update Max Spool Usage

If the new LUN has a larger capacity and you want to increase the maximum spool usage:

On the **primary** appliance:
```
solace-primary(configure)# hardware message-spool max-spool-usage <size_in_MB>
```

On the **backup** appliance:
```
solace-backup(configure)# hardware message-spool max-spool-usage <size_in_MB>
```

> **Guideline:** Each partition should be approximately 1.1× the configured max-spool-usage. E.g. for 100 GB spool, create partitions of ~110 GB each.

---

### 2.14 — Re-enable Inbound Messages / Bridges

Coordinate with application teams to re-enable upstream bridges and restore inbound message flow.

---

### 2.15 — Verify Bridges and Messaging

Confirm bridge status is `Up` / `Incoming Up` as expected.  
Perform application-level verification to confirm messaging is functioning correctly.

---

## Stage 3 — Post-Replacement

### 3.1 — Remove Old LUN from Both Appliances

After the storage administrator has **deprovisioned the old LUN** from the SAN:

On **both** primary and backup appliances (as root or sysadmin):

```bash
[root@solace ~]# multipath -ll
[root@solace ~]# rescan-scsi-bus.sh -r
```

---

### 3.2 — Confirm Old LUN No Longer Visible

On **both** appliances:
```
solace> show hardware details
```

Confirm the old LUN no longer appears in the attached devices list. The old LUN should show state `Down` or be absent entirely.

---

### 3.3 — Final Verification

Perform final end-to-end verification:
- Both brokers show correct HA redundancy state
- Message spool is `AD-Active` / `AD-Standby`
- Config-Sync is `Up`
- Application messaging verified

---

## Stage 4 — Rollback

*Execute this stage only if the new LUN fails during Stage 2 (Step 2.8 or later).*

### 4.1 — Revert to Old LUN WWN

On the **primary** appliance first, then **backup**:
```
solace-primary(configure)# hardware message-spool disk-array wwn <old LUN wwn>
solace-backup(configure)# hardware message-spool disk-array wwn <old LUN wwn>
```

---

### 4.2 — Re-enable Message Spool

On the **primary** appliance:
```
solace-primary(configure)# no hardware message-spool shutdown primary
```

On the **backup** appliance:
```
solace-backup(configure)# no hardware message-spool shutdown backup
```

---

### 4.3 — Re-enable msg-backbone

On the **primary** appliance:
```
solace-primary(configure)# no service msg-backbone shutdown
```

On the **backup** appliance:
```
solace-backup(configure)# no service msg-backbone shutdown
```

---

### 4.4 — Re-enable Inbound Messages / Bridges

Re-enable upstream bridges and restore inbound message flow.

---

### 4.5 — Verify Bridges and Messaging

Confirm bridge status is restored and messaging is functioning correctly.

---

## Key Notes and Common Pitfalls

| # | Note |
|---|---|
| 1 | **`provision-lun-for-ad` runs on primary only** — Config-Sync propagates to backup. |
| 2 | **Backup must be restarted after `provision-lun-for-ad`** (Step 1.7) — failing to do this causes `Disk Mount Error` on the backup after migration. |
| 3 | **msg-backbone shutdown: backup first, then primary** — reverse order when re-enabling (primary first). |
| 4 | **Message spool shutdown: primary first, then backup** — reverse order when re-enabling. |
| 5 | **Option A — AD key migration (`adkey-tool`) runs on primary only** — covers both p1 and p2 partitions. |
| 6 | **Option B — Spool reset must be done before `no hardware message-spool shutdown primary`** — not after. |
| 7 | **Config-Sync must be `Up` before and after** — if it's down pre-migration, stop and investigate. |
| 8 | **LUN WWN in `/dev/mapper/` may have a `3` prefix** — e.g. `60:01:40:57:...` → `/dev/mapper/360014057...`. |
| 9 | **Thick provisioning required** — thin-provisioned LUNs are not supported for Solace appliance message spool. |
| 10 | **`Disk Mount Error` on backup** — most commonly caused by missing p2 partition (backup not restarted after Step 1.6) or failed filesystem on p2. |
| 11 | **`assert-disk-ownership`** — use when `Disk Contents: Invalid` is shown (ownership conflict due to IP/CVRID change). Requires spool to be shut down first. |

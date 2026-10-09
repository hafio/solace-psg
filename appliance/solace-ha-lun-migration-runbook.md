# Solace HA Appliance LUN Migration Runbook

> **Applies to:** Solace 3560 Appliance Event Broker — Redundant HA Pair  
> **Reference:** Solace Official Docs — [Replacing a LUN and Migrating the Disk Spool Files for a Redundant Appliance Event Broker Pair](https://docs.solace.com/Messaging/Guaranteed-Msg/Replacing-LUNs-and-Migrating.htm)  
> **Last Updated:** 2026-10-09

---

## Overview

This runbook describes the end-to-end procedure for replacing a SAN LUN on a Solace HA appliance pair while preserving spooled Guaranteed Messages. The procedure is divided into four stages:

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

Disable reject-msg-to-sender-on-discard on the primary appliance for each replicated VPN:
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

### 2.7 — Migrate LUN Data (Primary Appliance Only)

> **Note:** This step preserves all spooled Guaranteed Messages. If messages do not need to be preserved, skip to Step 2.8 and perform a spool reset after configuring the new LUN WWN.

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

#### Migrate AD Keys (p1 and p2)

```bash
[root@solace-primary ~]# adkey-tool migrate \
  --src-device /dev/mapper/<old LUN wwn>p1 \
  --dest-device /dev/mapper/<new LUN wwn>p1

[root@solace-primary ~]# adkey-tool migrate \
  --src-device /dev/mapper/<old LUN wwn>p2 \
  --dest-device /dev/mapper/<new LUN wwn>p2
```

> **Note:** The LUN WWN may be prefixed with `3` in `/dev/mapper/`. For example, WWN `60:01:40:57:d2:4f:4b:77:...` appears as `/dev/mapper/360014057d24f4b77...p1`.

#### Create Temporary Mount Directories

```bash
[root@solace-primary ~]# mkdir -p /tmp/old_lun_p1
[root@solace-primary ~]# mkdir -p /tmp/old_lun_p2
[root@solace-primary ~]# mkdir -p /tmp/new_lun_p1
[root@solace-primary ~]# mkdir -p /tmp/new_lun_p2
```

#### Mount Old and New LUN Partitions

```bash
[root@solace-primary ~]# mount /dev/mapper/<old LUN wwn>p1 /tmp/old_lun_p1
[root@solace-primary ~]# mount /dev/mapper/<old LUN wwn>p2 /tmp/old_lun_p2
[root@solace-primary ~]# mount /dev/mapper/<new LUN wwn>p1 /tmp/new_lun_p1
[root@solace-primary ~]# mount /dev/mapper/<new LUN wwn>p2 /tmp/new_lun_p2
```

#### Copy Spool Data from Old LUN to New LUN

```bash
[root@solace-primary ~]# cp -a /tmp/old_lun_p1/* /tmp/new_lun_p1/
[root@solace-primary ~]# cp -a /tmp/old_lun_p2/* /tmp/new_lun_p2/
```

#### Unmount All Partitions

```bash
[root@solace-primary ~]# umount /tmp/old_lun_p1
[root@solace-primary ~]# umount /tmp/old_lun_p2
[root@solace-primary ~]# umount /tmp/new_lun_p1
[root@solace-primary ~]# umount /tmp/new_lun_p2
```

#### Return to CLI

```bash
[root@solace-primary ~]# exit
[support@solace-primary ~]$ exit
```

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
| 5 | **AD key migration (`adkey-tool`) runs on primary only** — covers both p1 and p2 partitions. |
| 6 | **Config-Sync must be `Up` before and after** — if it's down pre-migration, stop and investigate. |
| 7 | **LUN WWN in `/dev/mapper/` may have a `3` prefix** — e.g. `60:01:40:57:...` → `/dev/mapper/360014057...`. |
| 8 | **Thick provisioning required** — thin-provisioned LUNs are not supported for Solace appliance message spool. |
| 9 | **If `assert-disk-ownership` fails** — check that message spool is shut down and that you are in the correct CLI mode (`admin > system message-spool`). |
| 10 | **`Disk Mount Error` on backup** — most commonly caused by missing p2 partition (backup not restarted after Step 1.6) or failed filesystem on p2. |

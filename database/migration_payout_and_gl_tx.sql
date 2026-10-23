-- Migration to support tracking GenLayer transaction hashes and payout transaction hashes
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gl_tx_hash VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payout_tx_hash VARCHAR(255);

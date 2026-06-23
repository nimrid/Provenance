#!/bin/bash
set -e

NETWORK="local_testnet"
ACCOUNT="alice" # Make sure this account is set up and funded in stellar cli

# Ensure we are in the correct directory
cd "$(dirname "$0")"

echo "Building contract..."
cargo build --target wasm32v1-none --release
stellar contract optimize --wasm target/wasm32v1-none/release/provenance.wasm

echo "Deploying contract to $NETWORK..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/provenance.optimized.wasm \
  --source "$ACCOUNT" \
  --network "$NETWORK")

echo "Contract deployed: $CONTRACT_ID"

echo "Reading verification keys..."
# The tests show paths as ../../circuits/genesis/target/vk
VK_GENESIS_PATH="../../circuits/genesis/target/vk"
VK_TRANSFER_PATH="../../circuits/transfer/target/vk"

if [ ! -f "$VK_GENESIS_PATH" ] || [ ! -f "$VK_TRANSFER_PATH" ]; then
    echo "Verification keys not found. Ensure circuits are compiled."
    exit 1
fi

HEX_VK_GENESIS=$(xxd -p -c 100000 "$VK_GENESIS_PATH" | tr -d '\n')
HEX_VK_TRANSFER=$(xxd -p -c 100000 "$VK_TRANSFER_PATH" | tr -d '\n')

echo "Initializing contract..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$ACCOUNT" \
  --network "$NETWORK" \
  -- \
  init \
  --vk_genesis "$HEX_VK_GENESIS" \
  --vk_transfer "$HEX_VK_TRANSFER"

echo "Contract initialized successfully."

# Save CONTRACT_ID to client folder
CLIENT_ENV="../../client/.env.local"
# Remove old NEXT_PUBLIC_PROVENANCE_CONTRACT_ID if exists
touch "$CLIENT_ENV"
sed -i.bak '/NEXT_PUBLIC_PROVENANCE_CONTRACT_ID/d' "$CLIENT_ENV" || true
echo "NEXT_PUBLIC_PROVENANCE_CONTRACT_ID=$CONTRACT_ID" >> "$CLIENT_ENV"
rm -f "$CLIENT_ENV.bak"

echo "Saved CONTRACT_ID to $CLIENT_ENV"

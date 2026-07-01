const { rpc, xdr, Contract } = require('@stellar/stellar-sdk');
const server = new rpc.Server("http://localhost:8000", { allowHttp: true });

async function main() {
  const contractId = require('fs').readFileSync('/Users/hng/Prove_lux/client/.env.local', 'utf8').split('\n').find(l => l.startsWith('NEXT_PUBLIC_PROVENANCE_CONTRACT_ID=')).split('=')[1];
  const contract = new Contract(contractId);
  const hex = "2949cf0684e5e233f7948da13cee66d8dc6e5ea0562c4c5fb6fd8aab8b264213";
  const buffer = Buffer.from(hex, 'hex');
  
  const commitmentScVal = xdr.ScVal.scvBytes(buffer);
  const key = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Commitment'), commitmentScVal]);

  const ledgerKey = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
    contract: contract.address().toScAddress(),
    key: key,
    durability: xdr.ContractDataDurability.persistent()
  }));

  try {
    const res = await server.getLedgerEntries(ledgerKey);
    console.log("Found in network:", res.entries.length > 0);
  } catch (e) {
    console.error(e);
  }
}
main();

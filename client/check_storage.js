const { rpc, xdr, Contract } = require('@stellar/stellar-sdk');
const server = new rpc.Server("http://localhost:8000", { allowHttp: true });

async function main() {
  const contractId = process.env.NEXT_PUBLIC_PROVENANCE_CONTRACT_ID || require('fs').readFileSync('/Users/hng/Prove_lux/client/.env.local', 'utf8').split('\n').find(l => l.startsWith('NEXT_PUBLIC_PROVENANCE_CONTRACT_ID=')).split('=')[1];
  
  const contract = new Contract(contractId);
  const hex = "16e8341cd67e19df4036a50cc05f4194816d8e93696735bf35f1be5d9c48310b";
  const buffer = Buffer.from(hex, 'hex');
  
  const commitmentScVal = xdr.ScVal.scvBytes(buffer);
  
  // DataKey::Commitment(BytesN<32>) -> In Rust, an enum variant is represented as a vec with the variant name as symbol and the value.
  const key = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol('Commitment'),
    commitmentScVal
  ]);

  const ledgerKey = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
    contract: contract.address().toScAddress(),
    key: key,
    durability: xdr.ContractDataDurability.persistent()
  }));

  try {
    const res = await server.getLedgerEntries(ledgerKey);
    console.log("Found:", res.entries.length > 0);
  } catch (e) {
    console.error(e);
  }
}
main();

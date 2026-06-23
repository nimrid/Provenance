use dep::poseidon::poseidon2::Poseidon2;

fn hash2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

fn hash1(a: Field) -> Field {
    Poseidon2::hash([a], 1)
}

fn main(
    item_serial: Field,
    old_secret_nonce: Field,
    new_secret_nonce: Field,
) -> pub (Field, Field, Field) {
    let old_commitment = hash2(item_serial, old_secret_nonce);
    let new_commitment = hash2(item_serial, new_secret_nonce);
    let nullifier = hash1(old_secret_nonce);
    
    (old_commitment, new_commitment, nullifier)
}

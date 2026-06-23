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
    old_commitment: pub Field,
    new_commitment: pub Field,
    nullifier: pub Field,
) {
    let expected_old_commitment = hash2(item_serial, old_secret_nonce);
    assert(old_commitment == expected_old_commitment, "Invalid old commitment");

    let expected_new_commitment = hash2(item_serial, new_secret_nonce);
    assert(new_commitment == expected_new_commitment, "Invalid new commitment");

    let expected_nullifier = hash1(old_secret_nonce);
    assert(nullifier == expected_nullifier, "Invalid nullifier");
}

#[test]
fn test_valid_transfer() {
    let serial = 12345;
    let old_nonce = 88888;
    let new_nonce = 99999;
    
    let old_comm = hash2(serial, old_nonce);
    let new_comm = hash2(serial, new_nonce);
    let null = hash1(old_nonce);
    
    main(serial, old_nonce, new_nonce, old_comm, new_comm, null);
}

#[test(should_fail_with = "Invalid old commitment")]
fn test_invalid_old_commitment() {
    let serial = 12345;
    let old_nonce = 88888;
    let new_nonce = 99999;
    
    let wrong_old_comm = 123;
    let new_comm = hash2(serial, new_nonce);
    let null = hash1(old_nonce);
    
    main(serial, old_nonce, new_nonce, wrong_old_comm, new_comm, null);
}

#[test(should_fail_with = "Invalid new commitment")]
fn test_invalid_new_commitment() {
    let serial = 12345;
    let old_nonce = 88888;
    let new_nonce = 99999;
    
    let old_comm = hash2(serial, old_nonce);
    let wrong_new_comm = 123;
    let null = hash1(old_nonce);
    
    main(serial, old_nonce, new_nonce, old_comm, wrong_new_comm, null);
}

#[test(should_fail_with = "Invalid nullifier")]
fn test_invalid_nullifier() {
    let serial = 12345;
    let old_nonce = 88888;
    let new_nonce = 99999;
    
    let old_comm = hash2(serial, old_nonce);
    let new_comm = hash2(serial, new_nonce);
    let wrong_null = 123;
    
    main(serial, old_nonce, new_nonce, old_comm, new_comm, wrong_null);
}

use dep::poseidon::poseidon2::Poseidon2;

fn hash2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

fn main(
    item_serial: Field,
    secret_nonce: Field,
    commitment: pub Field,
) {
    let expected_commitment = hash2(item_serial, secret_nonce);
    assert(commitment == expected_commitment, "Invalid commitment");
}

#[test]
fn test_valid_stolen_report() {
    let serial = 12345;
    let nonce = 99999;
    
    let comm = hash2(serial, nonce);
    
    main(serial, nonce, comm);
}

#[test(should_fail_with = "Invalid commitment")]
fn test_invalid_stolen_report() {
    let serial = 12345;
    let nonce = 99999;
    
    let wrong_comm = 123;
    
    main(serial, nonce, wrong_comm);
}

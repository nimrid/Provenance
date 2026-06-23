use dep::poseidon::poseidon2::Poseidon2;
use std::ecdsa_secp256k1;

fn hash2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

fn main(
    item_serial: Field,
    secret_nonce: Field,
    authenticator_signature: [u8; 64]
) -> pub Field {
    // Hardcode the trusted authenticator's public key
    let authenticator_pubkey_x: [u8; 32] = [
        29, 150,  64,  61, 173, 148, 230,  35,
        234, 152,   4, 250,  29, 232, 249, 207,
        111, 234,  15,  87, 242, 210, 148,  29,
        100,  13, 113,  65,   6,  22,  63,  96
    ];
    let authenticator_pubkey_y: [u8; 32] = [
        251, 153, 138, 177, 148,  36, 118,
        221, 122, 191, 153, 189, 200, 232,
        219, 235, 190, 212, 132, 238, 209,
        201, 114, 108, 114,  93, 189, 105,
        58,  42,  36, 142
    ];
    // 1. The authenticator signs the Poseidon2 hash of the item_serial.
    // We use Poseidon2 here instead of SHA256 to avoid high circuit constraints,
    // since the authenticator (mocked for hackathon) can just sign this hash.
    let hashed_message_field = hash2(item_serial, 0);
    let hashed_message: [u8; 32] = hashed_message_field.to_be_bytes();
    
    // 2. Verify the authenticator's signature over the hashed serial
    let is_valid = ecdsa_secp256k1::verify_signature(
        authenticator_pubkey_x,
        authenticator_pubkey_y,
        authenticator_signature,
        hashed_message
    );
    assert(is_valid == true, "Invalid authenticator signature");

    // 3. Compute the genesis commitment
    let genesis_commitment = hash2(item_serial, secret_nonce);
    
    genesis_commitment
}

#[test]
fn test_valid_genesis() {
    let serial = 12345;
    let nonce = 99999;
    

    // Signature over Poseidon2(12345, 0)
    let sig: [u8; 64] = [
        96, 216,  32, 173,  28, 122, 207,  54, 211, 159, 167,
        139, 251,  47, 130, 230,  85, 190,  80,  60, 176,   9,
        113,  21,  16, 125,  96, 106,  27, 219, 248, 151,  34,
        175,  83, 121, 128, 242, 136, 246,  94, 165,  11, 224,
        229, 218,   3, 167, 241, 216, 147, 254, 240, 209,  71,
        162, 188, 224,  90,  75,  56, 181, 127, 237
    ];
    
    let expected_commitment = hash2(serial, nonce);
    let commitment = main(serial, nonce, sig);
    assert(commitment == expected_commitment);
}

#[test(should_fail_with = "Invalid authenticator signature")]
fn test_invalid_signature() {
    let serial = 12345;
    let nonce = 99999;
    

    let mut bad_sig = [
        96, 216,  32, 173,  28, 122, 207,  54, 211, 159, 167,
        139, 251,  47, 130, 230,  85, 190,  80,  60, 176,   9,
        113,  21,  16, 125,  96, 106,  27, 219, 248, 151,  34,
        175,  83, 121, 128, 242, 136, 246,  94, 165,  11, 224,
        229, 218,   3, 167, 241, 216, 147, 254, 240, 209,  71,
        162, 188, 224,  90,  75,  56, 181, 127, 237
    ];
    bad_sig[0] = 0;
    
    let _ = main(serial, nonce, bad_sig);
}

#[test(should_fail_with = "Invalid authenticator signature")]
fn test_wrong_serial() {
    let wrong_serial = 99999;
    let nonce = 99999;
    

    let sig: [u8; 64] = [
        96, 216,  32, 173,  28, 122, 207,  54, 211, 159, 167,
        139, 251,  47, 130, 230,  85, 190,  80,  60, 176,   9,
        113,  21,  16, 125,  96, 106,  27, 219, 248, 151,  34,
        175,  83, 121, 128, 242, 136, 246,  94, 165,  11, 224,
        229, 218,   3, 167, 241, 216, 147, 254, 240, 209,  71,
        162, 188, 224,  90,  75,  56, 181, 127, 237
    ];
    
    let _ = main(wrong_serial, nonce, sig);
}

use dep::poseidon::poseidon2::Poseidon2;
use dep::keccak256::keccak256;
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
        206, 106, 24, 26, 159, 167, 228, 218, 
        18, 116, 96, 178, 255, 32, 67, 253, 
        151, 204, 252, 150, 89, 95, 191, 127, 
        95, 178, 178, 154, 18, 229, 203, 87
    ];
    let authenticator_pubkey_y: [u8; 32] = [
        23, 208, 144, 212, 68, 219, 190, 41, 
        188, 213, 104, 166, 100, 59, 6, 132, 
        187, 190, 161, 233, 124, 20, 120, 59, 
        61, 66, 198, 206, 63, 153, 103, 28
    ];
    
    // 1. We use Keccak256 to hash the item_serial bytes.
    // item_serial is passed as a Field. We convert it to bytes.
    let item_serial_bytes: [u8; 32] = item_serial.to_be_bytes();
    let hashed_message = keccak256(item_serial_bytes, 32);
    
    // 2. Verify the authenticator's signature over the Keccak256 hashed serial
    let is_valid = ecdsa_secp256k1::verify_signature(
        authenticator_pubkey_x,
        authenticator_pubkey_y,
        authenticator_signature,
        hashed_message
    );
    assert(is_valid == true, "Invalid authenticator signature");

    // 3. Compute the genesis commitment using Poseidon2 (cheaper for standard commitments)
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

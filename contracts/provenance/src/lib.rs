#![cfg_attr(not(test), no_std)]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Bytes, BytesN, Env};
use ultrahonk_soroban_verifier::{UltraHonkVerifier, VkLoadError, PROOF_BYTES};

#[contract]
pub struct ProvenanceContract;

#[contracterror]
#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    VkInvalidLength = 2,
    VkInvalidParameters = 3,
    VkNotSet = 4,
    ProofParseError = 5,
    VerificationFailed = 6,
    UnknownCommitment = 7,
    NullifierAlreadySpent = 8,
    CommitmentAlreadyExists = 9,
}

#[contracttype]
pub enum DataKey {
    VkGenesis,
    VkTransfer,
    Commitment(BytesN<32>),
    Nullifier(BytesN<32>),
}

#[contractimpl]
impl ProvenanceContract {
    /// Initialize the contract with two immutable Verification Keys.
    pub fn init(env: Env, vk_genesis: Bytes, vk_transfer: Bytes) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::VkGenesis) {
            return Err(Error::AlreadyInitialized);
        }
        
        // Validate vk_genesis
        let _ = UltraHonkVerifier::new(&env, &vk_genesis).map_err(|e| match e {
            VkLoadError::WrongLength => Error::VkInvalidLength,
            VkLoadError::InvalidParameters => Error::VkInvalidParameters,
        })?;
        
        // Validate vk_transfer
        let _ = UltraHonkVerifier::new(&env, &vk_transfer).map_err(|e| match e {
            VkLoadError::WrongLength => Error::VkInvalidLength,
            VkLoadError::InvalidParameters => Error::VkInvalidParameters,
        })?;
        
        // TRULY IMMUTABLE: no setter function exists after constructor.
        env.storage().instance().set(&DataKey::VkGenesis, &vk_genesis);
        env.storage().instance().set(&DataKey::VkTransfer, &vk_transfer);
        
        Ok(())
    }

    /// Read-only accessor for VKs (auditing)
    pub fn vk_genesis(env: Env) -> Result<Bytes, Error> {
        env.storage().instance().get(&DataKey::VkGenesis).ok_or(Error::VkNotSet)
    }

    pub fn vk_transfer(env: Env) -> Result<Bytes, Error> {
        env.storage().instance().get(&DataKey::VkTransfer).ok_or(Error::VkNotSet)
    }

    /// Register a new genesis item into the provenance tree
    pub fn register_genesis(env: Env, genesis_commitment: BytesN<32>, proof: Bytes) -> Result<(), Error> {
        if proof.len() as usize != PROOF_BYTES {
            return Err(Error::ProofParseError);
        }

        let vk_bytes: Bytes = env.storage().instance().get(&DataKey::VkGenesis).ok_or(Error::VkNotSet)?;
        let verifier = UltraHonkVerifier::new(&env, &vk_bytes).unwrap();
        
        let public_inputs = Bytes::from_array(&env, &genesis_commitment.to_array());
        
        verifier.verify(&env, &proof, &public_inputs).map_err(|_| Error::VerificationFailed)?;
        
        let key = DataKey::Commitment(genesis_commitment.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::CommitmentAlreadyExists);
        }
        env.storage().persistent().set(&key, &true);
        
        Ok(())
    }

    /// Process a transfer of ownership, nullifying the old commitment and adding the new one.
    pub fn process_transfer(
        env: Env, 
        old_commitment: BytesN<32>, 
        new_commitment: BytesN<32>, 
        nullifier: BytesN<32>, 
        proof: Bytes
    ) -> Result<(), Error> {
        if proof.len() as usize != PROOF_BYTES {
            return Err(Error::ProofParseError);
        }

        let key_old = DataKey::Commitment(old_commitment.clone());
        if !env.storage().persistent().has(&key_old) {
            return Err(Error::UnknownCommitment);
        }

        let key_nullifier = DataKey::Nullifier(nullifier.clone());
        if env.storage().persistent().has(&key_nullifier) {
            return Err(Error::NullifierAlreadySpent);
        }

        let vk_bytes: Bytes = env.storage().instance().get(&DataKey::VkTransfer).ok_or(Error::VkNotSet)?;
        let verifier = UltraHonkVerifier::new(&env, &vk_bytes).unwrap();

        let mut public_inputs = Bytes::new(&env);
        public_inputs.append(&Bytes::from_array(&env, &old_commitment.to_array()));
        public_inputs.append(&Bytes::from_array(&env, &new_commitment.to_array()));
        public_inputs.append(&Bytes::from_array(&env, &nullifier.to_array()));

        verifier.verify(&env, &proof, &public_inputs).map_err(|_| Error::VerificationFailed)?;

        // Update state
        env.storage().persistent().set(&key_nullifier, &true);
        let key_new = DataKey::Commitment(new_commitment.clone());
        env.storage().persistent().set(&key_new, &true);

        Ok(())
    }
    
    pub fn is_commitment_valid(env: Env, commitment: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Commitment(commitment))
    }

    pub fn is_nullifier_spent(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Nullifier(nullifier))
    }
}

mod test;

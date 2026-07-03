# Provenance: 3-Minute Demo Video Script

**Target Length:** 2.5 - 3 Minutes
**Tone:** Professional, Technical, Punchy

---

### [0:00 - 0:30] Introduction & The Problem
**(Visuals)**: Split screen. Left: A high-end luxury watch. Right: A fake counterfeit listing. Then cut to the Provenance landing page, showcasing the luxury aesthetic.
**(Audio/Voiceover)**: 
"Counterfeiting is a multi-billion dollar problem in the luxury goods market. Existing blockchain solutions try to fix this by putting serial numbers on-chain, but that creates a massive privacy leak for buyers. 

Enter **Provenance**. 

We built a decentralized, zero-knowledge authentication platform on the Stellar network. We completely decouple a physical item’s identity from the public ledger. Your identity remains hidden. The authenticity remains absolute. Let’s see how it works."

---

### [0:30 - 1:10] Flow 1: The Manufacturer (Genesis Minting)
**(Visuals)**: Screen recording of the `/admin` Manufacturer Dashboard. The presenter clicks "Tap NFC to Autofill Serial". A quick pop-up or split-screen shows a phone tapping a physical NFC tag. The fields populate. They click "Generate Proof", then "Register on Stellar".
**(Audio/Voiceover)**: 
"It starts with the manufacturer. Here, we scan the embedded NFC chip inside a new luxury watch. The app takes the physical serial number and a randomly generated 'Secret Nonce' and generates a Zero-Knowledge proof locally. 

When we register the item on Stellar, we are *only* publishing a cryptographic commitment. The actual serial number and the secret nonce are never published. The smart contract, written in Rust using Soroban, verifies the proof using an UltraHonk verifier and logs the commitment. 

The physical watch and the Secret Nonce are then shipped to the first buyer."

---

### [1:10 - 1:50] Flow 2: The Owner (Secure ZK Transfer)
**(Visuals)**: Switch to the `/transfer` page. The user inputs their serial number, the old secret, and generates a new secret. They click generate proof, approve the Freighter wallet transaction, and a success message appears.
**(Audio/Voiceover)**: 
"Months later, the owner wants to sell the watch. In a traditional system, they'd have to dox their transaction history. With Provenance, the owner simply inputs the watch's serial number and their current secret to generate a *new* secret for the buyer.

Our backend seamlessly executes Noir and Barretenberg to generate a ZK transfer proof. (Note: for this demo, proving runs on our stateless backend, but our V2 architecture moves this entirely to client-side WebAssembly). 

The smart contract verifies the proof, nullifies the old commitment to prevent double-spending, and registers the new buyer's commitment."

---

### [1:50 - 2:30] Flow 3: The True Owner (Report Stolen)
**(Visuals)**: Cut to the `/stolen` page. User inputs their details and clicks "Report Stolen". Then immediately switch to the `/verify` page. The presenter pastes the commitment hash. A giant red "⚠️ REPORTED STOLEN" warning appears on the screen.
**(Audio/Voiceover)**: 
"But what if the physical watch is stolen? 

Because the thief doesn't know the cryptographic Secret Nonce, they can't transfer the digital ownership. But the true owner can use their secret to flag the item as stolen. 

They generate a proof proving ownership of the secret, and the Soroban contract flags the commitment. 

Now, if the thief tries to sell the watch on the secondary market, any buyer who checks the commitment hash on our Verification portal is immediately met with a massive red warning. The buyer is protected, and the thief is stuck with an unsellable asset."

---

### [2:30 - 3:00] Conclusion
**(Visuals)**: Show the Stellar Expert explorer highlighting the extremely low fees and fast settlement times of the transactions just made. Fade back to the Provenance logo.
**(Audio/Voiceover)**: 
"By leveraging Noir’s zero-knowledge circuits and Soroban’s lightning-fast, low-fee smart contracts on the Stellar network, Provenance solves the physical-to-digital bridge for luxury goods. 

We provide manufacturers with unbreakable authenticity, and users with complete financial privacy.

Thank you for watching."

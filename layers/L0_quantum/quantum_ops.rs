//! Layer: L0 – Quantum
//! Module: Quantum operations and visualization data.

use serde::Serialize;
use rand::Rng;

#[derive(Serialize)]
pub struct QuantumState {
    pub entropy: f32,
    pub qubits: Vec<f32>,
    pub key_fragment: String,
}

pub struct QuantumService;

impl QuantumService {
    pub fn get_current_state() -> QuantumState {
        let mut rng = rand::thread_rng();
        QuantumState {
            entropy: rng.gen_range(0.85..0.99),
            qubits: (0..8).map(|_| rng.gen()).collect(),
            key_fragment: (0..16)
                .map(|_| rng.sample(rand::distributions::Alphanumeric) as char)
                .collect(),
        }
    }
}

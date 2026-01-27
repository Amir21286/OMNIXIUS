//! Layer: L0 – Quantum
//! Module: Quantum mutator primitives for L3 evolutionary engines.
//!
//! This is a "quantum-inspired" implementation: it derives mutation intensity
//! from stochastic sampling, then applies smooth perturbations to genes.

use rand::Rng;
use rand_distr::{Distribution, Normal};

use crate::layers::l3_organisms::o4_day_mohk::phoenix_engine::{Dna, QuantumMutator};

/// Quantum-inspired mutation operator.
///
/// - `mutation_rate`: probability of mutating each gene.
/// - `sigma`: standard deviation of gaussian perturbation.
#[derive(Clone, Debug)]
pub struct L0QuantumMutator {
    pub mutation_rate: f32,
    pub sigma: f32,
}

impl Default for L0QuantumMutator {
    fn default() -> Self {
        Self {
            mutation_rate: 0.08,
            sigma: 0.12,
        }
    }
}

impl L0QuantumMutator {
    fn clamp01(x: f32) -> f32 {
        x.max(0.0).min(1.0)
    }
}

impl QuantumMutator for L0QuantumMutator {
    fn quantum_mutate(&self, dna: &mut Dna) {
        if dna.genes.is_empty() {
            return;
        }

        // "Quantum noise" ≈ gaussian distribution.
        // If sigma is invalid, fall back to a small constant.
        let sigma = if self.sigma.is_finite() && self.sigma > 0.0 {
            self.sigma
        } else {
            0.05
        };
        let normal = Normal::new(0.0, sigma as f64).unwrap_or_else(|_| Normal::new(0.0, 0.05).unwrap());

        let mut rng = rand::thread_rng();

        for g in &mut dna.genes {
            if rng.gen::<f32>() <= self.mutation_rate {
                let delta = normal.sample(&mut rng) as f32;
                *g = Self::clamp01(*g + delta);
            }
        }
    }
}


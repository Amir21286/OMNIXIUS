//! Layer: L-1 – Energy
//! Module: Quantum Field Energy & Generation

use serde::Serialize;
use rand::Rng;

#[derive(Serialize, Clone)]
pub struct EnergyState {
    pub total_energy: f64,
    pub field_stability: f32,
    pub flux_rate: f32,
}

pub struct EnergyService {
    current_energy: f64,
}

impl EnergyService {
    pub fn new() -> Self {
        Self { current_energy: 100.0 }
    }

    pub fn update(&mut self, population_size: usize) -> EnergyState {
        let mut rng = rand::thread_rng();
        
        // Energy grows based on population complexity (L3)
        let growth = (population_size as f64 * 0.05) + rng.gen_range(0.01..0.1);
        self.current_energy += growth;

        EnergyState {
            total_energy: self.current_energy,
            field_stability: rng.gen_range(0.95..1.0),
            flux_rate: growth as f32,
        }
    }
}

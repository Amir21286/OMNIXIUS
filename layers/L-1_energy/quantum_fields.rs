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
    activity_multiplier: f64,
}

impl EnergyService {
    pub fn new() -> Self {
        Self { 
            current_energy: 100.0,
            activity_multiplier: 1.0,
        }
    }

    pub fn update(&mut self, population_size: usize) -> EnergyState {
        let mut rng = rand::thread_rng();
        
        // Base growth from population + activity multiplier
        let base_growth = (population_size as f64 * 0.05) * self.activity_multiplier;
        let random_flux = rng.gen_range(0.01..0.1);
        let total_growth = base_growth + random_flux;
        
        self.current_energy += total_growth;

        // Decay multiplier slowly back to 1.0 to encourage continuous activity
        if self.activity_multiplier > 1.0 {
            self.activity_multiplier -= 0.001;
        }

        EnergyState {
            total_energy: self.current_energy,
            field_stability: rng.gen_range(0.95..1.0),
            flux_rate: total_growth as f32,
        }
    }

    pub fn add_activity_energy(&mut self, amount: f64) {
        // Direct energy boost from activity
        self.current_energy += amount;
        // Temporarily boost growth rate
        self.activity_multiplier = (self.activity_multiplier + 0.05).min(5.0);
    }

    pub fn convert_to_ixi(&mut self, amount_energy: f64) -> Result<f64, String> {
        if self.current_energy < amount_energy {
            return Err("Insufficient energy in field".to_string());
        }
        self.current_energy -= amount_energy;
        // Conversion rate: 10 GeV = 1 IXI
        Ok(amount_energy / 10.0)
    }
}

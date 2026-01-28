//! Layer: L6 – Astra / Global Events
//! Module: Global Event System

use serde::Serialize;
use rand::Rng;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Clone, Debug)]
pub enum EventType {
    QuantumStorm,   // Faster evolution, unstable energy
    EconomicBoom,   // More IXI rewards
    NoosphereSilence, // Oracle is offline, but research is cheaper
    Normal,
}

#[derive(Serialize, Clone, Debug)]
pub struct GlobalEvent {
    pub event_type: EventType,
    pub intensity: f32,
    pub message: String,
    pub expires_at: u64,
}

pub struct EventService {
    current_event: GlobalEvent,
}

impl EventService {
    pub fn new() -> Self {
        Self {
            current_event: GlobalEvent {
                event_type: EventType::Normal,
                intensity: 1.0,
                message: "Multiverse is stable.".to_string(),
                expires_at: 0,
            }
        }
    }

    pub fn get_current(&self) -> GlobalEvent {
        self.current_event.clone()
    }

    pub fn update(&mut self) -> GlobalEvent {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        if now > self.current_event.expires_at {
            let mut rng = rand::thread_rng();
            let chance = rng.gen_range(0..100);
            
            if chance < 15 {
                self.current_event = GlobalEvent {
                    event_type: EventType::QuantumStorm,
                    intensity: rng.gen_range(1.5..3.0),
                    message: "QUANTUM STORM DETECTED: Evolution rate tripled!".to_string(),
                    expires_at: now + 120,
                };
            } else if chance < 25 {
                self.current_event = GlobalEvent {
                    event_type: EventType::EconomicBoom,
                    intensity: rng.gen_range(2.0..5.0),
                    message: "ECONOMIC BOOM: Energy conversion rewards doubled!".to_string(),
                    expires_at: now + 180,
                };
            } else {
                self.current_event = GlobalEvent {
                    event_type: EventType::Normal,
                    intensity: 1.0,
                    message: "Multiverse is stable.".to_string(),
                    expires_at: now + 60,
                };
            }
        }
        self.current_event.clone()
    }
}

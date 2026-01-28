//! Layer: L2 – Noosphere
//! Module: Collective Intelligence & AI Oracle

use serde::Serialize;
use rand::seq::SliceRandom;

#[derive(Serialize)]
pub struct OracleMessage {
    pub author: String,
    pub content: String,
    pub timestamp: String,
}

pub struct NoosphereService;

impl NoosphereService {
    const QUOTES: &'static [&'static str] = &[
        "Evolution is not a destination, but a state of constant flux.",
        "The quantum observer changes the reality of the organism.",
        "Collective consciousness emerges from the complexity of L3.",
        "Chronos records all, but the Noosphere understands all.",
        "Mutation is the engine of possibility.",
    ];

    pub fn get_advice() -> OracleMessage {
        let mut rng = rand::thread_rng();
        OracleMessage {
            author: "Noosphere Oracle".to_string(),
            content: self::NoosphereService::QUOTES.choose(&mut rng).unwrap().to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

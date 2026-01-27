//! Layer: L1 – Chronos
//! Module: Persistence / checkpoint storage for L3 evolutionary engines.
//!
//! For now this provides a local, deterministic storage backend (file-based),
//! while remaining compatible with a future on-chain backend.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::layers::l3_organisms::o4_day_mohk::phoenix_engine::{BlockchainStorage, Organism};

/// File-backed storage for population snapshots (JSON).
///
/// This is a practical stand-in for an on-chain backend: it gives us a stable,
/// testable interface for L3 while L1's Move contracts evolve.
#[derive(Clone, Debug)]
pub struct L1ChronosFileStorage {
    root: PathBuf,
}

impl L1ChronosFileStorage {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    fn checkpoint_path(&self, checkpoint_id: &str) -> PathBuf {
        // Keep filenames safe-ish. (No directories, no separators)
        let safe = checkpoint_id
            .chars()
            .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
            .collect::<String>();

        self.root.join(format!("{safe}.population.json"))
    }

    fn ensure_root(&self) -> Result<(), io::Error> {
        fs::create_dir_all(&self.root)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum L1ChronosError {
    #[error("io error: {0}")]
    Io(#[from] io::Error),
    #[error("serde json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("checkpoint not found: {0}")]
    NotFound(String),
}

// We store exactly what L3 expects, but keep a versioned envelope for future migrations.
#[derive(Clone, Debug, Serialize, Deserialize)]
struct SnapshotV1 {
    version: u32,
    population: Vec<Organism>,
}

impl BlockchainStorage for L1ChronosFileStorage {
    type Error = L1ChronosError;

    fn load_population(&self, checkpoint_id: &str) -> Result<Vec<Organism>, Self::Error> {
        let path = self.checkpoint_path(checkpoint_id);
        if !Path::new(&path).exists() {
            return Err(L1ChronosError::NotFound(checkpoint_id.to_string()));
        }

        let bytes = fs::read(&path)?;
        let snap: SnapshotV1 = serde_json::from_slice(&bytes)?;
        Ok(snap.population)
    }

    fn store_population(
        &mut self,
        checkpoint_id: &str,
        population: &[Organism],
    ) -> Result<(), Self::Error> {
        self.ensure_root()?;

        let path = self.checkpoint_path(checkpoint_id);
        let snap = SnapshotV1 {
            version: 1,
            population: population.to_vec(),
        };
        let bytes = serde_json::to_vec_pretty(&snap)?;
        fs::write(&path, bytes)?;
        Ok(())
    }
}


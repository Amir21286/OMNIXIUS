//! Layer: L3 – Organisms (O4 Day Mohk)
//! Module: Phoenix Engine – evolutionary engine with quantum mutations and blockchain recovery.
//!
//! This engine is designed to sit at L3_organisms and communicate "downwards"
//! with:
//! - L0 (quantum) for mutation primitives
//! - L1 (chronos/blockchain) for temporal snapshots and recovery.

use std::fmt;

/// Unique identifier of an organism inside the simulation.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct OrganismId(pub u64);

/// Simple DNA representation.
///
/// In higher fidelity versions this can be replaced by:
/// - bit-level genomes
/// - arbitrary symbolic genomes
/// - compressed encodings (see `.cursorrules` – serialization = bincode + compression).
#[derive(Clone, Debug)]
pub struct Dna {
    /// Continuous-valued genes in \[0.0, 1.0\].
    pub genes: Vec<f32>,
}

impl Dna {
    pub fn new_random(len: usize, rng: &mut impl rand::Rng) -> Self {
        let genes = (0..len).map(|_| rng.gen()).collect();
        Self { genes }
    }
}

/// Organism living in the Phoenix Engine population.
#[derive(Clone, Debug)]
pub struct Organism {
    pub id: OrganismId,
    pub dna: Dna,
    /// Cached fitness score for the last evaluation.
    pub fitness: f32,
}

/// Trait that must be implemented by the L0 quantum layer.
///
/// The idea is that L0 can provide genuinely "non-classical" mutation
/// operators (e.g. sampling from simulated quantum circuits).
pub trait QuantumMutator {
    /// Perform an in‑place quantum mutation on the provided DNA.
    fn quantum_mutate(&self, dna: &mut Dna);
}

/// Trait that must be implemented by the L1 blockchain/chronos layer.
///
/// L1 is responsible for time-stamping and persisting evolutionary states.
pub trait BlockchainStorage {
    type Error: std::error::Error + Send + Sync + 'static;

    /// Load a historical population snapshot from blockchain by `checkpoint_id`.
    fn load_population(&self, checkpoint_id: &str) -> Result<Vec<Organism>, Self::Error>;

    /// Store a population snapshot on-chain.
    fn store_population(
        &self,
        checkpoint_id: &str,
        population: &[Organism],
    ) -> Result<(), Self::Error>;
}

/// Error type local to the Phoenix Engine.
#[derive(Debug)]
pub enum PhoenixError<E> {
    /// Error bubbled up from the blockchain storage layer.
    Blockchain(E),
    /// Other engine-level errors.
    Engine(String),
}

impl<E: fmt::Display> fmt::Display for PhoenixError<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PhoenixError::Blockchain(e) => write!(f, "blockchain error: {e}"),
            PhoenixError::Engine(msg) => write!(f, "engine error: {msg}"),
        }
    }
}

impl<E: std::error::Error + 'static> std::error::Error for PhoenixError<E> {}

/// Core Phoenix Engine.
///
/// Generic over:
/// - `Q`: provider of quantum mutations from L0
/// - `B`: blockchain storage from L1
pub struct PhoenixEngine<Q, B> {
    pub layer_id: &'static str,
    pub generation: u64,
    pub population: Vec<Organism>,
    quantum: Q,
    blockchain: B,
}

impl<Q, B> PhoenixEngine<Q, B> {
    /// Returns the current population size.
    pub fn population_size(&self) -> usize {
        self.population.len()
    }
}

impl<Q, B> PhoenixEngine<Q, B>
where
    Q: QuantumMutator,
    B: BlockchainStorage,
{
    /// Construct a new Phoenix Engine from an initial population.
    pub fn new(layer_id: &'static str, quantum: Q, blockchain: B, population: Vec<Organism>) -> Self {
        Self {
            layer_id,
            generation: 0,
            population,
            quantum,
            blockchain,
        }
    }

    /// Main evolutionary step.
    ///
    /// This is intentionally simple and does **not** fix the fitness function –
    /// caller is responsible for pre‑computing `Organism.fitness` before calling.
    ///
    /// Basic pipeline:
    /// 1. Сelect fittest parents (tournament selection).
    /// 2. Crossover DNA.
    /// 3. Apply quantum mutations from L0.
    /// 4. Replace population with new offspring.
    pub fn evolve(&mut self, rng: &mut impl rand::Rng, offspring_count: usize) {
        if self.population.is_empty() {
            return;
        }

        let mut new_population = Vec::with_capacity(offspring_count);

        for _ in 0..offspring_count {
            let parent_a = self.tournament_select(rng, 3);
            let parent_b = self.tournament_select(rng, 3);

            let mut child_dna = self.crossover(&parent_a.dna, &parent_b.dna, rng);

            // Quantum mutation from L0.
            self.quantum.quantum_mutate(&mut child_dna);

            let id = OrganismId(rng.gen());
            new_population.push(Organism {
                id,
                dna: child_dna,
                // Fitness must be evaluated by higher-level layer after evolve().
                fitness: 0.0,
            });
        }

        self.population = new_population;
        self.generation += 1;
    }

    /// Restore population state from L1 blockchain.
    pub fn recover_from_blockchain(
        &mut self,
        checkpoint_id: &str,
    ) -> Result<(), PhoenixError<B::Error>> {
        let snapshot = self
            .blockchain
            .load_population(checkpoint_id)
            .map_err(PhoenixError::Blockchain)?;

        if snapshot.is_empty() {
            return Err(PhoenixError::Engine(format!(
                "empty snapshot for checkpoint_id={checkpoint_id}"
            )));
        }

        self.population = snapshot;
        Ok(())
    }

    /// Persist current population state to blockchain.
    pub fn checkpoint_to_blockchain(
        &self,
        checkpoint_id: &str,
    ) -> Result<(), PhoenixError<B::Error>> {
        self.blockchain
            .store_population(checkpoint_id, &self.population)
            .map_err(PhoenixError::Blockchain)
    }

    /// Simple tournament selection (higher fitness is better).
    fn tournament_select(&self, rng: &mut impl rand::Rng, k: usize) -> &Organism {
        use rand::seq::SliceRandom;

        let k = k.min(self.population.len()).max(1);
        let mut best: Option<&Organism> = None;

        for _ in 0..k {
            let candidate = self
                .population
                .choose(rng)
                .expect("population is non-empty; guarded above");

            if let Some(current_best) = &best {
                if candidate.fitness > current_best.fitness {
                    best = Some(candidate);
                }
            } else {
                best = Some(candidate);
            }
        }

        best.expect("tournament selection must yield at least one organism")
    }

    /// One-point crossover.
    fn crossover(&self, a: &Dna, b: &Dna, rng: &mut impl rand::Rng) -> Dna {
        let len = a.genes.len().min(b.genes.len());
        if len == 0 {
            return Dna { genes: Vec::new() };
        }

        let point = rng.gen_range(1..len);
        let mut genes = Vec::with_capacity(len);
        genes.extend_from_slice(&a.genes[..point]);
        genes.extend_from_slice(&b.genes[point..len]);

        Dna { genes }
    }
}

// --- Tests -----------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Clone, Default)]
    struct DummyQuantumMutator;

    impl QuantumMutator for DummyQuantumMutator {
        fn quantum_mutate(&self, dna: &mut Dna) {
            // Simple, deterministic "quantum-like" mutation for testing:
            for g in &mut dna.genes {
                *g = (*g + 0.5).fract();
            }
        }
    }

    #[derive(Default)]
    struct InMemoryBlockchain {
        pub store: std::collections::HashMap<String, Vec<Organism>>,
    }

    #[derive(Debug)]
    enum InMemError {
        NotFound,
    }

    impl fmt::Display for InMemError {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            match self {
                InMemError::NotFound => write!(f, "checkpoint not found"),
            }
        }
    }

    impl std::error::Error for InMemError {}

    impl BlockchainStorage for InMemoryBlockchain {
        type Error = InMemError;

        fn load_population(&self, checkpoint_id: &str) -> Result<Vec<Organism>, Self::Error> {
            self.store
                .get(checkpoint_id)
                .cloned()
                .ok_or(InMemError::NotFound)
        }

        fn store_population(
            &self,
            checkpoint_id: &str,
            population: &[Organism],
        ) -> Result<(), Self::Error> {
            self.store
                .insert(checkpoint_id.to_string(), population.to_vec());
            Ok(())
        }
    }

    #[test]
    fn evolution_and_recovery_pipeline_works() {
        let mut rng = rand::thread_rng();
        let quantum = DummyQuantumMutator::default();
        let mut blockchain = InMemoryBlockchain::default();

        // Initial population.
        let population: Vec<Organism> = (0..8)
            .map(|i| Organism {
                id: OrganismId(i),
                dna: Dna::new_random(4, &mut rng),
                fitness: i as f32, // strictly increasing fitness
            })
            .collect();

        let mut engine = PhoenixEngine::new("L3_organisms::O4_day_mohk", quantum, &mut blockchain, population);

        // Checkpoint generation 0.
        engine
            .checkpoint_to_blockchain("gen0")
            .expect("checkpoint gen0 must succeed");

        // Evolve to next generation.
        engine.evolve(&mut rng, 8);
        assert_eq!(engine.population_size(), 8);
        assert_eq!(engine.generation, 1);

        // Recover from gen0 snapshot.
        engine
            .recover_from_blockchain("gen0")
            .expect("recovery from gen0 must succeed");
        assert_eq!(engine.generation, 1, "generation counter is not rewound automatically");
        assert_eq!(engine.population_size(), 8);
    }
}


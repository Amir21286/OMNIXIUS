use omnixius::layers::l0_quantum::quantum_mutator::L0QuantumMutator;
use omnixius::layers::l1_chronos::chronos_storage::L1ChronosFileStorage;
use omnixius::layers::l3_organisms::o4_day_mohk::phoenix_engine::{
    Dna, Organism, OrganismId, PhoenixEngine,
};

fn evaluate_fitness(dna: &Dna) -> f32 {
    // Demo fitness: prefer mid-to-high genes with slight penalty for extreme values.
    // Range: roughly [0..genes_len]
    dna.genes
        .iter()
        .map(|&g| {
            // peak around 0.8, mild penalty near 0.0 or 1.0
            let target = 0.8_f32;
            1.0 - (g - target).abs()
        })
        .sum::<f32>()
        .max(0.0)
}

fn population_stats(pop: &[Organism]) -> (f32, f32, f32) {
    let n = pop.len().max(1) as f32;
    let best = pop
        .iter()
        .map(|o| o.fitness)
        .fold(f32::NEG_INFINITY, f32::max);
    let worst = pop
        .iter()
        .map(|o| o.fitness)
        .fold(f32::INFINITY, f32::min);
    let mean = pop.iter().map(|o| o.fitness).sum::<f32>() / n;
    (best, mean, worst)
}

fn main() {
    let mut rng = rand::thread_rng();

    // L0: quantum-inspired mutator
    let quantum = L0QuantumMutator {
        mutation_rate: 0.10,
        sigma: 0.15,
    };

    // L1: chronos storage (file-backed, versioned JSON snapshots)
    let storage_root = std::path::PathBuf::from("layers/L1_chronos/checkpoints");
    let blockchain = L1ChronosFileStorage::new(storage_root);

    // Initial population
    let population_size = 32usize;
    let dna_len = 12usize;
    let mut population: Vec<Organism> = (0..population_size)
        .map(|i| Organism {
            id: OrganismId(i as u64),
            dna: Dna::new_random(dna_len, &mut rng),
            fitness: 0.0,
        })
        .collect();

    // Evaluate initial fitness
    for o in &mut population {
        o.fitness = evaluate_fitness(&o.dna);
    }

    // L3: Phoenix Engine
    let mut engine = PhoenixEngine::new("L3_organisms::O4_day_mohk", quantum, blockchain, population);

    println!("== OMNIXIUS Demo: Phoenix Engine ==");
    println!("population={}, dna_len={}", engine.population_size(), dna_len);

    let generations = 8u64;
    for g in 0..generations {
        let (best, mean, worst) = population_stats(&engine.population);
        println!(
            "gen {:>2} | best {:>7.3} | mean {:>7.3} | worst {:>7.3}",
            g, best, mean, worst
        );

        // Save checkpoint at generation 0 and mid-run.
        if g == 0 || g == generations / 2 {
            let checkpoint_id = format!("demo_gen_{g}");
            engine
                .checkpoint_to_blockchain(&checkpoint_id)
                .unwrap_or_else(|e| panic!("checkpoint failed: {e}"));
            println!("  checkpoint saved: {checkpoint_id}");
        }

        // Evolve (creates offspring with fitness=0.0)
        engine.evolve(&mut rng, population_size);

        // Re-evaluate fitness after evolution
        for o in &mut engine.population {
            o.fitness = evaluate_fitness(&o.dna);
        }
    }

    // Demonstrate recovery from a previous checkpoint
    println!("\n== Recovery demo ==");
    engine
        .recover_from_blockchain("demo_gen_0")
        .unwrap_or_else(|e| panic!("recovery failed: {e}"));
    println!(
        "recovered checkpoint demo_gen_0 | generation counter still = {} | pop={}",
        engine.generation,
        engine.population_size()
    );
    let (best, mean, worst) = population_stats(&engine.population);
    println!(
        "after recovery | best {:>7.3} | mean {:>7.3} | worst {:>7.3}",
        best, mean, worst
    );
}


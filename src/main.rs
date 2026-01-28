use omnixius::api::{self, AppState, HistoryPoint};
use omnixius::layers::l_minus_1_energy::EnergyService;
use omnixius::layers::l0_quantum::L0QuantumMutator;
use omnixius::layers::l1_chronos::L1ChronosFileStorage;
use omnixius::layers::l1_economy::EconomyService;
use omnixius::layers::l2_academy::AcademyService;
use omnixius::layers::l3_organisms::o4_day_mohk::phoenix_engine::{PhoenixEngine, Organism, Dna, OrganismId};
use omnixius::layers::l4_oikoumene::auth::AuthService;
use omnixius::layers::l4_oikoumene::social::SocialService;
use omnixius::layers::l5_telesophy::CommunicationService;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use std::time::Duration;
use sqlx::sqlite::SqlitePoolOptions;
use tokio::time;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // 1. Initialize Database
    let database_url = "sqlite:omnixius.db?mode=rwc";
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .expect("Failed to connect to SQLite");

    // 2. Initialize Components
    let quantum = L0QuantumMutator::default();
    let storage_root = PathBuf::from("layers/L1_chronos/checkpoints");
    let blockchain = L1ChronosFileStorage::new(storage_root);
    
    // 3. Initial Population
    let mut rng = rand::thread_rng();
    let population: Vec<Organism> = (0..12)
        .map(|i| Organism {
            id: OrganismId(i as u64),
            dna: Dna::new_random(8, &mut rng),
            fitness: 0.0,
        })
        .collect();

    // 4. Create Engine
    let engine = PhoenixEngine::new(
        "L3_organisms::O4_day_mohk",
        quantum,
        blockchain,
        population
    );
    
    // 5. Create Services
    let auth = AuthService::new(pool.clone(), "SUPER_SECRET_HACKER_KEY_123".to_string()).await;
    let economy = EconomyService::new(pool.clone()).await;
    let comms = CommunicationService::new(pool.clone()).await;
    let academy = AcademyService::new(pool.clone()).await;
    let social = SocialService::new(pool.clone()).await;
    let energy = EnergyService::new();

    // 6. Create Shared State
    let state = Arc::new(AppState {
        energy: Arc::new(Mutex::new(energy)),
        engine: Arc::new(Mutex::new(engine)),
        auth: Arc::new(auth),
        economy: Arc::new(economy),
        comms: Arc::new(comms),
        academy: Arc::new(academy),
        social: Arc::new(social),
        history: Arc::new(Mutex::new(Vec::new())),
    });

    // 7. Background Auto-Evolution
    let state_for_task = Arc::clone(&state);
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            let mut engine = state_for_task.engine.lock().unwrap();
            let mut history = state_for_task.history.lock().unwrap();
            let mut rng = rand::thread_rng();
            
            let pop_size = engine.population_size();
            engine.evolve(&mut rng, pop_size);

            let mut best_f = 0.0;
            for org in &mut engine.population {
                org.fitness = org.dna.genes.iter().sum::<f32>() * 2.0;
                if org.fitness > best_f { best_f = org.fitness; }
            }
            
            history.push(HistoryPoint { generation: engine.generation, best_fitness: best_f });
            if history.len() > 50 { history.remove(0); }
            
            println!("[Auto-Evolve] Gen {} complete. Best Fitness: {:.2}", engine.generation, best_f);
        }
    });

    // 8. Start Server
    let app = api::app(state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    
    println!("== OMNIXIUS BACKEND: CONTENT EDITION (DB ACTIVE) ==");
    println!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

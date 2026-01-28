use omnixius::api::{self, AppState};
use omnixius::layers::l0_quantum::L0QuantumMutator;
use omnixius::layers::l1_chronos::L1ChronosFileStorage;
use omnixius::layers::l3_organisms::o4_day_mohk::phoenix_engine::{PhoenixEngine, Organism, Dna, OrganismId};
use omnixius::layers::l4_oikoumene::auth::AuthService;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use sqlx::sqlite::SqlitePoolOptions;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // 1. Initialize Database (Million Hacker Persistence)
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
    
    // 5. Create Auth Service (Database Backed)
    let auth = AuthService::new(pool, "SUPER_SECRET_HACKER_KEY_123".to_string()).await;

    // 6. Create Shared State
    let state = Arc::new(AppState {
        engine: Arc::new(Mutex::new(engine)),
        auth: Arc::new(auth),
    });

    // 7. Start Server
    let app = api::app(state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    
    println!("== OMNIXIUS BACKEND: MILLION HACKER EDITION (DB ACTIVE) ==");
    println!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

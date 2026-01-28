//! OMNIXIUS – core Rust crate.

pub mod layers {
    #[path = "C:/OMNIXIUS/layers/L0_quantum/quantum_mutator.rs"]
    pub mod l0_quantum;

    #[path = "C:/OMNIXIUS/layers/L1_chronos/chronos_storage.rs"]
    pub mod l1_chronos;

    pub mod l3_organisms {
        pub mod o4_day_mohk {
            #[path = "C:/OMNIXIUS/layers/L3_organisms/O4_day_mohk/phoenix_engine.rs"]
            pub mod phoenix_engine;
        }
    }

    pub mod l4_oikoumene {
        #[path = "C:/OMNIXIUS/layers/L4_oikoumene/auth.rs"]
        pub mod auth;
    }
}

pub mod api {
    use axum::{
        routing::{get, post},
        Json, Router, extract::State,
    };
    use tower_http::cors::CorsLayer;
    use serde::{Serialize, Deserialize};
    use std::sync::{Arc, Mutex};
    
    use crate::layers::l0_quantum::L0QuantumMutator;
    use crate::layers::l1_chronos::L1ChronosFileStorage;
    use crate::layers::l3_organisms::o4_day_mohk::phoenix_engine::{
        PhoenixEngine, Organism
    };
    use crate::layers::l4_oikoumene::auth::AuthService;

    // Million Hacker State
    pub struct AppState {
        pub engine: Arc<Mutex<PhoenixEngine<L0QuantumMutator, L1ChronosFileStorage>>>,
        pub auth: Arc<AuthService>,
    }

    #[derive(Serialize)]
    pub struct SystemStatus {
        pub status: String,
        pub layer: String,
        pub version: String,
        pub generation: u64,
        pub population_size: usize,
    }

    #[derive(Serialize)]
    pub struct EvolutionResponse {
        pub generation: u64,
        pub population: Vec<Organism>,
    }

    #[derive(Deserialize)]
    pub struct AuthRequest {
        pub username: String,
        pub password: String,
    }

    #[derive(Serialize)]
    pub struct AuthResponse {
        pub token: Option<String>,
        pub error: Option<String>,
    }

    pub async fn get_status(State(state): State<Arc<AppState>>) -> Json<SystemStatus> {
        let engine = state.engine.lock().unwrap();
        Json(SystemStatus {
            status: "Active".to_string(),
            layer: engine.layer_id.to_string(),
            version: "0.1.0-alpha".to_string(),
            generation: engine.generation,
            population_size: engine.population_size(),
        })
    }

    pub async fn trigger_evolution(State(state): State<Arc<AppState>>) -> Json<EvolutionResponse> {
        let mut engine = state.engine.lock().unwrap();
        let mut rng = rand::thread_rng();
        
        let pop_size = engine.population_size();
        engine.evolve(&mut rng, pop_size);

        for org in &mut engine.population {
            org.fitness = org.dna.genes.iter().sum::<f32>() * 2.0;
        }

        Json(EvolutionResponse {
            generation: engine.generation,
            population: engine.population.clone(),
        })
    }

    pub async fn register(
        State(state): State<Arc<AppState>>,
        Json(payload): Json<AuthRequest>,
    ) -> Json<AuthResponse> {
        match state.auth.register(&payload.username, &payload.password).await {
            Ok(_) => Json(AuthResponse { token: None, error: None }),
            Err(e) => Json(AuthResponse { token: None, error: Some(e) }),
        }
    }

    pub async fn login(
        State(state): State<Arc<AppState>>,
        Json(payload): Json<AuthRequest>,
    ) -> Json<AuthResponse> {
        match state.auth.login(&payload.username, &payload.password).await {
            Ok(token) => Json(AuthResponse { token: Some(token), error: None }),
            Err(e) => Json(AuthResponse { token: None, error: Some(e) }),
        }
    }

    pub fn app(state: Arc<AppState>) -> Router {
        Router::new()
            .route("/api/status", get(get_status))
            .route("/api/evolve", post(trigger_evolution))
            .route("/api/register", post(register))
            .route("/api/login", post(login))
            .layer(CorsLayer::permissive())
            .with_state(state)
    }
}

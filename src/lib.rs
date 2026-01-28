//! OMNIXIUS – core Rust crate.

pub mod layers {
    #[path = "C:/OMNIXIUS/layers/L-1_energy/quantum_fields.rs"]
    pub mod l_minus_1_energy;

    #[path = "C:/OMNIXIUS/layers/L0_quantum/quantum_mutator.rs"]
    pub mod l0_quantum;
    
    #[path = "C:/OMNIXIUS/layers/L0_quantum/quantum_ops.rs"]
    pub mod l0_ops;

    #[path = "C:/OMNIXIUS/layers/L1_chronos/chronos_storage.rs"]
    pub mod l1_chronos;

    #[path = "C:/OMNIXIUS/layers/L1_chronos/economy.rs"]
    pub mod l1_economy;

    #[path = "C:/OMNIXIUS/layers/L2_noosphere/ai_oracle.rs"]
    pub mod l2_noosphere;

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

    #[path = "C:/OMNIXIUS/layers/L5_telesophy/communication.rs"]
    pub mod l5_telesophy;
}

pub mod api {
    use axum::{
        routing::{get, post},
        Json, Router, extract::{State, Path},
    };
    use tower_http::cors::CorsLayer;
    use serde::{Serialize, Deserialize};
    use std::sync::{Arc, Mutex};
    
    use crate::layers::l_minus_1_energy::{EnergyService, EnergyState};
    use crate::layers::l0_quantum::L0QuantumMutator;
    use crate::layers::l0_ops::QuantumService;
    use crate::layers::l1_chronos::L1ChronosFileStorage;
    use crate::layers::l1_economy::{EconomyService, Wallet, LeaderboardEntry};
    use crate::layers::l2_noosphere::NoosphereService;
    use crate::layers::l3_organisms::o4_day_mohk::phoenix_engine::{
        PhoenixEngine, Organism
    };
    use crate::layers::l4_oikoumene::auth::AuthService;
    use crate::layers::l5_telesophy::{CommunicationService, Message};

    #[derive(Serialize, Clone)]
    pub struct HistoryPoint {
        pub generation: u64,
        pub best_fitness: f32,
    }

    pub struct AppState {
        pub energy: Arc<Mutex<EnergyService>>,
        pub engine: Arc<Mutex<PhoenixEngine<L0QuantumMutator, L1ChronosFileStorage>>>,
        pub auth: Arc<AuthService>,
        pub economy: Arc<EconomyService>,
        pub comms: Arc<CommunicationService>,
        pub history: Arc<Mutex<Vec<HistoryPoint>>>,
    }

    #[derive(Serialize)]
    pub struct SystemStatus {
        pub status: String,
        pub layer: String,
        pub version: String,
        pub generation: u64,
        pub population_size: usize,
        pub population: Vec<Organism>,
        pub history: Vec<HistoryPoint>,
        pub energy: EnergyState,
    }

    #[derive(Serialize)]
    pub struct EvolutionResponse {
        pub generation: u64,
        pub population: Vec<Organism>,
        pub history: Vec<HistoryPoint>,
        pub new_balance: Option<f64>,
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
        pub wallet: Option<Wallet>,
    }

    #[derive(Deserialize)]
    pub struct MessageRequest {
        pub username: String,
        pub content: String,
    }

    pub async fn get_status(State(state): State<Arc<AppState>>) -> Json<SystemStatus> {
        let engine = state.engine.lock().unwrap();
        let history = state.history.lock().unwrap();
        let mut energy_svc = state.energy.lock().unwrap();
        let energy_state = energy_svc.update(engine.population_size());
        
        Json(SystemStatus {
            status: "Active".to_string(),
            layer: engine.layer_id.to_string(),
            version: "0.1.0-alpha".to_string(),
            generation: engine.generation,
            population_size: engine.population_size(),
            population: engine.population.clone(),
            history: history.clone(),
            energy: energy_state,
        })
    }

    pub async fn trigger_evolution(State(state): State<Arc<AppState>>) -> Json<EvolutionResponse> {
        let mut engine = state.engine.lock().unwrap();
        let mut rng = rand::thread_rng();
        
        let pop_size = engine.population_size();
        engine.evolve(&mut rng, pop_size);

        let mut best_f = 0.0;
        for org in &mut engine.population {
            org.fitness = org.dna.genes.iter().sum::<f32>() * 2.0;
            if org.fitness > best_f { best_f = org.fitness; }
        }

        let mut history = state.history.lock().unwrap();
        history.push(HistoryPoint { generation: engine.generation, best_fitness: best_f });
        if history.len() > 50 { history.remove(0); }

        Json(EvolutionResponse {
            generation: engine.generation,
            population: engine.population.clone(),
            history: history.clone(),
            new_balance: None,
        })
    }

    pub async fn get_wallet(
        State(state): State<Arc<AppState>>,
        Path(username): Path<String>,
    ) -> Json<Result<Wallet, String>> {
        Json(state.economy.get_wallet(&username).await)
    }

    pub async fn get_leaderboard(State(state): State<Arc<AppState>>) -> Json<Result<Vec<LeaderboardEntry>, String>> {
        Json(state.economy.get_leaderboard().await)
    }

    pub async fn get_messages(State(state): State<Arc<AppState>>) -> Json<Result<Vec<Message>, String>> {
        Json(state.comms.get_recent_messages().await)
    }

    pub async fn send_message(
        State(state): State<Arc<AppState>>,
        Json(payload): Json<MessageRequest>,
    ) -> Json<Result<Message, String>> {
        Json(state.comms.send_message(&payload.username, &payload.content).await)
    }

    pub async fn get_quantum_state() -> Json<crate::layers::l0_ops::QuantumState> {
        Json(QuantumService::get_current_state())
    }

    pub async fn get_oracle_advice() -> Json<crate::layers::l2_noosphere::OracleMessage> {
        Json(NoosphereService::get_advice())
    }

    pub async fn register(
        State(state): State<Arc<AppState>>,
        Json(payload): Json<AuthRequest>,
    ) -> Json<AuthResponse> {
        match state.auth.register(&payload.username, &payload.password).await {
            Ok(_) => Json(AuthResponse { token: None, error: None, wallet: None }),
            Err(e) => Json(AuthResponse { token: None, error: Some(e), wallet: None }),
        }
    }

    pub async fn login(
        State(state): State<Arc<AppState>>,
        Json(payload): Json<AuthRequest>,
    ) -> Json<AuthResponse> {
        match state.auth.login(&payload.username, &payload.password).await {
            Ok(token) => {
                let wallet = state.economy.get_wallet(&payload.username).await.ok();
                Json(AuthResponse { token: Some(token), error: None, wallet })
            },
            Err(e) => Json(AuthResponse { token: None, error: Some(e), wallet: None }),
        }
    }

    pub fn app(state: Arc<AppState>) -> Router {
        Router::new()
            .route("/api/status", get(get_status))
            .route("/api/evolve", post(trigger_evolution))
            .route("/api/quantum", get(get_quantum_state))
            .route("/api/oracle", get(get_oracle_advice))
            .route("/api/wallet/:username", get(get_wallet))
            .route("/api/leaderboard", get(get_leaderboard))
            .route("/api/messages", get(get_messages))
            .route("/api/messages", post(send_message))
            .route("/api/register", post(register))
            .route("/api/login", post(login))
            .layer(CorsLayer::permissive())
            .with_state(state)
    }
}

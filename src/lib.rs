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
}

pub mod api {
    use axum::{
        routing::get,
        Json, Router,
    };
    use tower_http::cors::CorsLayer;
    use serde::Serialize;

    #[derive(Serialize)]
    pub struct SystemStatus {
        pub status: String,
        pub layer: String,
        pub version: String,
    }

    pub async fn get_status() -> Json<SystemStatus> {
        Json(SystemStatus {
            status: "Active".to_string(),
            layer: "L3_Organisms".to_string(),
            version: "0.1.0-alpha".to_string(),
        })
    }

    pub fn app() -> Router {
        Router::new()
            .route("/api/status", get(get_status))
            .layer(CorsLayer::permissive())
    }
}

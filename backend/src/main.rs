use axum::{
    Router,
    routing::{get, post},
    http::StatusCode,
    response::IntoResponse,
};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::{CorsLayer, Any};

mod api;
mod layers;
mod database;
mod middleware;

use crate::database::Database;
use crate::layers::{L1Chronos, L3Phoenix, L4Oikoumene};

#[derive(Clone)]
pub struct AppState {
    pub l1_chronos: Arc<L1Chronos>,
    pub l3_phoenix: Arc<L3Phoenix>,
    pub l4_oikoumene: Arc<L4Oikoumene>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    println!("🚀 Запуск Omnixius Backend...");

    let db = Database::init().await?;
    println!("✅ База данных инициализирована");

    let l1_chronos = Arc::new(L1Chronos::new(db.pool.clone()));
    let l3_phoenix = Arc::new(L3Phoenix::new());
    let l4_oikoumene = Arc::new(L4Oikoumene::new(db.pool.clone()));
    println!("✅ Слои инициализированы");

    let state = AppState {
        l1_chronos,
        l3_phoenix,
        l4_oikoumene,
    };

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .nest("/api", api::routes())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(Arc::new(state));

    let listener = TcpListener::bind("0.0.0.0:4000").await?;
    println!("🌐 Сервер запущен на http://localhost:4000");
    println!("📊 Health check: http://localhost:4000/health");
    println!("🔧 API: http://localhost:4000/api");

    axum::serve(listener, app).await?;
    Ok(())
}

async fn root() -> &'static str {
    "🚀 Omnixius Backend API v1.0"
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "✅ OK")
}

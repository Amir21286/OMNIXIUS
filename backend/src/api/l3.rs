use axum::{
    Router,
    routing::{get, post},
    extract::{State, Json, Path},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::{AppState, ApiResponse};

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/organisms/create", post(create_organism))
        .route("/organisms/:organism_id", get(get_organism))
        .route("/organisms/user/:user_id", get(get_user_organisms))
        .route("/organisms/:organism_id/evolve", post(evolve_organism))
        .route("/organisms/crossover", post(crossover))
        .route("/organisms/:organism_id/history", get(get_evolution_history))
}

#[derive(Debug, Deserialize)]
pub struct CreateOrganismRequest {
    pub owner_id: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct CrossoverRequest {
    pub parent1_id: String,
    pub parent2_id: String,
    pub name: String,
}

async fn create_organism(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateOrganismRequest>,
) -> impl IntoResponse {
    match state.l3_phoenix.create_organism(&req.owner_id, &req.name).await {
        Ok(organism) => (StatusCode::CREATED, Json(ApiResponse::success(organism))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_organism(
    State(state): State<Arc<AppState>>,
    Path(organism_id): Path<String>,
) -> impl IntoResponse {
    match state.l3_phoenix.get_organism(&organism_id).await {
        Ok(Some(organism)) => (StatusCode::OK, Json(ApiResponse::success(organism))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error("Organism not found")),
        ),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_user_organisms(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    match state.l3_phoenix.get_user_organisms(&user_id).await {
        Ok(organisms) => (StatusCode::OK, Json(ApiResponse::success(organisms))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn evolve_organism(
    State(state): State<Arc<AppState>>,
    Path(organism_id): Path<String>,
) -> impl IntoResponse {
    match state.l3_phoenix.evolve_organism(&organism_id).await {
        Ok(result) => (StatusCode::OK, Json(ApiResponse::success(result))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn crossover(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CrossoverRequest>,
) -> impl IntoResponse {
    match state
        .l3_phoenix
        .crossover(&req.parent1_id, &req.parent2_id, &req.name)
        .await
    {
        Ok(organism) => (StatusCode::CREATED, Json(ApiResponse::success(organism))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_evolution_history(
    State(state): State<Arc<AppState>>,
    Path(organism_id): Path<String>,
) -> impl IntoResponse {
    match state.l3_phoenix.get_evolution_history(&organism_id).await {
        Ok(history) => (StatusCode::OK, Json(ApiResponse::success(history))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

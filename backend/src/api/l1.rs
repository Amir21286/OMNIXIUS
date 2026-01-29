use axum::{
    Router,
    routing::{get, post},
    extract::{State, Json, Path, Query},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::{AppState, ApiResponse, Pagination};

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/wallet/create", post(create_wallet))
        .route("/wallet/balance/:user_id", get(get_balance))
        .route("/wallet/reward", post(reward_ixi))
        .route("/wallet/transfer", post(transfer_ixi))
        .route("/wallet/transactions/:user_id", get(get_transactions))
        .route("/leaderboard", get(get_leaderboard))
}

#[derive(Debug, Deserialize)]
pub struct CreateWalletRequest {
    pub user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct RewardRequest {
    pub user_id: String,
    pub amount: i64,
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct TransferRequest {
    pub from_user_id: String,
    pub to_user_id: String,
    pub amount: i64,
}

async fn create_wallet(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateWalletRequest>,
) -> impl IntoResponse {
    match state.l1_chronos.create_wallet(&req.user_id).await {
        Ok(wallet) => (StatusCode::CREATED, Json(ApiResponse::success(wallet))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_balance(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    match state.l1_chronos.get_balance(&user_id).await {
        Ok(balance) => (StatusCode::OK, Json(ApiResponse::success(balance))),
        Err(err) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn reward_ixi(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RewardRequest>,
) -> impl IntoResponse {
    match state
        .l1_chronos
        .reward_ixi(&req.user_id, req.amount, &req.reason)
        .await
    {
        Ok(transaction) => (StatusCode::OK, Json(ApiResponse::success(transaction))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn transfer_ixi(
    State(state): State<Arc<AppState>>,
    Json(req): Json<TransferRequest>,
) -> impl IntoResponse {
    match state
        .l1_chronos
        .transfer_ixi(&req.from_user_id, &req.to_user_id, req.amount)
        .await
    {
        Ok(transaction) => (StatusCode::OK, Json(ApiResponse::success(transaction))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_transactions(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let limit = pagination.limit.unwrap_or(50);
    match state.l1_chronos.get_transaction_history(&user_id, limit).await {
        Ok(transactions) => (StatusCode::OK, Json(ApiResponse::success(transactions))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_leaderboard(
    State(state): State<Arc<AppState>>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    let limit = pagination.limit.unwrap_or(100);
    match state.l1_chronos.get_leaderboard(limit).await {
        Ok(leaderboard) => (StatusCode::OK, Json(ApiResponse::success(leaderboard))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

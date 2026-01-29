use axum::{
    Router,
    routing::{get, post},
    extract::{State, Json, Path, Query},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::AppState;
use crate::layers::{L1Chronos, L3Phoenix, L4Oikoumene};

pub mod l1;
pub mod l3;
pub mod l4;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/l1", l1::routes())
        .nest("/l3", l3::routes())
        .nest("/l4", l4::routes())
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: i64,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: chrono::Utc::now().timestamp(),
        }
    }

    pub fn error(message: &str) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(message.to_string()),
            timestamp: chrono::Utc::now().timestamp(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct Pagination {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

impl Default for Pagination {
    fn default() -> Self {
        Self {
            page: Some(1),
            limit: Some(20),
        }
    }
}

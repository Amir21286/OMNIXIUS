use axum::{
    extract::FromRequestParts,
    http::{request::Parts, HeaderMap},
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::layers::L4Oikoumene;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub user_id: i64,
    pub username: String,
    pub exp: i64,
}

pub async fn verify_token(
    headers: &HeaderMap,
    oikoumene: &L4Oikoumene,
) -> Result<i64, String> {
    let token = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .ok_or_else(|| "No token provided".to_string())?;

    let decoding_key = DecodingKey::from_secret(oikoumene.jwt_secret.as_bytes());
    let validation = Validation::default();

    let token_data = decode::<Claims>(token, &decoding_key, &validation)
        .map_err(|e| format!("Invalid token: {}", e))?;

    let now = chrono::Utc::now().timestamp();
    if token_data.claims.exp < now {
        return Err("Token expired".to_string());
    }

    Ok(token_data.claims.user_id)
}

pub struct AuthUser {
    pub user_id: i64,
    pub username: String,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (axum::http::StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "));
        if auth.is_none() {
            return Err((axum::http::StatusCode::UNAUTHORIZED, "No token".to_string()));
        }
        Ok(AuthUser {
            user_id: 1,
            username: "test_user".to_string(),
        })
    }
}

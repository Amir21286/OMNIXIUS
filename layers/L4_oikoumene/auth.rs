//! Layer: L4 – Oikoumene (Societies)
//! Module: Authentication & Identity System (Database Backed)

use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, Header, EncodingKey};
use chrono::{Utc, Duration};
use bcrypt::{hash, verify, DEFAULT_COST};
use sqlx::{SqlitePool, Row};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub username: String,
    pub password_hash: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}

pub struct AuthService {
    pool: SqlitePool,
    secret: String,
}

impl AuthService {
    pub async fn new(pool: SqlitePool, secret: String) -> Self {
        // Create users table if not exists
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create users table");

        Self { pool, secret }
    }

    pub async fn register(&self, username: &str, password: &str) -> Result<(), String> {
        let password_hash = hash(password, DEFAULT_COST).map_err(|_| "Hashing error".to_string())?;
        
        sqlx::query("INSERT INTO users (username, password_hash) VALUES (?, ?)")
            .bind(username)
            .bind(password_hash)
            .execute(&self.pool)
            .await
            .map_err(|e| {
                if e.to_string().contains("UNIQUE constraint failed") {
                    "User already exists".to_string()
                } else {
                    format!("Database error: {}", e)
                }
            })?;

        Ok(())
    }

    pub async fn login(&self, username: &str, password: &str) -> Result<String, String> {
        let row = sqlx::query("SELECT password_hash FROM users WHERE username = ?")
            .bind(username)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?
            .ok_or("User not found")?;

        let password_hash: String = row.get(0);

        if verify(password, &password_hash).map_err(|_| "Verification error".to_string())? {
            let expiration = Utc::now()
                .checked_add_signed(Duration::hours(24))
                .expect("valid timestamp")
                .timestamp() as usize;

            let claims = Claims {
                sub: username.to_string(),
                exp: expiration,
            };

            encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(self.secret.as_ref()),
            ).map_err(|_| "Token generation error".to_string())
        } else {
            Err("Invalid password".to_string())
        }
    }
}

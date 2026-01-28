//! Layer: L4 – Oikoumene
//! Module: Social Interactions & Subscriptions

use sqlx::{SqlitePool, Row};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subscription {
    pub username: String,
    pub blogger_name: String,
}

pub struct SocialService {
    pool: SqlitePool,
}

impl SocialService {
    pub async fn new(pool: SqlitePool) -> Self {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS subscriptions (
                username TEXT NOT NULL,
                blogger_name TEXT NOT NULL,
                PRIMARY KEY (username, blogger_name),
                FOREIGN KEY(username) REFERENCES users(username)
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create subscriptions table");

        Self { pool }
    }

    pub async fn subscribe(&self, username: &str, blogger_name: &str) -> Result<(), String> {
        sqlx::query("INSERT INTO subscriptions (username, blogger_name) VALUES (?, ?)")
            .bind(username)
            .bind(blogger_name)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn unsubscribe(&self, username: &str, blogger_name: &str) -> Result<(), String> {
        sqlx::query("DELETE FROM subscriptions WHERE username = ? AND blogger_name = ?")
            .bind(username)
            .bind(blogger_name)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn get_user_subscriptions(&self, username: &str) -> Result<Vec<String>, String> {
        let rows = sqlx::query("SELECT blogger_name FROM subscriptions WHERE username = ?")
            .bind(username)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(rows.into_iter().map(|r| r.get(0)).collect())
    }
}

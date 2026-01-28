//! Layer: L5 – Telesophy
//! Module: Interstellar Communication & Global Chat

use sqlx::{SqlitePool, Row};
use serde::{Serialize, Deserialize};
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub id: i64,
    pub username: String,
    pub content: String,
    pub timestamp: String,
}

pub struct CommunicationService {
    pool: SqlitePool,
}

impl CommunicationService {
    pub async fn new(pool: SqlitePool) -> Self {
        // Create messages table if not exists
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY(username) REFERENCES users(username)
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create messages table");

        Self { pool }
    }

    pub async fn send_message(&self, username: &str, content: &str) -> Result<Message, String> {
        let timestamp = Utc::now().to_rfc3339();
        
        let id = sqlx::query("INSERT INTO messages (username, content, timestamp) VALUES (?, ?, ?)")
            .bind(username)
            .bind(content)
            .bind(&timestamp)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?
            .last_insert_rowid();

        Ok(Message {
            id,
            username: username.to_string(),
            content: content.to_string(),
            timestamp,
        })
    }

    pub async fn get_recent_messages(&self) -> Result<Vec<Message>, String> {
        let rows = sqlx::query(
            "SELECT id, username, content, timestamp FROM messages ORDER BY id DESC LIMIT 50"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let mut messages = Vec::new();
        for row in rows {
            messages.push(Message {
                id: row.get(0),
                username: row.get(1),
                content: row.get(2),
                timestamp: row.get(3),
            });
        }
        Ok(messages)
    }
}

//! Layer: L2 – Noosphere / Quests
//! Module: Personal Development & Human Ascension

use serde::{Serialize, Deserialize};
use sqlx::{SqlitePool, Row};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Quest {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub reward_ixi: f64,
    pub category: String,
    pub is_completed: bool,
}

pub struct QuestService {
    pool: SqlitePool,
}

impl QuestService {
    pub async fn new(pool: SqlitePool) -> Self {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS quests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                reward_ixi REAL NOT NULL,
                category TEXT NOT NULL
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create quests table");

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS user_quests (
                username TEXT NOT NULL,
                quest_id INTEGER NOT NULL,
                completed_at TEXT NOT NULL,
                PRIMARY KEY (username, quest_id)
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create user_quests table");

        Self { pool }
    }

    pub async fn get_available_quests(&self) -> Vec<Quest> {
        // Mocking some initial quests if table is empty
        vec![
            Quest { id: 1, title: "Learn Rust Basics".to_string(), description: "Complete the first chapter of Noosphere Academy.".to_string(), reward_ixi: 50.0, category: "Tech".to_string(), is_completed: false },
            Quest { id: 2, title: "Cultural Roots".to_string(), description: "Visit Magas Towers in Day-Mohk universe.".to_string(), reward_ixi: 30.0, category: "Culture".to_string(), is_completed: false },
            Quest { id: 3, title: "Quantum Pioneer".to_string(), description: "Generate 100 GeV of energy in L-1.".to_string(), reward_ixi: 100.0, category: "Science".to_string(), is_completed: false },
        ]
    }
}

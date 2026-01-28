//! Layer: L2 – Noosphere
//! Module: Academy & Course Management

use sqlx::{SqlitePool, Row};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CoursePurchase {
    pub username: String,
    pub course_title: String,
}

pub struct AcademyService {
    pool: SqlitePool,
}

impl AcademyService {
    pub async fn new(pool: SqlitePool) -> Self {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS course_purchases (
                username TEXT NOT NULL,
                course_title TEXT NOT NULL,
                PRIMARY KEY (username, course_title),
                FOREIGN KEY(username) REFERENCES users(username)
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create course_purchases table");

        Self { pool }
    }

    pub async fn buy_course(&self, username: &str, course_title: &str) -> Result<(), String> {
        sqlx::query("INSERT INTO course_purchases (username, course_title) VALUES (?, ?)")
            .bind(username)
            .bind(course_title)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn get_user_courses(&self, username: &str) -> Result<Vec<String>, String> {
        let rows = sqlx::query("SELECT course_title FROM course_purchases WHERE username = ?")
            .bind(username)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(rows.into_iter().map(|r| r.get(0)).collect())
    }
}

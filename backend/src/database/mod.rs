use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::time::Duration;
use tracing::info;

pub mod models;

pub struct Database {
    pub pool: SqlitePool,
}

impl Database {
    pub async fn init() -> anyhow::Result<Self> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(3))
            .connect("sqlite:omnixius.db")
            .await?;

        let db = Self { pool: pool.clone() };
        db.run_migrations().await?;

        info!("Database initialized");
        Ok(db)
    }

    async fn run_migrations(&self) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                reputation INTEGER DEFAULT 100,
                level INTEGER DEFAULT 1,
                bio TEXT,
                avatar_url TEXT,
                created_at INTEGER NOT NULL,
                last_login INTEGER NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                balance INTEGER DEFAULT 1000,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_user_id TEXT,
                to_user_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                tx_type TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS organisms (
                id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL,
                name TEXT NOT NULL,
                generation INTEGER DEFAULT 1,
                color_r INTEGER NOT NULL,
                color_g INTEGER NOT NULL,
                color_b INTEGER NOT NULL,
                size REAL NOT NULL,
                speed REAL NOT NULL,
                strength REAL NOT NULL,
                intelligence REAL NOT NULL,
                fertility REAL NOT NULL,
                health REAL NOT NULL,
                energy REAL NOT NULL,
                created_at INTEGER NOT NULL,
                evolved_at INTEGER NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS follows (
                follower_id INTEGER NOT NULL,
                following_id INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                PRIMARY KEY (follower_id, following_id),
                FOREIGN KEY (follower_id) REFERENCES users (id),
                FOREIGN KEY (following_id) REFERENCES users (id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS post_likes (
                user_id INTEGER NOT NULL,
                post_id INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                PRIMARY KEY (user_id, post_id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (post_id) REFERENCES posts (id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        info!("Migrations completed");
        Ok(())
    }
}

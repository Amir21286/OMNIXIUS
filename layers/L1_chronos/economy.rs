//! Layer: L1 – Chronos
//! Module: IXI Token Economy & Wallet System

use sqlx::{SqlitePool, Row};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Wallet {
    pub username: String,
    pub balance: f64,
    pub entropy_potential: f64,
}

pub struct EconomyService {
    pool: SqlitePool,
}

impl EconomyService {
    pub async fn new(pool: SqlitePool) -> Self {
        // Create wallets table if not exists
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS wallets (
                username TEXT PRIMARY KEY,
                balance REAL DEFAULT 1000.0,
                entropy_potential REAL DEFAULT 100.0,
                FOREIGN KEY(username) REFERENCES users(username)
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create wallets table");

        Self { pool }
    }

    pub async fn get_wallet(&self, username: &str) -> Result<Wallet, String> {
        let row = sqlx::query("SELECT balance, entropy_potential FROM wallets WHERE username = ?")
            .bind(username)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        match row {
            Some(r) => Ok(Wallet {
                username: username.to_string(),
                balance: r.get(0),
                entropy_potential: r.get(1),
            }),
            None => {
                // Initialize wallet for new user
                sqlx::query("INSERT INTO wallets (username) VALUES (?)")
                    .bind(username)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| e.to_string())?;
                
                Ok(Wallet {
                    username: username.to_string(),
                    balance: 1000.0,
                    entropy_potential: 100.0,
                })
            }
        }
    }

    pub async fn spend_ixi(&self, username: &str, amount: f64) -> Result<f64, String> {
        let wallet = self.get_wallet(username).await?;
        if wallet.balance < amount {
            return Err("Insufficient IXI balance".to_string());
        }

        let new_balance = wallet.balance - amount;
        sqlx::query("UPDATE wallets SET balance = ? WHERE username = ?")
            .bind(new_balance)
            .bind(username)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(new_balance)
    }

    pub async fn reward_ixi(&self, username: &str, amount: f64) -> Result<f64, String> {
        let wallet = self.get_wallet(username).await?;
        let new_balance = wallet.balance + amount;
        
        sqlx::query("UPDATE wallets SET balance = ? WHERE username = ?")
            .bind(new_balance)
            .bind(username)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(new_balance)
    }

    pub async fn get_leaderboard(&self) -> Result<Vec<LeaderboardEntry>, String> {
        let rows = sqlx::query(
            "SELECT username, balance FROM wallets ORDER BY balance DESC LIMIT 10"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let mut entries = Vec::new();
        for row in rows {
            entries.push(LeaderboardEntry {
                username: row.get(0),
                balance: row.get(1),
            });
        }
        Ok(entries)
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LeaderboardEntry {
    pub username: String,
    pub balance: f64,
}

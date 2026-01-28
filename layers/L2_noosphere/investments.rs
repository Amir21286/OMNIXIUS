//! Layer: L2 – Noosphere
//! Module: Investment System & Asset Management

use sqlx::{SqlitePool, Row};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Asset {
    pub id: String,
    pub name: String,
    pub price: f64,
    pub volatility: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Investment {
    pub username: String,
    pub asset_id: String,
    pub amount: f64,
    pub entry_price: f64,
}

pub struct InvestmentService {
    pool: SqlitePool,
}

impl InvestmentService {
    pub async fn new(pool: SqlitePool) -> Self {
        // Create investments table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS investments (
                username TEXT NOT NULL,
                asset_id TEXT NOT NULL,
                amount REAL NOT NULL,
                entry_price REAL NOT NULL,
                PRIMARY KEY (username, asset_id),
                FOREIGN KEY(username) REFERENCES users(username)
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create investments table");

        Self { pool }
    }

    pub fn get_market_assets() -> Vec<Asset> {
        vec![
            Asset { id: "q_comp".to_string(), name: "Quantum Computing".to_string(), price: 150.0, volatility: 0.15 },
            Asset { id: "bio_eng".to_string(), name: "Bio-Engineering".to_string(), price: 85.0, volatility: 0.08 },
            Asset { id: "neural_net".to_string(), name: "Neural Networks".to_string(), price: 210.0, volatility: 0.25 },
            Asset { id: "space_tech".to_string(), name: "Astra SpaceTech".to_string(), price: 340.0, volatility: 0.12 },
        ]
    }

    pub async fn invest(&self, username: &str, asset_id: &str, amount: f64, price: f64) -> Result<(), String> {
        sqlx::query(
            "INSERT INTO investments (username, asset_id, amount, entry_price) 
             VALUES (?, ?, ?, ?)
             ON CONFLICT(username, asset_id) DO UPDATE SET 
             amount = amount + excluded.amount,
             entry_price = (entry_price * amount + excluded.entry_price * excluded.amount) / (amount + excluded.amount)"
        )
        .bind(username)
        .bind(asset_id)
        .bind(amount)
        .bind(price)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        
        Ok(())
    }

    pub async fn get_user_investments(&self, username: &str) -> Result<Vec<Investment>, String> {
        let rows = sqlx::query("SELECT username, asset_id, amount, entry_price FROM investments WHERE username = ?")
            .bind(username)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(rows.into_iter().map(|r| Investment {
            username: r.get(0),
            asset_id: r.get(1),
            amount: r.get(2),
            entry_price: r.get(3),
        }).collect())
    }
}

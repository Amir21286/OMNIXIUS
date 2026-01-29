use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub id: i64,
    pub user_id: String,
    pub balance: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: i64,
    pub from_user_id: Option<String>,
    pub to_user_id: String,
    pub amount: i64,
    pub tx_type: String,
    pub description: String,
    pub created_at: i64,
}

pub struct L1Chronos {
    pub pool: SqlitePool,
}

impl L1Chronos {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create_wallet(&self, user_id: &str) -> Result<Wallet, String> {
        let now = Utc::now().timestamp();
        sqlx::query(
            "INSERT INTO wallets (user_id, balance, created_at, updated_at) VALUES (?, 1000, ?, ?)",
        )
        .bind(user_id)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let id = sqlx::query_scalar::<_, i64>("SELECT id FROM wallets WHERE user_id = ?")
            .bind(user_id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Wallet {
            id,
            user_id: user_id.to_string(),
            balance: 1000,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn get_balance(&self, user_id: &str) -> Result<i64, String> {
        let row = sqlx::query_scalar::<_, i64>("SELECT balance FROM wallets WHERE user_id = ?")
            .bind(user_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Wallet not found".to_string())?;
        Ok(row)
    }

    pub async fn reward_ixi(&self, user_id: &str, amount: i64, reason: &str) -> Result<Transaction, String> {
        let now = Utc::now().timestamp();
        sqlx::query("UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?")
            .bind(amount)
            .bind(now)
            .bind(user_id)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query(
            "INSERT INTO transactions (from_user_id, to_user_id, amount, tx_type, description, created_at) VALUES (NULL, ?, ?, 'Reward', ?, ?)",
        )
        .bind(user_id)
        .bind(amount)
        .bind(reason)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let id = sqlx::query_scalar::<_, i64>("SELECT id FROM transactions ORDER BY id DESC LIMIT 1")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Transaction {
            id,
            from_user_id: None,
            to_user_id: user_id.to_string(),
            amount,
            tx_type: "Reward".to_string(),
            description: reason.to_string(),
            created_at: now,
        })
    }

    pub async fn transfer_ixi(&self, from_user_id: &str, to_user_id: &str, amount: i64) -> Result<Transaction, String> {
        if amount <= 0 {
            return Err("Amount must be positive".to_string());
        }
        let from_balance: i64 = sqlx::query_scalar("SELECT balance FROM wallets WHERE user_id = ?")
            .bind(from_user_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Sender wallet not found".to_string())?;

        if from_balance < amount {
            return Err("Insufficient balance".to_string());
        }

        let now = Utc::now().timestamp();
        sqlx::query("UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE user_id = ?")
            .bind(amount)
            .bind(now)
            .bind(from_user_id)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?")
            .bind(amount)
            .bind(now)
            .bind(to_user_id)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query(
            "INSERT INTO transactions (from_user_id, to_user_id, amount, tx_type, description, created_at) VALUES (?, ?, ?, 'Transfer', 'Transfer', ?)",
        )
        .bind(from_user_id)
        .bind(to_user_id)
        .bind(amount)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let id = sqlx::query_scalar::<_, i64>("SELECT id FROM transactions ORDER BY id DESC LIMIT 1")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Transaction {
            id,
            from_user_id: Some(from_user_id.to_string()),
            to_user_id: to_user_id.to_string(),
            amount,
            tx_type: "Transfer".to_string(),
            description: "Transfer".to_string(),
            created_at: now,
        })
    }

    pub async fn get_transaction_history(&self, user_id: &str, limit: i64) -> Result<Vec<Transaction>, String> {
        use sqlx::Row;
        let rows = sqlx::query(
            "SELECT id, from_user_id, to_user_id, amount, tx_type, description, created_at FROM transactions WHERE to_user_id = ? OR from_user_id = ? ORDER BY created_at DESC LIMIT ?",
        )
        .bind(user_id)
        .bind(user_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(rows
            .into_iter()
            .map(|row| Transaction {
                id: row.get("id"),
                from_user_id: row.get("from_user_id"),
                to_user_id: row.get("to_user_id"),
                amount: row.get("amount"),
                tx_type: row.get("tx_type"),
                description: row.get("description"),
                created_at: row.get("created_at"),
            })
            .collect())
    }

    pub async fn get_leaderboard(&self, limit: i64) -> Result<Vec<(String, i64)>, String> {
        use sqlx::Row;
        let rows = sqlx::query("SELECT user_id, balance FROM wallets ORDER BY balance DESC LIMIT ?")
            .bind(limit)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(rows
            .into_iter()
            .map(|row| (row.get("user_id"), row.get("balance")))
            .collect())
    }
}

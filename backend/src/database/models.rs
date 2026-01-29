use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserRow {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub reputation: i64,
    pub level: i64,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: i64,
}

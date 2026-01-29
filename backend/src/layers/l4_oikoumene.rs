use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, FromRow};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation};
use chrono::{Utc, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub reputation: i64,
    pub level: i64,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserPublic {
    pub id: i64,
    pub username: String,
    pub reputation: i64,
    pub level: i64,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub user_id: i64,
    pub username: String,
    pub exp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserPublic,
    pub expires_in: i64,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub id: i64,
    pub user_id: i64,
    pub content: String,
    pub likes: i64,
    pub comments: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Follow {
    pub follower_id: i64,
    pub following_id: i64,
    pub created_at: i64,
}

pub struct L4Oikoumene {
    pub db: SqlitePool,
    pub jwt_secret: String,
}

impl L4Oikoumene {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            db: pool,
            jwt_secret: std::env::var("JWT_SECRET").unwrap_or_else(|_| "omnixius_jwt_secret_2024".to_string()),
        }
    }

    pub async fn register(&self, req: RegisterRequest) -> Result<AuthResponse, String> {
        let password_hash = hash(&req.password, DEFAULT_COST).map_err(|e| e.to_string())?;
        let now = Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO users (username, email, password_hash, reputation, level, created_at, last_login) VALUES (?, ?, ?, 100, 1, ?, ?)",
        )
        .bind(&req.username)
        .bind(&req.email)
        .bind(&password_hash)
        .bind(now)
        .bind(now)
        .execute(&self.db)
        .await
        .map_err(|e| {
            if e.to_string().contains("UNIQUE") {
                "Username or email already exists".to_string()
            } else {
                e.to_string()
            }
        })?;

        let id = sqlx::query_scalar::<_, i64>("SELECT last_insert_rowid()")
            .fetch_one(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        let user_public = UserPublic {
            id,
            username: req.username.clone(),
            reputation: 100,
            level: 1,
            bio: None,
            avatar_url: None,
            created_at: now,
        };

        let exp = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .unwrap()
            .timestamp();
        let claims = Claims {
            user_id: id,
            username: req.username.clone(),
            exp,
        };
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| e.to_string())?;

        Ok(AuthResponse {
            token,
            user: user_public,
            expires_in: 86400,
        })
    }

    pub async fn login(&self, req: LoginRequest) -> Result<AuthResponse, String> {
        use sqlx::Row;
        let row = sqlx::query(
            "SELECT id, username, password_hash, reputation, level, created_at, bio, avatar_url FROM users WHERE email = ?",
        )
        .bind(&req.email)
        .fetch_optional(&self.db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Invalid email or password".to_string())?;

        let id: i64 = row.get("id");
        let username: String = row.get("username");
        let password_hash: String = row.get("password_hash");
        let reputation: i64 = row.get("reputation");
        let level: i64 = row.get("level");
        let created_at: i64 = row.get("created_at");
        let bio: Option<String> = row.get("bio");
        let avatar_url: Option<String> = row.get("avatar_url");
        verify(&req.password, &password_hash).map_err(|_| "Invalid email or password".to_string())?;

        let now = Utc::now().timestamp();
        sqlx::query("UPDATE users SET last_login = ? WHERE id = ?")
            .bind(now)
            .bind(id)
            .execute(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        let user_public = UserPublic {
            id,
            username,
            reputation,
            level,
            bio,
            avatar_url,
            created_at,
        };

        let exp = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .unwrap()
            .timestamp();
        let claims = Claims {
            user_id: id,
            username: user_public.username.clone(),
            exp,
        };
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| e.to_string())?;

        Ok(AuthResponse {
            token,
            user: user_public,
            expires_in: 86400,
        })
    }

    pub async fn get_user_public(&self, user_id: i64) -> Result<UserPublic, String> {
        let row = sqlx::query_as::<_, UserPublic>(
            "SELECT id, username, reputation, level, bio, avatar_url, created_at FROM users WHERE id = ?",
        )
        .bind(user_id)
        .fetch_optional(&self.db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;
        Ok(row)
    }

    pub async fn create_post(&self, user_id: i64, content: &str) -> Result<Post, String> {
        let now = Utc::now().timestamp();
        sqlx::query(
            "INSERT INTO posts (user_id, content, likes, comments, created_at, updated_at) VALUES (?, ?, 0, 0, ?, ?)",
        )
        .bind(user_id)
        .bind(content)
        .bind(now)
        .bind(now)
        .execute(&self.db)
        .await
        .map_err(|e| e.to_string())?;

        let id = sqlx::query_scalar::<_, i64>("SELECT last_insert_rowid()")
            .fetch_one(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Post {
            id,
            user_id,
            content: content.to_string(),
            likes: 0,
            comments: 0,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn get_post(&self, post_id: i64) -> Result<Post, String> {
        use sqlx::Row;
        let row = sqlx::query(
            "SELECT id, user_id, content, likes, comments, created_at, updated_at FROM posts WHERE id = ?",
        )
        .bind(post_id)
        .fetch_optional(&self.db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Post not found".to_string())?;

        Ok(Post {
            id: row.get("id"),
            user_id: row.get("user_id"),
            content: row.get("content"),
            likes: row.get("likes"),
            comments: row.get("comments"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }

    pub async fn get_feed(&self, _user_id: i64, limit: i64, offset: i64) -> Result<Vec<Post>, String> {
        use sqlx::Row;
        let rows = sqlx::query(
            "SELECT id, user_id, content, likes, comments, created_at, updated_at FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.db)
        .await
        .map_err(|e| e.to_string())?;

        Ok(rows
            .into_iter()
            .map(|row| Post {
                id: row.get("id"),
                user_id: row.get("user_id"),
                content: row.get("content"),
                likes: row.get("likes"),
                comments: row.get("comments"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            })
            .collect())
    }

    pub async fn like_post(&self, user_id: i64, post_id: i64) -> Result<i64, String> {
        let now = Utc::now().timestamp();
        let _ = sqlx::query(
            "INSERT OR IGNORE INTO post_likes (user_id, post_id, created_at) VALUES (?, ?, ?)",
        )
        .bind(user_id)
        .bind(post_id)
        .bind(now)
        .execute(&self.db)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query("UPDATE posts SET likes = (SELECT COUNT(*) FROM post_likes WHERE post_id = ?), updated_at = ? WHERE id = ?")
            .bind(post_id)
            .bind(now)
            .bind(post_id)
            .execute(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        let count: i64 = sqlx::query_scalar("SELECT likes FROM posts WHERE id = ?")
            .bind(post_id)
            .fetch_one(&self.db)
            .await
            .map_err(|e| e.to_string())?;
        Ok(count)
    }

    pub async fn follow_user(&self, follower_id: i64, following_id: i64) -> Result<Follow, String> {
        let now = Utc::now().timestamp();
        sqlx::query("INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)")
            .bind(follower_id)
            .bind(following_id)
            .bind(now)
            .execute(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Follow {
            follower_id,
            following_id,
            created_at: now,
        })
    }

    pub async fn unfollow_user(&self, follower_id: i64, following_id: i64) -> Result<(), String> {
        sqlx::query("DELETE FROM follows WHERE follower_id = ? AND following_id = ?")
            .bind(follower_id)
            .bind(following_id)
            .execute(&self.db)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn get_followers(&self, user_id: i64) -> Result<Vec<UserPublic>, String> {
        sqlx::query_as::<_, UserPublic>(
            "SELECT u.id, u.username, u.reputation, u.level, u.bio, u.avatar_url, u.created_at FROM users u INNER JOIN follows f ON u.id = f.follower_id WHERE f.following_id = ?",
        )
        .bind(user_id)
        .fetch_all(&self.db)
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn get_following(&self, user_id: i64) -> Result<Vec<UserPublic>, String> {
        sqlx::query_as::<_, UserPublic>(
            "SELECT u.id, u.username, u.reputation, u.level, u.bio, u.avatar_url, u.created_at FROM users u INNER JOIN follows f ON u.id = f.following_id WHERE f.follower_id = ?",
        )
        .bind(user_id)
        .fetch_all(&self.db)
        .await
        .map_err(|e| e.to_string())
    }
}

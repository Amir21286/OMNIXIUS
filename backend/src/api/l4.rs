use axum::{
    Router,
    routing::{get, post, delete},
    extract::{State, Json, Path, Query},
    http::{StatusCode, HeaderMap},
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::{AppState, ApiResponse, Pagination};
use crate::middleware::auth::verify_token;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/me", get(get_current_user))
        .route("/users/:user_id", get(get_user))
        .route("/users/search", get(search_users))
        .route("/posts", post(create_post))
        .route("/posts/:post_id", get(get_post))
        .route("/posts/feed", get(get_feed))
        .route("/posts/:post_id/like", post(like_post))
        .route("/follow/:following_id", post(follow_user))
        .route("/follow/:following_id", delete(unfollow_user))
        .route("/followers/:user_id", get(get_followers))
        .route("/following/:user_id", get(get_following))
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

#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchUsersQuery {
    pub query: String,
}

async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> impl IntoResponse {
    let layer_req = crate::layers::l4_oikoumene::RegisterRequest {
        username: req.username,
        email: req.email,
        password: req.password,
    };
    match state.l4_oikoumene.register(layer_req).await {
        Ok(response) => (StatusCode::CREATED, Json(ApiResponse::success(response))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> impl IntoResponse {
    let layer_req = crate::layers::l4_oikoumene::LoginRequest {
        email: req.email,
        password: req.password,
    };
    match state.l4_oikoumene.login(layer_req).await {
        Ok(response) => (StatusCode::OK, Json(ApiResponse::success(response))),
        Err(err) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_current_user(
    headers: HeaderMap,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match verify_token(&headers, &state.l4_oikoumene).await {
        Ok(user_id) => match state.l4_oikoumene.get_user_public(user_id).await {
            Ok(user) => (StatusCode::OK, Json(ApiResponse::success(user))),
            Err(err) => (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error(&err)),
            ),
        },
        Err(err) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i64>,
) -> impl IntoResponse {
    match state.l4_oikoumene.get_user_public(user_id).await {
        Ok(user) => (StatusCode::OK, Json(ApiResponse::success(user))),
        Err(err) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn search_users(
    State(state): State<Arc<AppState>>,
    Query(q): Query<SearchUsersQuery>,
) -> impl IntoResponse {
    let pattern = format!("%{}%", q.query);
    match sqlx::query_as::<_, crate::layers::l4_oikoumene::UserPublic>(
        "SELECT id, username, reputation, level, bio, avatar_url, created_at FROM users WHERE username LIKE ? LIMIT 20",
    )
    .bind(&pattern)
    .fetch_all(&state.l4_oikoumene.db)
    .await
    {
        Ok(users) => (StatusCode::OK, Json(ApiResponse::success(users))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err.to_string())),
        ),
    }
}

async fn create_post(
    headers: HeaderMap,
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreatePostRequest>,
) -> impl IntoResponse {
    match verify_token(&headers, &state.l4_oikoumene).await {
        Ok(user_id) => match state.l4_oikoumene.create_post(user_id, &req.content).await {
            Ok(post) => (StatusCode::CREATED, Json(ApiResponse::success(post))),
            Err(err) => (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error(&err)),
            ),
        },
        Err(err) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_post(
    State(state): State<Arc<AppState>>,
    Path(post_id): Path<i64>,
) -> impl IntoResponse {
    match state.l4_oikoumene.get_post(post_id).await {
        Ok(post) => (StatusCode::OK, Json(ApiResponse::success(post))),
        Err(err) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_feed(
    headers: HeaderMap,
    State(state): State<Arc<AppState>>,
    Query(pagination): Query<Pagination>,
) -> impl IntoResponse {
    match verify_token(&headers, &state.l4_oikoumene).await {
        Ok(user_id) => {
            let limit = pagination.limit.unwrap_or(20);
            let page = pagination.page.unwrap_or(1);
            let offset = (page - 1) * limit;
            match state.l4_oikoumene.get_feed(user_id, limit, offset).await {
                Ok(posts) => (StatusCode::OK, Json(ApiResponse::success(posts))),
                Err(err) => (
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse::<()>::error(&err)),
                ),
            }
        }
        Err(err) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn like_post(
    headers: HeaderMap,
    State(state): State<Arc<AppState>>,
    Path(post_id): Path<i64>,
) -> impl IntoResponse {
    match verify_token(&headers, &state.l4_oikoumene).await {
        Ok(user_id) => match state.l4_oikoumene.like_post(user_id, post_id).await {
            Ok(likes) => (StatusCode::OK, Json(ApiResponse::success(likes))),
            Err(err) => (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error(&err)),
            ),
        },
        Err(err) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn follow_user(
    headers: HeaderMap,
    State(state): State<Arc<AppState>>,
    Path(following_id): Path<i64>,
) -> impl IntoResponse {
    match verify_token(&headers, &state.l4_oikoumene).await {
        Ok(follower_id) => match state.l4_oikoumene.follow_user(follower_id, following_id).await {
            Ok(follow) => (StatusCode::OK, Json(ApiResponse::success(follow))),
            Err(err) => (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error(&err)),
            ),
        },
        Err(err) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn unfollow_user(
    headers: HeaderMap,
    State(state): State<Arc<AppState>>,
    Path(following_id): Path<i64>,
) -> impl IntoResponse {
    match verify_token(&headers, &state.l4_oikoumene).await {
        Ok(follower_id) => {
            match state.l4_oikoumene.unfollow_user(follower_id, following_id).await {
                Ok(_) => (
                    StatusCode::OK,
                    Json(ApiResponse::success("Unfollowed".to_string())),
                ),
                Err(err) => (
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse::<()>::error(&err)),
                ),
            }
        }
        Err(err) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_followers(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i64>,
) -> impl IntoResponse {
    match state.l4_oikoumene.get_followers(user_id).await {
        Ok(followers) => (StatusCode::OK, Json(ApiResponse::success(followers))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

async fn get_following(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i64>,
) -> impl IntoResponse {
    match state.l4_oikoumene.get_following(user_id).await {
        Ok(following) => (StatusCode::OK, Json(ApiResponse::success(following))),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&err)),
        ),
    }
}

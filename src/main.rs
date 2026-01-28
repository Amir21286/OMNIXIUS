use omnixius::api;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Инициализируем систему логирования
    tracing_subscriber::fmt::init();

    let app = api::app();

    // Запускаем сервер на порту 4000
    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    println!("== OMNIXIUS BACKEND: ACTIVE ==");
    println!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use warp::{http::StatusCode, reply::json, Rejection, Reply};

use crate::command::WorldEntities;
use crate::socket::{broadcast_debug_message, receive_connection};
use crate::{Client, Clients};

pub type Result<T> = std::result::Result<T, Rejection>;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    player_id: String,
    topics: Vec<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RegisterResponse {
    url: String,
}

pub async fn register_handler(body: RegisterRequest, clients: Clients) -> Result<impl Reply> {
    let player_id = body.player_id;
    let topics = body.topics;
    let new_client_key = Uuid::new_v4().as_simple().to_string();
    register_client(new_client_key.clone(), player_id, topics, clients).await;

    Ok(json(&RegisterResponse {
        url: format!("ws://127.0.0.1:8000/ws/{}", new_client_key),
    }))
}

pub async fn socket_handler(
    ws: warp::ws::Ws,
    client_key: String,
    clients: Clients,
    entities: WorldEntities,
) -> Result<impl Reply> {
    let client = clients.read().await.get(&client_key).cloned();
    match client {
        Some(client) => {
            Ok(ws.on_upgrade(move |socket| receive_connection(socket, client_key, clients, client, entities)))
        }
        None => Err(warp::reject::not_found()),
    }
}

pub async fn health_handler() -> Result<impl Reply> {
    Ok(StatusCode::OK)
}

async fn register_client(
    client_key: String,
    player_id: String,
    topics: Vec<String>,
    clients: Clients,
) {
    clients.write().await.insert(
        client_key,
        Client {
            player_id,
            topics: topics,
            sender: None,
        },
    );

    broadcast_debug_message(&clients, "A new client was registered").await;
}

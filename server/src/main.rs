mod command;
mod handler;
mod socket;

use std::sync::Arc;
use std::{collections::HashMap, convert::Infallible};
use tokio::sync::{mpsc, RwLock};
use warp::http::header::CONTENT_TYPE;
use warp::http::Method;
use warp::Filter;
use warp::{ws::Message, Rejection};

use command::WorldEntities;
use handler::{health_handler, register_handler, socket_handler};

#[derive(Debug, Clone)]
pub struct Client {
    pub player_id: String,
    pub topics: Vec<String>,
    pub sender: Option<mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>>,
}

pub type Clients = Arc<RwLock<HashMap<String, Client>>>;
pub type Result<T> = std::result::Result<T, Rejection>;

fn with_clients(clients: Clients) -> impl Filter<Extract = (Clients,), Error = Infallible> + Clone {
    warp::any().map(move || clients.clone())
}

fn with_entities(
    entities: WorldEntities,
) -> impl Filter<Extract = (WorldEntities,), Error = Infallible> + Clone {
    warp::any().map(move || entities.clone())
}

#[tokio::main]
async fn main() {
    let clients: Clients = Arc::new(RwLock::new(HashMap::new()));

    // Entities store world entities in a hash by the client key
    let entities: WorldEntities = Arc::new(RwLock::new(HashMap::new()));

    let health_route = warp::path!("health").and_then(health_handler);

    let register_routes = warp::path("register")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(clients.clone()))
        .and_then(register_handler);

    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(warp::path::param())
        .and(with_clients(clients.clone()))
        .and(with_entities(entities.clone()))
        .and_then(socket_handler);

    let routes = health_route.or(register_routes).or(ws_route).with(
        warp::cors()
            .allow_headers([CONTENT_TYPE])
            .allow_methods([Method::GET, Method::POST])
            .allow_any_origin(),
    );

    warp::serve(routes).run(([127, 0, 0, 1], 8000)).await;
}

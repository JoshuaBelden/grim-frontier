use serde::{Deserialize, Serialize};
use serde_json::to_string;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::socket::broadcast_message;
use crate::Clients;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WorldEntity {
    entity_id: String,
    player_id: String,
    position: (i32, i32),
}

pub type WorldEntities = Arc<RwLock<HashMap<String, Vec<WorldEntity>>>>;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum WorldCommand {
    #[serde(rename_all = "camelCase")]
    ListEntities,

    #[serde(rename_all = "camelCase")]
    CreateEntity {
        entity_id: String,
        position: (i32, i32),
    },
    #[serde(rename_all = "camelCase")]
    MoveEntity {
        entity_id: String,
        position: (i32, i32),
    },
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WorldCommandRequest {
    player_id: String,
    world_command: WorldCommand,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum WorldEvent {
    PlayerJoined,
    PlayerLeft,
    #[serde(rename_all = "camelCase")]
    EntitiesListed {
        entities: Vec<WorldEntity>,
    },
    #[serde(rename_all = "camelCase")]
    EntityCreated {
        entity_id: String,
        position: (i32, i32),
    },
    #[serde(rename_all = "camelCase")]
    EntityMoved {
        entity_id: String,
        position: (i32, i32),
    },
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct WorldEventResponse {
    player_id: String,
    world_event: WorldEvent,
}

pub async fn handle_world_command(
    world_command_request: WorldCommandRequest,
    clients: &Clients,
    client_key: &str,
    entities: &WorldEntities,
) {
    match world_command_request.world_command {
        WorldCommand::ListEntities => {
            println!("Listing entities");

            let world_event_response = WorldEventResponse {
                player_id: world_command_request.player_id,
                world_event: WorldEvent::EntitiesListed {
                    entities: entities.read().await.values().cloned().flatten().collect(),
                },
            };

            let world_event_response_str = to_string(&world_event_response).unwrap();
            broadcast_message(clients, "world-events", &world_event_response_str).await;
        }
        WorldCommand::CreateEntity {
            entity_id,
            position,
        } => {
            println!("Creating entity {} at position {:?}", entity_id, position);

            // Find the current clients entities by client id, then check if the hash value already has a collection
            // then insert the new entity into the collection.
            let mut entities = entities.write().await;
            let player_entities = entities.entry(client_key.to_string()).or_insert(vec![]);
            player_entities.push(WorldEntity {
                entity_id: entity_id.clone(),
                player_id: world_command_request.player_id.clone(),
                position: position,
            });

            let world_event_response = WorldEventResponse {
                player_id: world_command_request.player_id.clone(),
                world_event: WorldEvent::EntityCreated {
                    entity_id: entity_id.clone(),
                    position,
                },
            };

            let world_event_response_str = to_string(&world_event_response).unwrap();

            broadcast_message(clients, "world-events", &world_event_response_str).await;
        }
        WorldCommand::MoveEntity {
            entity_id,
            position,
        } => {
            println!("Moving entity {} to {:?}", entity_id, position);

            let world_event_response = WorldEventResponse {
                player_id: world_command_request.player_id,
                world_event: WorldEvent::EntityMoved {
                    entity_id,
                    position: position,
                },
            };
            let world_event_response_str = to_string(&world_event_response).unwrap();
            broadcast_message(clients, "world-events", &world_event_response_str).await;
        }
    }
}

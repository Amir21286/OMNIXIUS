use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use uuid::Uuid;
use rand::Rng;
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorRGB {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganismTraits {
    pub color: ColorRGB,
    pub size: f64,
    pub speed: f64,
    pub strength: f64,
    pub intelligence: f64,
    pub fertility: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Organism {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub generation: i64,
    pub traits: OrganismTraits,
    pub health: f64,
    pub energy: f64,
    pub created_at: i64,
    pub evolved_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mutation {
    pub trait_name: String,
    pub change: f64,
    pub is_beneficial: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionResult {
    pub parent_id: String,
    pub child_id: String,
    pub mutations: Vec<Mutation>,
    pub generation_increase: i64,
    pub traits_before: OrganismTraits,
    pub traits_after: OrganismTraits,
}

struct Store {
    organisms: HashMap<String, Organism>,
    evolution_history: Vec<(String, EvolutionResult)>,
}

pub struct L3Phoenix {
    store: RwLock<Store>,
}

fn random_trait_delta(rng: &mut impl Rng) -> f64 {
    (rng.gen::<f64>() - 0.5) * 0.4
}

impl L3Phoenix {
    pub fn new() -> Self {
        Self {
            store: RwLock::new(Store {
                organisms: HashMap::new(),
                evolution_history: Vec::new(),
            }),
        }
    }

    fn random_traits(rng: &mut impl Rng) -> OrganismTraits {
        OrganismTraits {
            color: ColorRGB {
                r: rng.gen_range(0..256),
                g: rng.gen_range(0..256),
                b: rng.gen_range(0..256),
            },
            size: 0.5 + rng.gen::<f64>() * 0.5,
            speed: rng.gen_range(1.0..10.0),
            strength: rng.gen_range(1.0..10.0),
            intelligence: rng.gen_range(1.0..10.0),
            fertility: rng.gen_range(0.1..1.0),
        }
    }

    pub async fn create_organism(&self, owner_id: &str, name: &str) -> Result<Organism, String> {
        let mut rng = rand::thread_rng();
        let now = Utc::now().timestamp();
        let id = Uuid::new_v4().to_string();
        let traits = Self::random_traits(&mut rng);
        let org = Organism {
            id: id.clone(),
            owner_id: owner_id.to_string(),
            name: name.to_string(),
            generation: 1,
            traits: traits.clone(),
            health: 100.0,
            energy: 100.0,
            created_at: now,
            evolved_at: now,
        };
        self.store.write().unwrap().organisms.insert(id, org.clone());
        Ok(org)
    }

    pub async fn get_organism(&self, organism_id: &str) -> Result<Option<Organism>, String> {
        let store = self.store.read().unwrap();
        Ok(store.organisms.get(organism_id).cloned())
    }

    pub async fn get_user_organisms(&self, user_id: &str) -> Result<Vec<Organism>, String> {
        let store = self.store.read().unwrap();
        Ok(store
            .organisms
            .values()
            .filter(|o| o.owner_id == user_id)
            .cloned()
            .collect())
    }

    pub async fn evolve_organism(&self, organism_id: &str) -> Result<EvolutionResult, String> {
        let mut store = self.store.write().unwrap();
        let parent = store
            .organisms
            .get(organism_id)
            .cloned()
            .ok_or_else(|| "Organism not found".to_string())?;

        let mut rng = rand::thread_rng();
        let mut traits_after = parent.traits.clone();

        let mut mutations = Vec::new();
        let d_size = random_trait_delta(&mut rng);
        let d_speed = random_trait_delta(&mut rng);
        let d_strength = random_trait_delta(&mut rng);
        let d_int = random_trait_delta(&mut rng);
        let d_fert = random_trait_delta(&mut rng);

        traits_after.size = (traits_after.size + d_size).max(0.1).min(2.0);
        traits_after.speed = (traits_after.speed + d_speed * 2.0).max(0.5).min(15.0);
        traits_after.strength = (traits_after.strength + d_strength * 2.0).max(0.5).min(15.0);
        traits_after.intelligence = (traits_after.intelligence + d_int * 2.0).max(0.5).min(15.0);
        traits_after.fertility = (traits_after.fertility + d_fert * 0.2).max(0.0).min(1.0);

        mutations.push(Mutation {
            trait_name: "size".to_string(),
            change: d_size,
            is_beneficial: d_size > 0.0,
        });
        mutations.push(Mutation {
            trait_name: "speed".to_string(),
            change: d_speed,
            is_beneficial: d_speed > 0.0,
        });
        mutations.push(Mutation {
            trait_name: "strength".to_string(),
            change: d_strength,
            is_beneficial: d_strength > 0.0,
        });
        mutations.push(Mutation {
            trait_name: "intelligence".to_string(),
            change: d_int,
            is_beneficial: d_int > 0.0,
        });
        mutations.push(Mutation {
            trait_name: "fertility".to_string(),
            change: d_fert,
            is_beneficial: d_fert > 0.0,
        });

        let now = Utc::now().timestamp();
        let child_id = Uuid::new_v4().to_string();
        let child = Organism {
            id: child_id.clone(),
            owner_id: parent.owner_id.clone(),
            name: format!("{} Gen{}", parent.name, parent.generation + 1),
            generation: parent.generation + 1,
            traits: traits_after.clone(),
            health: 100.0,
            energy: 100.0,
            created_at: now,
            evolved_at: now,
        };
        store.organisms.insert(child_id.clone(), child);

        let result = EvolutionResult {
            parent_id: organism_id.to_string(),
            child_id: child_id.clone(),
            mutations,
            generation_increase: 1,
            traits_before: parent.traits,
            traits_after: traits_after.clone(),
        };
        store.evolution_history.push((organism_id.to_string(), result.clone()));
        Ok(result)
    }

    pub async fn crossover(&self, parent1_id: &str, parent2_id: &str, name: &str) -> Result<Organism, String> {
        let store = self.store.read().unwrap();
        let p1 = store
            .organisms
            .get(parent1_id)
            .cloned()
            .ok_or_else(|| "Parent 1 not found".to_string())?;
        let p2 = store
            .organisms
            .get(parent2_id)
            .cloned()
            .ok_or_else(|| "Parent 2 not found".to_string())?;

        let mut rng = rand::thread_rng();
        let color = ColorRGB {
            r: (p1.traits.color.r + p2.traits.color.r) / 2,
            g: (p1.traits.color.g + p2.traits.color.g) / 2,
            b: (p1.traits.color.b + p2.traits.color.b) / 2,
        };
        let traits = OrganismTraits {
            color,
            size: (p1.traits.size + p2.traits.size) / 2.0,
            speed: (p1.traits.speed + p2.traits.speed) / 2.0,
            strength: (p1.traits.strength + p2.traits.strength) / 2.0,
            intelligence: (p1.traits.intelligence + p2.traits.intelligence) / 2.0,
            fertility: (p1.traits.fertility + p2.traits.fertility) / 2.0,
        };
        let now = Utc::now().timestamp();
        let id = Uuid::new_v4().to_string();
        let gen = p1.generation.max(p2.generation) + 1;
        let child = Organism {
            id: id.clone(),
            owner_id: p1.owner_id.clone(),
            name: name.to_string(),
            generation: gen,
            traits,
            health: 100.0,
            energy: 100.0,
            created_at: now,
            evolved_at: now,
        };
        drop(store);
        self.store.write().unwrap().organisms.insert(id, child.clone());
        Ok(child)
    }

    pub async fn get_evolution_history(&self, organism_id: &str) -> Result<Vec<EvolutionResult>, String> {
        let store = self.store.read().unwrap();
        Ok(store
            .evolution_history
            .iter()
            .filter(|(id, _)| id == organism_id)
            .map(|(_, r)| r.clone())
            .collect())
    }
}

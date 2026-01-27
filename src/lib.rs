//! OMNIXIUS – core Rust crate.
//!
//! This crate wires the layered architecture into Rust modules while keeping
//! the source files physically located under `layers/`.

pub mod layers {
    pub mod l0_quantum {
        #[path = "../layers/L0_quantum/quantum_mutator.rs"]
        pub mod quantum_mutator;
    }

    pub mod l1_chronos {
        #[path = "../layers/L1_chronos/chronos_storage.rs"]
        pub mod chronos_storage;
    }

    pub mod l3_organisms {
        pub mod o4_day_mohk {
            #[path = "../layers/L3_organisms/O4_day_mohk/phoenix_engine.rs"]
            pub mod phoenix_engine;
        }
    }
}


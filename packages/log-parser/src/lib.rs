//! Hearthstone Battlegrounds log parser - napi-rs native addon.
//!
//! Watches Hearthstone's Power.log file and emits structured game events
//! to Node.js via threadsafe callbacks. Provides real-time game state
//! tracking for the BG Tracker overlay.
//!
//! # Architecture
//!
//! - `watcher`: Polls Power.log for new lines
//! - `parser`: Converts raw log lines into structured events
//! - `game_state`: Tracks all game entities and their tags
//! - `bg_state`: BG-specific state machine (phases, turns, opponents)
//! - `events`: Event types emitted to the Node.js layer

#[macro_use]
extern crate napi_derive;

mod bg_state;
mod events;
mod game_state;
mod parser;
mod watcher;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use napi::bindgen_prelude::*;
use napi::threadsafe_function::{
    ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode,
};

use crate::bg_state::BgState;
use crate::events::BgEvent;
use crate::game_state::GameState;
use crate::parser::LogLineParser;
use crate::watcher::LogWatcher;

/// Global flag to track whether the watcher is running
static WATCHER_RUNNING: once_cell::sync::Lazy<Arc<AtomicBool>> =
    once_cell::sync::Lazy::new(|| Arc::new(AtomicBool::new(false)));

/// Start watching the Hearthstone log directory for game events.
///
/// This is the main entry point called from Node.js. It starts a background
/// thread that polls Power.log for new lines, parses them into game events,
/// and invokes the callback with each `BgEvent`.
///
/// # Arguments
/// * `log_dir` - Path to the Hearthstone log directory (e.g., `C:\Users\...\Hearthstone\Logs`)
/// * `callback` - A JS function that receives event objects
///
/// # Example (from Node.js)
/// ```js
/// const { startLogWatcher } = require('@bg-tracker/log-parser');
/// startLogWatcher('C:\\path\\to\\logs', (event) => {
///     console.log(event.type, event);
/// });
/// ```
#[napi]
pub fn start_log_watcher(
    log_dir: String,
    callback: ThreadsafeFunction<String, ErrorStrategy::Fatal>,
) {
    // Prevent multiple watchers from running simultaneously
    if WATCHER_RUNNING.load(Ordering::SeqCst) {
        return;
    }
    WATCHER_RUNNING.store(true, Ordering::SeqCst);

    let running = WATCHER_RUNNING.clone();

    // TODO: Implement the full watcher pipeline
    // 1. Create LogWatcher for the given log_dir
    // 2. Create crossbeam channel for raw lines
    // 3. Start watcher in a background thread
    // 4. In another thread, consume lines:
    //    a. Parse each line with LogLineParser
    //    b. Feed parsed events into GameState
    //    c. Derive BgEvents from GameState/BgState changes
    //    d. Send BgEvents to Node.js via the callback

    let _watcher = LogWatcher::new(log_dir);
    let _parser = LogLineParser::new();
    let _game_state = GameState::new();
    let _bg_state = BgState::new();

    // Stub: send a test event to verify the callback works
    callback.call("test".to_string(), ThreadsafeFunctionCallMode::NonBlocking);

    let _ = running;
}

/// Stop the log watcher.
///
/// Signals the background watcher thread to stop polling. The thread
/// will finish its current poll cycle and then exit cleanly.
#[napi]
pub fn stop_log_watcher() {
    WATCHER_RUNNING.store(false, Ordering::SeqCst);
}

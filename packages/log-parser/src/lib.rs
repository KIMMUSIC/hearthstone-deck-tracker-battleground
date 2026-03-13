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
use std::thread;

use napi::threadsafe_function::{
    ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode,
};
use parking_lot::Mutex;

use crate::bg_state::BgState;
use crate::game_state::GameState;
use crate::parser::LogLineParser;
use crate::watcher::LogWatcher;

/// Shared state for the watcher pipeline.
struct WatcherState {
    /// Flag to signal the watcher to stop
    running: Arc<AtomicBool>,
    /// Handle to the watcher thread
    watcher_handle: Option<thread::JoinHandle<()>>,
    /// Handle to the processor thread
    processor_handle: Option<thread::JoinHandle<()>>,
    /// Shared BG state for external queries
    bg_state: Arc<Mutex<BgState>>,
    /// Shared Game state for external queries
    game_state: Arc<Mutex<GameState>>,
}

/// Global watcher state, protected by a parking_lot Mutex.
static WATCHER_STATE: once_cell::sync::Lazy<Mutex<Option<WatcherState>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

/// Start watching the Hearthstone log directory for game events.
///
/// This is the main entry point called from Node.js. It starts background
/// threads that poll Power.log for new lines, parse them into game events,
/// and invoke the callback with each `BgEvent` serialized as a JSON string.
///
/// # Arguments
/// * `log_dir` - Path to the Hearthstone log directory (e.g., `C:\Users\...\Hearthstone\Logs`)
/// * `callback` - A JS function that receives event JSON strings
///
/// # Example (from Node.js)
/// ```js
/// const { startLogWatcher } = require('@bg-tracker/log-parser');
/// startLogWatcher('C:\\path\\to\\logs', (eventJson) => {
///     const event = JSON.parse(eventJson);
///     console.log(event.type, event);
/// });
/// ```
#[napi]
pub fn start_log_watcher(
    log_dir: String,
    callback: ThreadsafeFunction<String, ErrorStrategy::Fatal>,
) {
    let mut state_guard = WATCHER_STATE.lock();

    // Prevent multiple watchers from running simultaneously
    if let Some(ref existing) = *state_guard {
        if existing.running.load(Ordering::SeqCst) {
            return;
        }
    }

    // Create shared state
    let running = Arc::new(AtomicBool::new(true));
    let bg_state = Arc::new(Mutex::new(BgState::new()));
    let game_state_shared = Arc::new(Mutex::new(GameState::new()));

    // Create crossbeam channel for raw lines
    let (sender, receiver) = crossbeam_channel::unbounded::<String>();

    // Clone references for the watcher thread
    let watcher_running = running.clone();
    let watcher_log_dir = log_dir.clone();

    // Spawn watcher thread: polls Power.log and sends raw lines
    let watcher_handle = thread::Builder::new()
        .name("bg-log-watcher".to_string())
        .spawn(move || {
            let mut log_watcher = LogWatcher::new(watcher_log_dir);
            // Override the watcher's internal running flag with our shared one
            // We'll use the external flag to control the loop
            // The watcher's own running flag is set inside start()
            // We need to coordinate: stop the watcher when our flag goes false

            // We use a custom approach: run the watcher in a loop ourselves
            // rather than calling watcher.start() which has its own loop
            // This way we can share the running flag directly.
            //
            // Actually, the LogWatcher::start already loops on its own running flag.
            // We need to make the watcher use our shared running flag.
            // The simplest approach: set the watcher's running flag, and when
            // we want to stop, set both flags to false.

            // Use a wrapper: poll in our own loop, delegating to watcher internals
            // For simplicity, just call start() which blocks until stop() is called.
            // We'll have the stop function handle both.

            // Spawn a monitor that watches our external flag and stops the watcher
            let watcher_running_clone = watcher_running.clone();
            let watcher_running_flag = log_watcher.running_flag();

            thread::Builder::new()
                .name("bg-watcher-monitor".to_string())
                .spawn(move || {
                    while watcher_running_clone.load(Ordering::SeqCst) {
                        thread::sleep(std::time::Duration::from_millis(50));
                    }
                    // Signal the watcher to stop
                    watcher_running_flag.store(false, Ordering::SeqCst);
                })
                .ok();

            log_watcher.start(sender);
        })
        .expect("Failed to spawn watcher thread");

    // Clone references for the processor thread
    let processor_running = running.clone();
    let processor_bg_state = bg_state.clone();
    let processor_game_state = game_state_shared.clone();

    // Spawn processor thread: receives lines, parses, updates state, emits events
    let processor_handle = thread::Builder::new()
        .name("bg-log-processor".to_string())
        .spawn(move || {
            let parser = LogLineParser::new();

            while processor_running.load(Ordering::SeqCst) {
                // Use recv_timeout to periodically check the running flag
                match receiver.recv_timeout(std::time::Duration::from_millis(100)) {
                    Ok(line) => {
                        // Parse the line
                        if let Some(event) = parser.parse_line(&line) {
                            // Process through game state
                            let tag_changes = {
                                let mut gs = processor_game_state.lock();
                                gs.process_event(&event)
                            };

                            // Process tag changes through BG state
                            let bg_events = {
                                let gs = processor_game_state.lock();
                                let mut bs = processor_bg_state.lock();
                                let mut all_events = Vec::new();
                                for tc in &tag_changes {
                                    let events = bs.process_tag_change(tc, &gs);
                                    all_events.extend(events);
                                }
                                all_events
                            };

                            // Emit events to Node.js as JSON strings
                            for bg_event in bg_events {
                                let json = bg_event.to_json();
                                if !json.is_empty() {
                                    callback.call(
                                        json,
                                        ThreadsafeFunctionCallMode::NonBlocking,
                                    );
                                }
                            }
                        }
                    }
                    Err(crossbeam_channel::RecvTimeoutError::Timeout) => {
                        // No new lines, continue checking running flag
                        continue;
                    }
                    Err(crossbeam_channel::RecvTimeoutError::Disconnected) => {
                        // Sender dropped, watcher stopped
                        break;
                    }
                }
            }
        })
        .expect("Failed to spawn processor thread");

    // Store state for later stop/query
    *state_guard = Some(WatcherState {
        running,
        watcher_handle: Some(watcher_handle),
        processor_handle: Some(processor_handle),
        bg_state,
        game_state: game_state_shared,
    });
}

/// Stop the log watcher.
///
/// Signals the background watcher and processor threads to stop.
/// Waits for both threads to finish before returning.
#[napi]
pub fn stop_log_watcher() {
    let mut state_guard = WATCHER_STATE.lock();

    if let Some(mut state) = state_guard.take() {
        // Signal stop
        state.running.store(false, Ordering::SeqCst);

        // Wait for threads to finish
        if let Some(handle) = state.watcher_handle.take() {
            let _ = handle.join();
        }
        if let Some(handle) = state.processor_handle.take() {
            let _ = handle.join();
        }
    }
}

/// Get the current BG state as a JSON string.
///
/// Returns a JSON-serialized `BgStateSummary` containing the current
/// phase, turn, hero, tavern tier, health, and number of alive opponents.
#[napi]
pub fn get_current_state() -> String {
    let state_guard = WATCHER_STATE.lock();

    if let Some(ref state) = *state_guard {
        let bs = state.bg_state.lock();
        let summary = bs.get_current_state();
        serde_json::to_string(&summary).unwrap_or_else(|_| "{}".to_string())
    } else {
        "{}".to_string()
    }
}

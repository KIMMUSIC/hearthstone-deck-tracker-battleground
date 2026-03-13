//! File watcher for Hearthstone's Power.log file.
//!
//! Polls the log file at a configurable interval, reading new lines
//! as they are appended. Detected lines are sent through a crossbeam
//! channel to the parser for processing.
//!
//! The watcher runs in a background thread and can be stopped via
//! the `stop()` method which sets an atomic flag.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crossbeam_channel::Sender;

/// Watches the Hearthstone log directory for changes to Power.log.
///
/// Uses a polling strategy (rather than filesystem notifications) for
/// reliability across different Windows configurations and network drives.
pub struct LogWatcher {
    /// Path to the Hearthstone log directory
    log_dir: String,
    /// Current read offset in the log file (bytes from start)
    offset: u64,
    /// Flag to signal the watcher thread to stop
    running: Arc<AtomicBool>,
}

impl LogWatcher {
    /// Create a new LogWatcher targeting the given log directory.
    ///
    /// The watcher will look for `Power.log` inside this directory.
    /// Reading starts from offset 0 (beginning of file).
    pub fn new(log_dir: String) -> Self {
        Self {
            log_dir,
            offset: 0,
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Start watching the log file, sending new lines to the provided channel.
    ///
    /// This method blocks the current thread and polls the file at regular
    /// intervals (~100ms). Each new line discovered since the last poll is
    /// sent through the `sender` channel.
    ///
    /// # Implementation Notes (TODO)
    /// - Open `Power.log` in the log_dir
    /// - Seek to `self.offset`
    /// - Read new lines and send each through the channel
    /// - Update `self.offset` after each read
    /// - Sleep for the poll interval
    /// - Handle file rotation (Hearthstone recreates the file on restart)
    pub fn start(&mut self, _sender: Sender<String>) {
        self.running.store(true, Ordering::SeqCst);

        // TODO: Implement file polling loop
        // while self.running.load(Ordering::SeqCst) {
        //     1. Open/reopen Power.log if needed
        //     2. Seek to self.offset
        //     3. Read new lines
        //     4. Send each line through _sender
        //     5. Update self.offset
        //     6. Sleep for poll interval (~100ms)
        // }
    }

    /// Signal the watcher to stop polling.
    ///
    /// The watcher thread will finish its current poll cycle and then exit.
    pub fn stop(&self) {
        self.running.store(false, Ordering::SeqCst);
    }

    /// Check whether the watcher is currently running.
    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::SeqCst)
    }
}

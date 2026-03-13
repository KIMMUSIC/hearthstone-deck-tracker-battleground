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
use std::io::{Read, Seek, SeekFrom};
use std::fs::{self, OpenOptions};
use std::thread;
use std::time::Duration;
use std::path::{Path, PathBuf};

use crossbeam_channel::Sender;

/// Poll interval in milliseconds.
const POLL_INTERVAL_MS: u64 = 100;

/// Relevant namespace substrings that we filter for.
const RELEVANT_NAMESPACES: &[&str] = &["PowerTaskList", "GameState", "PowerProcessor"];

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
    /// Leftover bytes from previous read that didn't end with a newline
    remainder: String,
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
            remainder: String::new(),
        }
    }

    /// Get a clone of the running flag for external stop signaling.
    pub fn running_flag(&self) -> Arc<AtomicBool> {
        self.running.clone()
    }

    /// Detect the active Power.log file path.
    ///
    /// First checks for Power.log directly in log_dir. If not found,
    /// scans subdirectories for the most recently modified Power.log.
    fn detect_log_path(log_dir: &str) -> Option<PathBuf> {
        let base = Path::new(log_dir);

        // Check direct path first
        let direct = base.join("Power.log");
        if direct.exists() {
            return Some(direct);
        }

        // Scan subdirectories for the most recently modified Power.log
        let mut best_path: Option<PathBuf> = None;
        let mut best_modified = std::time::SystemTime::UNIX_EPOCH;

        if let Ok(entries) = fs::read_dir(base) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let candidate = path.join("Power.log");
                    if candidate.exists() {
                        if let Ok(meta) = fs::metadata(&candidate) {
                            if let Ok(modified) = meta.modified() {
                                if modified > best_modified {
                                    best_modified = modified;
                                    best_path = Some(candidate);
                                }
                            }
                        }
                    }
                }
            }
        }

        best_path
    }

    /// Check if a line is relevant for parsing.
    ///
    /// Lines must start with "D " (debug log prefix) and contain
    /// one of the relevant namespace identifiers.
    fn is_relevant_line(line: &str) -> bool {
        if !line.starts_with("D ") {
            return false;
        }
        RELEVANT_NAMESPACES.iter().any(|ns| line.contains(ns))
    }

    /// Start watching the log file, sending new lines to the provided channel.
    ///
    /// This method blocks the current thread and polls the file at regular
    /// intervals (~100ms). Each new line discovered since the last poll is
    /// sent through the `sender` channel.
    ///
    /// Handles file rotation: if the file size shrinks (Hearthstone recreates
    /// the file on restart), the offset resets to 0.
    pub fn start(&mut self, sender: Sender<String>) {
        self.running.store(true, Ordering::SeqCst);

        while self.running.load(Ordering::SeqCst) {
            // Detect the active log path each iteration to handle directory changes
            let log_path = match Self::detect_log_path(&self.log_dir) {
                Some(p) => p,
                None => {
                    // No Power.log found yet; wait and retry
                    thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
                    continue;
                }
            };

            // Open file with read-only shared access (Windows compatibility)
            let file = OpenOptions::new().read(true).open(&log_path);

            match file {
                Ok(mut f) => {
                    // Check file size for rotation detection
                    if let Ok(metadata) = f.metadata() {
                        let file_size = metadata.len();
                        if file_size < self.offset {
                            // File was rotated (recreated by Hearthstone restart)
                            self.offset = 0;
                            self.remainder.clear();
                        }
                    }

                    // Seek to current offset
                    if f.seek(SeekFrom::Start(self.offset)).is_err() {
                        thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
                        continue;
                    }

                    // Read new bytes
                    let mut buffer = Vec::new();
                    match f.read_to_end(&mut buffer) {
                        Ok(bytes_read) => {
                            if bytes_read > 0 {
                                self.offset += bytes_read as u64;

                                // Convert to string, prepending any remainder from last read
                                let text = match String::from_utf8(buffer) {
                                    Ok(s) => s,
                                    Err(e) => {
                                        // Lossy conversion for non-UTF8 bytes
                                        String::from_utf8_lossy(e.as_bytes()).into_owned()
                                    }
                                };

                                let mut combined = std::mem::take(&mut self.remainder);
                                combined.push_str(&text);

                                // Split into lines
                                let mut lines: Vec<&str> = combined.split('\n').collect();

                                // If the last chunk doesn't end with newline, save as remainder
                                if !combined.ends_with('\n') {
                                    if let Some(last) = lines.pop() {
                                        self.remainder = last.to_string();
                                    }
                                }

                                // Send relevant lines through channel
                                for line in lines {
                                    let trimmed = line.trim_end_matches('\r');
                                    if trimmed.is_empty() {
                                        continue;
                                    }
                                    if Self::is_relevant_line(trimmed) {
                                        if sender.send(trimmed.to_string()).is_err() {
                                            // Receiver dropped, stop watching
                                            self.running.store(false, Ordering::SeqCst);
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        Err(_) => {
                            // Read error, will retry next cycle
                        }
                    }
                }
                Err(_) => {
                    // File not accessible yet, will retry next cycle
                }
            }

            thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
        }
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

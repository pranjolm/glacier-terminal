/// Streaming OSC (Operating System Command) escape sequence parser.
/// Strips recognized OSC sequences from PTY output and returns semantic events.

#[derive(Debug, Clone)]
pub enum OscEvent {
    /// OSC 7: working directory changed. Payload is the file:// URL.
    CwdChange(String),
    /// OSC 2: window/tab title changed.
    TitleChange(String),
    /// OSC 133 A/B/C/D: semantic prompt marks.
    PromptMark(PromptMark),
    /// OSC 684: inline autocomplete suggestion (Glacier custom).
    Suggestion(String),
}

#[derive(Debug, Clone)]
pub enum PromptMark {
    PromptStart,
    PromptEnd,
    CommandStart,
    CommandEnd(#[allow(dead_code)] Option<i32>),
}

#[derive(Default)]
enum State {
    #[default]
    Normal,
    Esc,
    InOsc(Vec<u8>),
}

pub struct OscParser {
    state: State,
}

impl OscParser {
    pub fn new() -> Self {
        Self { state: State::default() }
    }

    /// Process `input` bytes. Returns (cleaned output bytes, list of OSC events).
    pub fn process(&mut self, input: &[u8]) -> (Vec<u8>, Vec<OscEvent>) {
        let mut output = Vec::with_capacity(input.len());
        let mut events = Vec::new();

        for &byte in input {
            match &mut self.state {
                State::Normal => {
                    if byte == 0x1b {
                        self.state = State::Esc;
                    } else {
                        output.push(byte);
                    }
                }
                State::Esc => {
                    if byte == b']' {
                        self.state = State::InOsc(Vec::new());
                    } else {
                        // Not an OSC — emit the ESC and current byte
                        output.push(0x1b);
                        output.push(byte);
                        self.state = State::Normal;
                    }
                }
                State::InOsc(buf) => {
                    // OSC is terminated by BEL (0x07) or ST (ESC \)
                    if byte == 0x07 {
                        let content = std::mem::take(buf);
                        if let Some(event) = parse_osc(&content) {
                            events.push(event);
                        }
                        self.state = State::Normal;
                    } else if byte == 0x1b {
                        // Could be start of ST (ESC \). Peek: next byte must be \
                        // We handle this by treating ESC inside OSC as potential terminator
                        // Store ESC in buf as marker byte 0xFF (safe sentinel, won't appear in OSC)
                        buf.push(0xFE); // sentinel for "ESC seen"
                    } else if byte == b'\\' {
                        // Check if last byte was our sentinel ESC marker
                        if buf.last() == Some(&0xFE) {
                            buf.pop(); // remove ESC sentinel
                            let content = std::mem::take(buf);
                            if let Some(event) = parse_osc(&content) {
                                events.push(event);
                            }
                            self.state = State::Normal;
                        } else {
                            buf.push(byte);
                        }
                    } else {
                        buf.push(byte);
                    }
                }
            }
        }
        (output, events)
    }
}

fn parse_osc(content: &[u8]) -> Option<OscEvent> {
    let s = std::str::from_utf8(content).ok()?;
    let (code_str, rest) = s.split_once(';')?;
    let code: u32 = code_str.trim().parse().ok()?;

    match code {
        7 => Some(OscEvent::CwdChange(rest.to_string())),
        2 => Some(OscEvent::TitleChange(rest.to_string())),
        133 => {
            let mark = match rest.trim() {
                "A" => PromptMark::PromptStart,
                "B" => PromptMark::PromptEnd,
                "C" => PromptMark::CommandStart,
                s if s.starts_with('D') => {
                    let code = s.strip_prefix("D;").and_then(|c| c.parse().ok());
                    PromptMark::CommandEnd(code)
                }
                _ => return None,
            };
            Some(OscEvent::PromptMark(mark))
        }
        684 => Some(OscEvent::Suggestion(rest.to_string())),
        _ => None,
    }
}

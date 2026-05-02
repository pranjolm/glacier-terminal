/// Detect the user's preferred shell from $SHELL env var, falling back to /bin/zsh.
pub fn detect_shell() -> String {
    std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
}

use std::fs;
use std::path::PathBuf;

use portable_pty::CommandBuilder;

use crate::pty::session::ShellKind;

const FISH_INTEGRATION: &str = r#"
# Glacier terminal integration

# Add Glacier's bundled tools to PATH so icons work out of the box
if test -n "$GLACIER_BIN_DIR" -a -d "$GLACIER_BIN_DIR"
    fish_add_path "$GLACIER_BIN_DIR"
end

# Merge history from all sessions so each new pane sees the full history
builtin history merge 2>/dev/null; true
function __glacier_history_merge --on-event fish_prompt
    builtin history merge 2>/dev/null; true
end

# File icons via bundled lsd
if command -q lsd
    alias ls='lsd'
    alias ll='lsd -la'
    alias la='lsd -a'
end

# Report working directory on each prompt
function __glacier_cwd --on-event fish_prompt
    printf '\033]7;file://%s%s\033\\' (hostname) (pwd | string escape --style=url)
end

# Prompt marks for semantic terminal support
function __glacier_prompt_start --on-event fish_prompt
    printf '\033]133;A\033\\'
end
function __glacier_prompt_end
    printf '\033]133;B\033\\'
end
function __glacier_preexec --on-event fish_preexec
    printf '\033]133;C\033\\'
end
function __glacier_postexec --on-event fish_postexec
    printf '\033]133;D;%s\033\\' $status
end

# Inline autocomplete: emit current autosuggestion via OSC 684
function __glacier_suggest
    set -l cmd (commandline -b)
    if test -z "$cmd"
        printf '\033]684;\033\\'
        return
    end

    # Priority 1: History match
    set -l hist (history --prefix "$cmd" | head -n1)
    if test -n "$hist"
        set -l sug (string replace "$cmd" "" "$hist")
        if test -n "$sug"
            printf '\033]684;%s\033\\' "$sug"
            return
        end
    end

    # Priority 2: Completion match (e.g. paths)
    set -l comp (complete -C"$cmd" | head -n1 | cut -f1)
    if test -n "$comp"
        set -l tokens (string split " " -- "$cmd")
        set -l last_token $tokens[-1]
        if test -n "$last_token" -a (string match -q "$last_token*" "$comp")
            set -l sug (string replace "$last_token" "" "$comp")
            if test -n "$sug"
                printf '\033]684;%s\033\\' "$sug"
                return
            end
        end
    end

    printf '\033]684;\033\\'
end

# Update suggestion on common typing keys
for c in (string split "" "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_./ ")
    bind $c "commandline -i $c; __glacier_suggest"
end
bind \ch "commandline -f backward-delete-char; __glacier_suggest"
bind \x7f "commandline -f backward-delete-char; __glacier_suggest"

# Bind right arrow and tab to accept and then refresh
bind \e\[C 'commandline -f forward-char; __glacier_suggest'
bind \t 'commandline -f complete; __glacier_suggest'
"#;

const ZSH_INTEGRATION: &str = r#"
# Glacier terminal integration for Zsh

# Add Glacier's bundled tools to PATH so icons work out of the box
if [[ -n "$GLACIER_BIN_DIR" && -d "$GLACIER_BIN_DIR" ]]; then
    export PATH="$GLACIER_BIN_DIR:$PATH"
fi

# Shared history across all panes — every command is appended immediately
# and every prompt reload reads the latest history from disk
HISTFILE="${HISTFILE:-$HOME/.zsh_history}"
HISTSIZE=50000
SAVEHIST=50000
setopt SHARE_HISTORY INC_APPEND_HISTORY_TIME HIST_IGNORE_DUPS HIST_REDUCE_BLANKS

# File icons via bundled lsd
if command -v lsd &>/dev/null; then
    alias ls='lsd'
    alias ll='lsd -la'
    alias la='lsd -a'
fi

# Report working directory
__glacier_cwd() {
    local url="file://${HOST}${PWD// /%20}"
    printf '\033]7;%s\033\\' "$url"
}
add-zsh-hook chpwd __glacier_cwd
__glacier_cwd

# Prompt marks
__glacier_prompt_start() { printf '\033]133;A\033\\'; }
__glacier_prompt_end()   { printf '\033]133;B\033\\'; }
__glacier_preexec()      { printf '\033]133;C\033\\'; }
__glacier_precmd()       { printf '\033]133;D;%s\033\\' "$?"; }

add-zsh-hook precmd  __glacier_prompt_start
add-zsh-hook precmd  __glacier_precmd
add-zsh-hook preexec __glacier_preexec

# Inline autocomplete suggestion via OSC 684 (requires zsh-autosuggestions)
__glacier_emit_suggestion() {
    if [[ -n "$ZSH_AUTOSUGGEST_SUGGESTION" ]]; then
        printf '\033]684;%s\033\\' "$ZSH_AUTOSUGGEST_SUGGESTION"
    else
        printf '\033]684;\033\\'
    fi
}

# Hook into zsh-autosuggestions if available
if typeset -f _zsh_autosuggest_fetch >/dev/null 2>&1; then
    ZSH_AUTOSUGGEST_STRATEGY=(history completion)
    ZSH_AUTOSUGGEST_POST_WIDGET_HOOKS+=(__glacier_emit_suggestion)
    zle-line-init() { _zsh_autosuggest_start; }
    zle -N zle-line-init
fi

# Title reporting
precmd() { printf '\033]2;%s\033\\' "${PWD/#$HOME/~}"; }
"#;

const BASH_INTEGRATION: &str = r#"
# Glacier terminal integration for Bash

# Add Glacier's bundled tools to PATH so icons work out of the box
if [[ -n "$GLACIER_BIN_DIR" && -d "$GLACIER_BIN_DIR" ]]; then
    export PATH="$GLACIER_BIN_DIR:$PATH"
fi

# Shared history: append to history file after every command, re-read before each prompt
export HISTFILE="${HISTFILE:-$HOME/.bash_history}"
export HISTSIZE=50000
export HISTFILESIZE=50000
export HISTCONTROL=ignoredups:erasedups
shopt -s histappend
export PROMPT_COMMAND="history -a; history -r; ${PROMPT_COMMAND:-}"

# File icons via bundled lsd
if command -v lsd &>/dev/null; then
    alias ls='lsd'
    alias ll='lsd -la'
    alias la='lsd -a'
fi

__glacier_cwd() {
    printf '\033]7;file://%s%s\033\\' "$HOSTNAME" "$PWD"
}
PROMPT_COMMAND="__glacier_cwd; ${PROMPT_COMMAND:-}"

__glacier_preexec() {
    printf '\033]133;C\033\\'
}
__glacier_precmd() {
    printf '\033]133;D;%s\033\\' "$?"
    printf '\033]133;A\033\\'
}
trap '__glacier_preexec' DEBUG
PROMPT_COMMAND="__glacier_precmd; __glacier_cwd; ${PROMPT_COMMAND:-}"
"#;

pub fn write_integration_scripts() -> anyhow::Result<PathBuf> {
    let base = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("~/.config"))
        .join("glacier")
        .join("integration");

    fs::create_dir_all(&base)?;
    fs::create_dir_all(base.join("zsh"))?;

    fs::write(base.join("glacier.fish"), FISH_INTEGRATION)?;
    fs::write(base.join("glacier.bash"), BASH_INTEGRATION)?;

    // Zsh: .zshrc that sources the real one then appends integration
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("~"));
    let zshrc_content = format!(
        r#"# Glacier Zsh integration wrapper
# Source user's real zshrc first
if [[ -f "{home}/.zshrc" ]]; then
  source "{home}/.zshrc"
fi
autoload -U add-zsh-hook
{integration}
"#,
        home = home.display(),
        integration = ZSH_INTEGRATION,
    );
    fs::write(base.join("zsh").join(".zshrc"), zshrc_content)?;

    Ok(base)
}

/// Build the CommandBuilder for the shell with integration injected via env vars.
pub fn build_shell_command(
    shell_path: &str,
    shell_kind: &ShellKind,
    cwd: &str,
    bin_dir: Option<&str>,
) -> CommandBuilder {
    let base = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"))
        .join("glacier")
        .join("integration");

    let _ = write_integration_scripts();

    let mut cmd = CommandBuilder::new(shell_path);
    cmd.cwd(cwd);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "glacier");
    cmd.env("TERM_PROGRAM_VERSION", env!("CARGO_PKG_VERSION"));

    if let Some(bin) = bin_dir {
        cmd.env("GLACIER_BIN_DIR", bin);
    }

    match shell_kind {
        ShellKind::Fish => {
            let script = base.join("glacier.fish");
            cmd.args(["--init-command", &format!("source {}", script.display())]);
        }
        ShellKind::Zsh => {
            cmd.env("ZDOTDIR", base.join("zsh").to_string_lossy().as_ref());
        }
        ShellKind::Bash => {
            cmd.env("BASH_ENV", base.join("glacier.bash").to_string_lossy().as_ref());
        }
        ShellKind::Unknown(_) => {}
    }

    cmd
}

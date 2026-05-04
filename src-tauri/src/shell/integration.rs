use std::fs;
use std::path::PathBuf;

use portable_pty::CommandBuilder;

use crate::pty::session::ShellKind;

/// Seed history — common commands that work as a fallback when the user's
/// shell history is empty or doesn't have a match. Written to a plain text
/// file and searched by the shell integration scripts.
const SEED_HISTORY: &str = r#"cd
cd ~
cd Desktop
cd Documents
cd Downloads
ls
ls -la
ls -lah
pwd
clear
exit
open .
mkdir
mkdir -p
rm -rf
rm -i
cp -r
mv
chmod +x
sudo
sudo !!
touch
cat
less
head
tail -f
grep -r
grep -i
find . -name
which
whereis
man
history
alias
source ~/.zshrc
source ~/.bashrc
exec $SHELL
brew install
brew update
brew upgrade
brew search
brew doctor
brew tap
brew list
brew uninstall
npm install
npm install -g
npm run dev
npm run build
npm run test
npm start
npm init
npx
cargo build
cargo run
cargo test
cargo clippy
cargo check
rustc --version
python3
python3 -m venv venv
source venv/bin/activate
pip install
pip install -r requirements.txt
pip freeze
pip list
uv add
uv run
poetry add
poetry run
black .
flake8
mypy
pytest
ruff check
node
node --version
tsc
tsc --watch
yarn install
yarn dev
pnpm install
pnpm dev
pnpm build
git clone
git status
git add .
git add -A
git commit -m
git push
git push -u origin main
git pull
git pull --rebase
git fetch
git branch
git branch -a
git checkout
git checkout -b
git switch
git switch -c
git merge
git rebase
git log --oneline
git log --graph
git diff
git diff --staged
git stash
git stash pop
git stash list
git reset --hard HEAD
git revert
git cherry-pick
git tag
git remote -v
git remote add origin
git restore .
git restore --staged .
docker ps
docker ps -a
docker images
docker build -t
docker run -it
docker run -d -p
docker stop
docker rm
docker rmi
docker exec -it
docker-compose up
docker-compose up -d
docker-compose down
docker-compose logs -f
kubectl get pods
kubectl get nodes
kubectl apply -f
kubectl delete -f
kubectl logs
kubectl exec -it
curl -O
curl -L
curl -s
wget
ssh
scp -r
rsync -avz
tar -czvf
tar -xzvf
zip -r
unzip
pkill
kill -9
ps aux
top
htop
lsof -i
netstat -tlnp
ping
traceroute
nslookup
dig
ifconfig
ip addr
nmap
xcode-select --install
xcrun
clang
make
cmake
llvm-gcc
otool -L
lipo -info
codesign -s
xcodebuild
plutil -p
mdls
mdfind
qlmanage -p
sips -Z
say
afplay
osascript -e
date
cal
bc
shasum -a 256
cut -d
cut -f
sort
uniq
tr
sed 's///g'
awk '{print $1}'
wc -l
xxd
column -t
base64
diff
comm
patch
export PATH="$HOME/.local/bin:$PATH"
export EDITOR=vim
export EDITOR=nano
export EDITOR=code
vi
vim
nano
code .
gh auth login
gh repo create
gh pr create
gh pr checkout
glacier
ollama run claude
ollama list
ollama pull
#"#;

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

    # Detect file/directory commands — for these, prioritize completions over history
    set -l file_cmds cd ls ll la cat touch mkdir rmdir rm cp mv open code vim vi nano less more head tail grep find chmod chown diff scp rsync tar zip unzip docker kubectl
    set -l cmd_first_word (string split " " -- "$cmd")[1]
    set -l is_file_cmd false
    if contains "$cmd_first_word" $file_cmds
        set is_file_cmd true
    end

    # For file commands: Priority 1 = Completion match (paths/directories)
    if test "$is_file_cmd" = true
        set -l comp (complete -C"$cmd" | head -n1 | cut -f1)
        if test -n "$comp"
            set -l tokens (string split " " -- "$cmd")
            set -l last_token $tokens[-1]
            if test -n "$last_token" -a (string match -qi "$last_token*" "$comp")
                set -l token_lower (string lower "$last_token")
                set -l comp_lower (string lower "$comp")
                if string match -q "$token_lower*" "$comp_lower"
                    set -l sug (string sub -s (math (string length "$last_token") + 1) "$comp")
                    if test -n "$sug"
                        printf '\033]684;%s\033\\' "$sug"
                        return
                    end
                end
            end
        end
    end

    # Priority 1 (non-file) / Priority 2 (file): History match
    set -l hist (history --prefix "$cmd" | head -n1)
    # Seed fallback — common commands shipped with Glacier
    if test -z "$hist"; and test -n "$GLACIER_SEED_FILE"; and test -f "$GLACIER_SEED_FILE"
        set hist (grep -F -i "$cmd" "$GLACIER_SEED_FILE" | head -n1)
    end
    if test -n "$hist"
        set -l cmd_lower (string lower "$cmd")
        set -l hist_lower (string lower "$hist")
        if string match -q "$cmd_lower*" "$hist_lower"
            set -l sug (string sub -s (math (string length "$cmd") + 1) "$hist")
            if test -n "$sug"
                printf '\033]684;%s\033\\' "$sug"
                return
            end
        end
    end

    # Priority 2 (non-file) / Fallback (file): Completion match
    if test "$is_file_cmd" != true
        set -l comp (complete -C"$cmd" | head -n1 | cut -f1)
        if test -n "$comp"
            set -l tokens (string split " " -- "$cmd")
            set -l last_token $tokens[-1]
            if test -n "$last_token" -a (string match -qi "$last_token*" "$comp")
                set -l token_lower (string lower "$last_token")
                set -l comp_lower (string lower "$comp")
                if string match -q "$token_lower*" "$comp_lower"
                    set -l sug (string sub -s (math (string length "$last_token") + 1) "$comp")
                    if test -n "$sug"
                        printf '\033]684;%s\033\\' "$sug"
                        return
                    end
                end
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

# Seed history with common commands if not already present
__glacier_seed_history() {
    local marker='## Glacier seed history'
    [[ -n "$HISTFILE" ]] || return
    if [[ ! -f "$HISTFILE" ]] || ! grep -qF "$marker" "$HISTFILE" 2>/dev/null; then
        {
            echo "$marker"
            cat "$GLACIER_SEED_FILE"
        } >> "$HISTFILE"
        fc -R "$HISTFILE" 2>/dev/null || true
    fi
}
__glacier_seed_history

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

# Inline autocomplete suggestion via OSC 684
__glacier_emit_suggestion() {
    if [[ -n "$ZSH_AUTOSUGGEST_SUGGESTION" ]]; then
        if [[ "${(L)ZSH_AUTOSUGGEST_SUGGESTION}" == "${(L)BUFFER}"* ]]; then
            local sug="${ZSH_AUTOSUGGEST_SUGGESTION:${#BUFFER}}"
            printf '\033]684;%s\033\\' "$sug"
        else
            printf '\033]684;\033\\'
        fi
        return
    fi
    # Fallback when zsh-autosuggestions is not installed
    local cmd="$BUFFER"
    if [[ -z "$cmd" ]]; then
        printf '\033]684;\033\\'
        return
    fi

    # Detect file/directory commands — for these, prioritize completions over history
    local file_cmds=(cd ls ll la cat touch mkdir rmdir rm cp mv open code vim vi nano less more head tail grep find chmod chown diff scp rsync tar zip unzip docker kubectl)
    local cmd_first_word="${cmd%% *}"
    local is_file_cmd=false
    if [[ " ${file_cmds[*]} " == *" $cmd_first_word "* ]]; then
        is_file_cmd=true
    fi

    # For file commands: Priority 1 = File/directory completion via glob
    if [[ "$is_file_cmd" == true ]]; then
        local last_word="${cmd##* }"
        if [[ -n "$last_word" ]]; then
            local -a files
            local glob_prefix="${last_word//\*/\\*}"
            glob_prefix="${glob_prefix//\?/\\?}"
            glob_prefix="${glob_prefix//\[/\\[}"
            files=(${glob_prefix}*(N))
            if (( ${#files} > 0 )); then
                local comp="${files[1]}"
                if [[ "${(L)comp}" == "${(L)last_word}"* ]]; then
                    local sug="${comp:${#last_word}}"
                    if [[ -n "$sug" ]]; then
                        printf '\033]684;%s\033\\' "$sug"
                        return
                    fi
                fi
            fi
        fi
    fi

    # Priority 1 (non-file) / Priority 2 (file): History match
    local hist=$(fc -l -n -r 1 2>/dev/null | grep -F -i "$cmd" | head -n1)
    if [[ -z "$hist" && -n "${GLACIER_SEED_FILE:-}" && -f "$GLACIER_SEED_FILE" ]]; then
        hist=$(grep -F -i "$cmd" "$GLACIER_SEED_FILE" | head -n1)
    fi
    if [[ -n "$hist" && "$hist" != "$cmd" ]]; then
        if [[ "${(L)hist}" == "${(L)cmd}"* ]]; then
            local sug="${hist:${#cmd}}"
            if [[ -n "$sug" ]]; then
                printf '\033]684;%s\033\\' "$sug"
                return
            fi
        fi
    fi

    # Priority 2 (non-file) / Fallback (file): Completion match (commands and files)
    if [[ "$is_file_cmd" != true ]]; then
        local -a matches
        matches=(${(M)${(k)commands}:#(#i)${cmd}*})
        if (( ${#matches} == 0 )); then
            matches=(${(M)${(k)builtins}:#(#i)${cmd}*})
        fi
        if (( ${#matches} > 0 )); then
            local comp="${matches[1]}"
            local last_word="${cmd##* }"
            if [[ -n "$last_word" && "${(L)comp}" == "${(L)last_word}"* ]]; then
                local sug="${comp:${#last_word}}"
                if [[ -n "$sug" ]]; then
                    printf '\033]684;%s\033\\' "$sug"
                    return
                fi
            fi
        fi
    fi
    printf '\033]684;\033\\'
}

# Fallback widgets when zsh-autosuggestions is not available
# Wrap in zle-line-init so zle is guaranteed to be ready
__glacier_setup_inline_suggest() {
    [[ -o zle ]] || return
    # Only run once
    [[ -n "${__GLACIER_SUGGEST_SETUP:-}" ]] && return
    __GLACIER_SUGGEST_SETUP=1

    __glacier_suggest_widget() {
        LBUFFER="${LBUFFER}${KEYS}"
        __glacier_emit_suggestion
    }
    zle -N __glacier_suggest_widget >/dev/null 2>&1 || return

    __glacier_suggest_backspace() {
        LBUFFER="${LBUFFER%?}"
        __glacier_emit_suggestion
    }
    zle -N __glacier_suggest_backspace >/dev/null 2>&1 || return

    # Bind keys — suppress every possible error
    for c in a b c d e f g h i j k l m n o p q r s t u v w x y z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 0 1 2 3 4 5 6 7 8 9; do
        bindkey "$c" __glacier_suggest_widget >/dev/null 2>&1 || true
    done
    bindkey " " __glacier_suggest_widget >/dev/null 2>&1 || true
    bindkey "-" __glacier_suggest_widget >/dev/null 2>&1 || true
    bindkey "_" __glacier_suggest_widget >/dev/null 2>&1 || true
    bindkey "." __glacier_suggest_widget >/dev/null 2>&1 || true
    bindkey "/" __glacier_suggest_widget >/dev/null 2>&1 || true
    bindkey "^?" __glacier_suggest_backspace >/dev/null 2>&1 || true
    bindkey "^H" __glacier_suggest_backspace >/dev/null 2>&1 || true
}

# Hook into zsh-autosuggestions if available
if typeset -f _zsh_autosuggest_fetch >/dev/null 2>&1; then
    ZSH_AUTOSUGGEST_STRATEGY=(history completion)
    ZSH_AUTOSUGGEST_POST_WIDGET_HOOKS+=(__glacier_emit_suggestion)
    zle-line-init() { _zsh_autosuggest_start; }
    zle -N zle-line-init
else
    # Defer setup to first prompt so zle is fully initialized
    precmd_functions+=(__glacier_setup_inline_suggest)
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

# Seed history with common commands if not already present
__glacier_seed_history() {
    local marker='## Glacier seed history'
    [[ -n "$HISTFILE" ]] || return
    if [[ ! -f "$HISTFILE" ]] || ! grep -qF "$marker" "$HISTFILE" 2>/dev/null; then
        {
            echo "$marker"
            cat "$GLACIER_SEED_FILE"
        } >> "$HISTFILE"
        history -r "$HISTFILE" 2>/dev/null || true
    fi
}
__glacier_seed_history

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

# Inline autocomplete suggestion via OSC 684 (Bash fallback)
__glacier_suggest_bash() {
    local cmd="$READLINE_LINE"
    if [[ -z "$cmd" ]]; then
        printf '\033]684;\033\\'
        return
    fi

    # Detect file/directory commands — for these, prioritize completions over history
    local file_cmds="cd ls ll la cat touch mkdir rmdir rm cp mv open code vim vi nano less more head tail grep find chmod chown diff scp rsync tar zip unzip docker kubectl"
    local cmd_first_word="${cmd%% *}"
    local is_file_cmd=false
    if [[ " $file_cmds " == *" $cmd_first_word "* ]]; then
        is_file_cmd=true
    fi

    # For file commands: Priority 1 = Completion match (files/directories)
    if [[ "$is_file_cmd" == true ]]; then
        local last_word="${cmd##* }"
        local comp=$(compgen -o bashdefault -o default -o filenames -o nospace -A file -- "$last_word" 2>/dev/null | head -n1)
        if [[ -n "$comp" && "${comp,,}" == "${last_word,,}"* ]]; then
            local sug="${comp:${#last_word}}"
            if [[ -n "$sug" ]]; then
                printf '\033]684;%s\033\\' "$sug"
                return
            fi
        fi
    fi

    # Priority 1 (non-file) / Priority 2 (file): History match
    local hist=$(grep -F -i "$cmd" "$HISTFILE" 2>/dev/null | tail -n1)
    # Seed fallback — common commands shipped with Glacier
    if [[ -z "$hist" && -n "${GLACIER_SEED_FILE:-}" && -f "$GLACIER_SEED_FILE" ]]; then
        hist=$(grep -F -i "$cmd" "$GLACIER_SEED_FILE" | head -n1)
    fi
    if [[ -n "$hist" && "$hist" != "$cmd" ]]; then
        if [[ "${hist,,}" == "${cmd,,}"* ]]; then
            local sug="${hist:${#cmd}}"
            if [[ -n "$sug" ]]; then
                printf '\033]684;%s\033\\' "$sug"
                return
            fi
        fi
    fi

    # Priority 2 (non-file) / Fallback (file): Completion match
    if [[ "$is_file_cmd" != true ]]; then
        local comp=$(compgen -c -- "$cmd" 2>/dev/null | head -n1)
        if [[ -z "$comp" ]]; then
            comp=$(compgen -o bashdefault -o default -o filenames -o nospace -A file -- "$cmd" 2>/dev/null | head -n1)
        fi
        if [[ -n "$comp" ]]; then
            local last_word="${cmd##* }"
            if [[ -n "$last_word" && "${comp,,}" == "${last_word,,}"* ]]; then
                local sug="${comp:${#last_word}}"
                if [[ -n "$sug" ]]; then
                    printf '\033]684;%s\033\\' "$sug"
                    return
                fi
            fi
        fi
    fi
    printf '\033]684;\033\\'
}

__glacier_typed_bash() {
    local key="$1"
    READLINE_LINE="${READLINE_LINE:0:$READLINE_POINT}${key}${READLINE_LINE:$READLINE_POINT}"
    READLINE_POINT=$((READLINE_POINT + 1))
    __glacier_suggest_bash
}

__glacier_backspace_bash() {
    if (( READLINE_POINT > 0 )); then
        READLINE_LINE="${READLINE_LINE:0:$((READLINE_POINT-1))}${READLINE_LINE:$READLINE_POINT}"
        READLINE_POINT=$((READLINE_POINT - 1))
    fi
    __glacier_suggest_bash
}

# Bind common typing keys to our inline suggest widget (Bash 4.0+ only)
if [[ ${BASH_VERSINFO[0]} -ge 4 ]]; then
    for c in {a..z} {A..Z} {0..9}; do
        bind -x "\"$c\": __glacier_typed_bash"
    done
    bind -x '" ": __glacier_typed_bash'
    bind -x '"-": __glacier_typed_bash'
    bind -x '"_": __glacier_typed_bash'
    bind -x '".": __glacier_typed_bash'
    bind -x '"/": __glacier_typed_bash'
    bind -x '"\C-h": __glacier_backspace_bash'
    bind -x '"\C-?": __glacier_backspace_bash'
fi
"#;

pub fn write_integration_scripts() -> anyhow::Result<PathBuf> {
    let base = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("~/.config"))
        .join("glacier")
        .join("integration");

    fs::create_dir_all(&base)?;
    fs::create_dir_all(base.join("zsh"))?;
    fs::create_dir_all(base.join("bash"))?;

    fs::write(base.join("glacier.fish"), FISH_INTEGRATION)?;
    fs::write(base.join("glacier.bash"), BASH_INTEGRATION)?;
    fs::write(base.join("commands.txt"), SEED_HISTORY)?;

    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("~"));

    // Zsh: .zshrc that sources the real startup files then appends integration
    // ZDOTDIR is redirected to our wrapper, so zsh skips the user's
    // ~/.zshenv and ~/.zprofile. We source them explicitly so tools like
    // rustup/cargo (which add to PATH in ~/.zshenv) are available.
    let zshrc_content = format!(
        r#"# Glacier Zsh integration wrapper
# Source user's startup files first (ZDOTDIR skips them)
if [[ -f "{home}/.zshenv"  ]]; then source "{home}/.zshenv";  fi
if [[ -f "{home}/.zprofile" ]]; then source "{home}/.zprofile"; fi
if [[ -f "{home}/.zshrc"   ]]; then source "{home}/.zshrc";   fi
autoload -U add-zsh-hook
{integration}
"#,
        home = home.display(),
        integration = ZSH_INTEGRATION,
    );
    fs::write(base.join("zsh").join(".zshrc"), zshrc_content)?;

    // Bash: .bashrc that sources the real one then appends integration
    let bashrc_content = format!(
        r#"# Glacier Bash integration wrapper
# Source user's real .bashrc first
if [[ -f "{home}/.bashrc" ]]; then
  source "{home}/.bashrc"
fi
{integration}
"#,
        home = home.display(),
        integration = BASH_INTEGRATION,
    );
    fs::write(base.join("bash").join(".bashrc"), bashrc_content)?;

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
    cmd.env("GLACIER_SEED_FILE", base.join("commands.txt").to_string_lossy().as_ref());

    match shell_kind {
        ShellKind::Fish => {
            let script = base.join("glacier.fish");
            cmd.args(["--login", "--init-command", &format!("source {}", script.display())]);
        }
        ShellKind::Zsh => {
            cmd.env("ZDOTDIR", base.join("zsh").to_string_lossy().as_ref());
            cmd.args(["-l"]);
        }
        ShellKind::Bash => {
            let bashrc = base.join("bash").join(".bashrc");
            cmd.args(["-l", "-i", "--rcfile", &bashrc.to_string_lossy()]);
        }
        ShellKind::Unknown(_) => {}
    }

    cmd
}

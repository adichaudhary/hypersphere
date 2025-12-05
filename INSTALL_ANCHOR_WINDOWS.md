# Installing Anchor on Windows

## Step 1: Install Rust

1. Download and run the Rust installer:
   - Visit: https://rustup.rs/
   - Or run in PowerShell:
   ```powershell
   Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
   .\rustup-init.exe
   ```

2. Follow the installation prompts (press Enter to accept defaults)

3. Restart your PowerShell/terminal after installation

4. Verify installation:
   ```powershell
   rustc --version
   cargo --version
   ```

## Step 2: Install Anchor

Once Rust is installed, install Anchor:

```powershell
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

Then install the latest Anchor version:

```powershell
avm install latest
avm use latest
```

Verify installation:
```powershell
anchor --version
```

## Step 3: Install Solana CLI (if not already installed)

```powershell
# Download Solana installer
Invoke-WebRequest -Uri https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe -OutFile solana-install-init.exe
.\solana-install-init.exe
```

After installation, restart PowerShell and verify:
```powershell
solana --version
```

## Alternative: Use WSL (Windows Subsystem for Linux)

If you prefer a Linux-like environment:

1. Install WSL:
   ```powershell
   wsl --install
   ```

2. Restart your computer

3. Open Ubuntu (or your WSL distro) and follow Linux installation instructions:
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Install Anchor
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   
   # Install Solana CLI
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

## Troubleshooting

- If `avm` command is not found after installation, you may need to add Cargo's bin directory to your PATH:
  - Usually: `C:\Users\YourUsername\.cargo\bin`
  - Add it to your system PATH environment variable

- Restart PowerShell after adding to PATH


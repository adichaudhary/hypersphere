#!/usr/bin/env powershell
# One-shot GitHub push for Tap-to-Pay deployment
# Usage: .\deploy-to-github.ps1 <github-username> <github-token> <repo-name>

param(
  [string]$GitHubUser = "your-github-username",
  [string]$GitHubToken = "your-personal-access-token",
  [string]$RepoName = "tap-to-pay"
)

Write-Host "🚀 Deploying Tap-to-Pay to GitHub..." -ForegroundColor Green

# Initialize git if needed
if (!(Test-Path .git)) {
  Write-Host "Initializing git repo..." -ForegroundColor Yellow
  git init
  git config user.email "dev@taptopay.app"
  git config user.name "Tap-to-Pay Deployer"
}

# Add all files
Write-Host "Staging files..." -ForegroundColor Yellow
git add -A

# Commit
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m "Deploy: Tap-to-Pay backend + frontend + Android app"

# Create remote and push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
$RepoUrl = "https://${GitHubUser}:${GitHubToken}@github.com/${GitHubUser}/${RepoName}.git"
git remote add origin $RepoUrl 2>$null
git branch -M main
git push -u origin main

Write-Host "✅ Pushed to GitHub: https://github.com/${GitHubUser}/${RepoName}" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://railway.app → Create project → Connect repo"
Write-Host "2. Go to https://vercel.com/new → Import repo"
Write-Host "3. Set env vars as per DEPLOY.md"
Write-Host ""

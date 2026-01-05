#!/bin/bash

# SILENT KILLER Installation Script
# Ambient Intelligence for Productivity

set -e

echo "🧠 SILENT KILLER Installation"
echo "============================"
echo

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8+ required. Found: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

node_version=$(node --version)
echo "✅ Node.js version: $node_version"

# Create virtual environment for backend
echo "📦 Setting up Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
echo "📦 Installing backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# Install agent dependencies
echo "📦 Installing agent dependencies..."
pip install -r agent/requirements.txt

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create configuration file
echo "⚙️ Creating configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Configuration file created (.env)"
    echo "   Please edit .env with your settings"
else
    echo "ℹ️  Configuration file already exists"
fi

# Create data directory
mkdir -p data
echo "✅ Data directory created"

# Set up permissions (for desktop agent)
echo "🔒 Setting up permissions..."
chmod +x agent/*.py
chmod +x install.sh
chmod +x run.sh

echo
echo "🎉 Installation complete!"
echo
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the backend: ./run.sh backend"
echo "3. Start the frontend: ./run.sh frontend"
echo "4. Run the agent: ./run.sh agent"
echo
echo "📚 For more information, see:"
echo "   - README.md"
echo "   - agent/README.md"
echo "   - frontend/README.md"
echo
echo "🚀 Enjoy your ambient intelligence!"

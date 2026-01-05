#!/bin/bash

# SILENT KILLER Run Script
# Ambient Intelligence for Productivity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if backend is running
check_backend() {
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    print_status "Starting SILENT KILLER backend..."
    
    # Activate virtual environment
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    else
        print_error "Virtual environment not found. Please run ./install.sh first."
        exit 1
    fi
    
    # Check if backend is already running
    if check_backend; then
        print_warning "Backend is already running on port 8000"
        return 0
    fi
    
    # Start backend
    cd backend
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    for i in {1..30}; do
        if check_backend; then
            print_success "Backend started successfully (PID: $BACKEND_PID)"
            echo $BACKEND_PID > .backend_pid
            break
        fi
        sleep 1
    done
    
    if ! check_backend; then
        print_error "Backend failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    print_status "Starting SILENT KILLER frontend..."
    
    # Check if backend is running
    if ! check_backend; then
        print_warning "Backend is not running. Starting it first..."
        start_backend
    fi
    
    # Start frontend
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Frontend started successfully (PID: $FRONTEND_PID)"
    echo $FRONTEND_PID > .frontend_pid
}

# Function to start agent
start_agent() {
    print_status "Starting SILENT KILLER agent..."
    
    # Check if backend is running
    if ! check_backend; then
        print_warning "Backend is not running. Starting it first..."
        start_backend
    fi
    
    # Activate virtual environment
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    else
        print_error "Virtual environment not found. Please run ./install.sh first."
        exit 1
    fi
    
    # Start agent TUI
    cd agent
    python tui.py
    cd ..
}

# Function to start desktop agent
start_desktop_agent() {
    print_status "Starting SILENT KILLER desktop agent..."
    
    # Check if backend is running
    if ! check_backend; then
        print_warning "Backend is not running. Starting it first..."
        start_backend
    fi
    
    # Activate virtual environment
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    else
        print_error "Virtual environment not found. Please run ./install.sh first."
        exit 1
    fi
    
    # Start desktop agent
    cd agent
    python desktop_agent.py
    cd ..
}

# Function to stop services
stop_services() {
    print_status "Stopping SILENT KILLER services..."
    
    # Stop backend
    if [ -f .backend_pid ]; then
        BACKEND_PID=$(cat .backend_pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_success "Backend stopped (PID: $BACKEND_PID)"
        fi
        rm .backend_pid
    fi
    
    # Stop frontend
    if [ -f .frontend_pid ]; then
        FRONTEND_PID=$(cat .frontend_pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_success "Frontend stopped (PID: $FRONTEND_PID)"
        fi
        rm .frontend_pid
    fi
}

# Function to show status
show_status() {
    print_status "SILENT KILLER Status"
    echo "======================="
    
    # Backend status
    if check_backend; then
        print_success "Backend: Running on http://localhost:8000"
    else
        print_warning "Backend: Not running"
    fi
    
    # Frontend status
    if [ -f .frontend_pid ]; then
        FRONTEND_PID=$(cat .frontend_pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_success "Frontend: Running (PID: $FRONTEND_PID)"
        else
            print_warning "Frontend: PID file exists but process not running"
        fi
    else
        print_warning "Frontend: Not running"
    fi
    
    # Virtual environment
    if [ -d ".venv" ]; then
        print_success "Virtual environment: Found"
    else
        print_warning "Virtual environment: Not found"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running SILENT KILLER tests..."
    
    # Activate virtual environment
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    else
        print_error "Virtual environment not found. Please run ./install.sh first."
        exit 1
    fi
    
    # Run backend tests
    print_status "Running backend tests..."
    python -m pytest tests/ -v
    
    print_success "All tests completed!"
}

# Main script logic
case "$1" in
    "backend")
        start_backend
        ;;
    "frontend")
        start_frontend
        ;;
    "agent")
        start_agent
        ;;
    "desktop")
        start_desktop_agent
        ;;
    "all")
        start_backend
        start_frontend
        print_status "All services started!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend: http://localhost:8000"
        print_status "Press Ctrl+C to stop all services"
        wait
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "test")
        run_tests
        ;;
    "install")
        ./install.sh
        ;;
    *)
        echo "🧠 SILENT KILLER - Ambient Intelligence for Productivity"
        echo
        echo "Usage: $0 {backend|frontend|agent|desktop|all|stop|status|test|install}"
        echo
        echo "Commands:"
        echo "  backend   - Start the backend API server"
        echo "  frontend  - Start the frontend web interface"
        echo "  agent     - Start the terminal user interface"
        echo "  desktop   - Start the desktop monitoring agent"
        echo "  all       - Start backend and frontend"
        echo "  stop      - Stop all running services"
        echo "  status    - Show service status"
        echo "  test      - Run test suite"
        echo "  install   - Run installation script"
        echo
        echo "Examples:"
        echo "  $0 all      # Start everything"
        echo "  $0 backend  # Start only backend"
        echo "  $0 agent    # Start TUI agent"
        echo "  $0 stop     # Stop all services"
        ;;
esac

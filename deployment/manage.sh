#!/bin/bash

# Stripe View - Deployment Manager
# Optimized for Portainer deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR"
DATA_DIR="$DEPLOYMENT_DIR/data"
IMAGE_NAME="stripe-view"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to print header
print_header() {
    echo ""
    print_color "$BLUE" "═══════════════════════════════════════════════════════"
    print_color "$BLUE" "  🐳 Stripe View - Deployment Manager"
    print_color "$BLUE" "═══════════════════════════════════════════════════════"
    echo ""
}

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_color "$RED" "❌ Docker is not installed or not in PATH"
        exit 1
    fi
}

# Function to setup initial configuration
setup_config() {
    print_header
    print_color "$YELLOW" "📋 Initial Setup"
    echo ""
    
    # Create data directory
    if [ ! -d "$DATA_DIR" ]; then
        print_color "$BLUE" "Creating data directory..."
        mkdir -p "$DATA_DIR"
        print_color "$GREEN" "✅ Created $DATA_DIR"
    else
        print_color "$GREEN" "✅ Data directory exists"
    fi
    
    # Setup .env file
    if [ ! -f "$DEPLOYMENT_DIR/.env" ]; then
        print_color "$BLUE" "Setting up authentication..."
        echo ""
        read -p "Enter username for Basic Auth (default: admin): " username
        username=${username:-admin}
        
        while true; do
            read -sp "Enter password for Basic Auth: " password
            echo ""
            if [ -z "$password" ]; then
                print_color "$RED" "Password cannot be empty"
                continue
            fi
            read -sp "Confirm password: " password2
            echo ""
            if [ "$password" = "$password2" ]; then
                break
            else
                print_color "$RED" "Passwords don't match, try again"
            fi
        done
        
        cat > "$DEPLOYMENT_DIR/.env" << EOF
# HTTP Basic Authentication
BASIC_AUTH_USER=$username
BASIC_AUTH_PASS=$password

# Server Port
PORT=3000
EOF
        print_color "$GREEN" "✅ Created .env file"
    else
        print_color "$GREEN" "✅ .env file exists"
    fi
    
    # Setup config.json
    if [ ! -f "$DATA_DIR/config.json" ]; then
        echo ""
        print_color "$YELLOW" "⚠️  config.json not found in data directory"
        echo ""
        echo "You need to create $DATA_DIR/config.json with your Stripe API keys."
        echo ""
        echo "Example structure:"
        cat << 'EOF'
{
  "projects": [
    {
      "id": "my-project",
      "name": "My Business",
      "website": "https://example.com",
      "stripe": {
        "apiKey": "rk_live_...",
        "enabled": true
      }
    }
  ],
  "pollingIntervalSeconds": 60
}
EOF
        echo ""
        read -p "Press Enter once you've created the config.json file..."
        
        if [ ! -f "$DATA_DIR/config.json" ]; then
            print_color "$RED" "❌ config.json still not found. Please create it and run setup again."
            exit 1
        fi
    else
        print_color "$GREEN" "✅ config.json exists"
    fi
    
    echo ""
    print_color "$GREEN" "✅ Setup complete!"
    echo ""
    print_color "$BLUE" "Next steps for Portainer deployment:"
    echo "1. Build the Docker image (option 2 in main menu)"
    echo "2. In Portainer: Stacks → Add Stack → Upload"
    echo "3. Upload docker-compose.yml from: $DEPLOYMENT_DIR/docker-compose.yml"
    echo "4. Upload .env file or manually set environment variables"
    echo "5. Update the volume path to match your server"
    echo "6. Deploy the stack"
    echo ""
}

# Function to build Docker image
build_image() {
    print_header
    print_color "$YELLOW" "🔨 Building Docker Image"
    echo ""
    
    print_color "$BLUE" "Building $IMAGE_NAME:$IMAGE_TAG..."
    echo ""
    
    cd "$DEPLOYMENT_DIR"
    docker build -t "$IMAGE_NAME:$IMAGE_TAG" -f Dockerfile "$PROJECT_ROOT"
    
    if [ $? -eq 0 ]; then
        echo ""
        print_color "$GREEN" "✅ Image built successfully: $IMAGE_NAME:$IMAGE_TAG"
        echo ""
        print_color "$BLUE" "Image details:"
        docker images "$IMAGE_NAME:$IMAGE_TAG"
        echo ""
        print_color "$YELLOW" "💡 For Portainer:"
        echo "   You can now reference this image in your stack as: $IMAGE_NAME:$IMAGE_TAG"
        echo "   Or push it to a registry for remote deployment"
    else
        print_color "$RED" "❌ Build failed"
        exit 1
    fi
}

# Function to push image to registry
push_image() {
    print_header
    print_color "$YELLOW" "📤 Push Image to Registry"
    echo ""
    
    print_color "$BLUE" "Current image: $IMAGE_NAME:$IMAGE_TAG"
    echo ""
    read -p "Enter registry URL (e.g., docker.io/username or registry.example.com): " registry
    
    if [ -z "$registry" ]; then
        print_color "$RED" "❌ Registry URL required"
        return
    fi
    
    FULL_IMAGE="$registry/$IMAGE_NAME:$IMAGE_TAG"
    
    print_color "$BLUE" "Tagging image as: $FULL_IMAGE"
    docker tag "$IMAGE_NAME:$IMAGE_TAG" "$FULL_IMAGE"
    
    print_color "$BLUE" "Pushing to registry..."
    docker push "$FULL_IMAGE"
    
    if [ $? -eq 0 ]; then
        echo ""
        print_color "$GREEN" "✅ Image pushed successfully"
        echo ""
        print_color "$YELLOW" "💡 Update your docker-compose.yml image to: $FULL_IMAGE"
    else
        print_color "$RED" "❌ Push failed"
    fi
}

# Function to pull latest code
pull_latest() {
    print_header
    print_color "$YELLOW" "📥 Pulling Latest Code"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_color "$RED" "❌ Git is not installed"
        exit 1
    fi
    
    # Check if we're in a git repo
    if [ ! -d ".git" ]; then
        print_color "$RED" "❌ Not a git repository"
        exit 1
    fi
    
    print_color "$BLUE" "Current branch: $(git branch --show-current)"
    echo ""
    
    # Fetch latest
    print_color "$BLUE" "Fetching latest changes..."
    git fetch origin
    
    # Check if there are updates
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    
    if [ $LOCAL = $REMOTE ]; then
        print_color "$GREEN" "✅ Already up to date"
    else
        print_color "$BLUE" "Pulling changes..."
        git pull
        
        if [ $? -eq 0 ]; then
            print_color "$GREEN" "✅ Code updated successfully"
            echo ""
            print_color "$YELLOW" "💡 Don't forget to rebuild the Docker image (option 2)"
        else
            print_color "$RED" "❌ Pull failed"
            exit 1
        fi
    fi
}

# Function to view logs (local only)
view_logs() {
    print_header
    print_color "$YELLOW" "📋 View Container Logs"
    echo ""
    
    if ! docker ps -a --format '{{.Names}}' | grep -q "stripe-view"; then
        print_color "$RED" "❌ Container 'stripe-view' not found"
        echo ""
        print_color "$BLUE" "💡 If deployed via Portainer, use Portainer's log viewer instead"
        return
    fi
    
    print_color "$BLUE" "Showing last 50 lines (Ctrl+C to exit)..."
    echo ""
    docker logs -f --tail 50 stripe-view
}

# Function to restart container
restart_container() {
    print_header
    print_color "$YELLOW" "🔄 Restart Container"
    echo ""
    
    CONTAINER_NAME="stripe-view"
    
    if ! docker ps -a --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
        print_color "$RED" "❌ Container '$CONTAINER_NAME' not found"
        echo ""
        print_color "$BLUE" "💡 Make sure the container is deployed via docker-compose or Portainer"
        return
    fi
    
    print_color "$BLUE" "Recreating container with new image..."
    docker stop "$CONTAINER_NAME"
    docker rm "$CONTAINER_NAME"
    
    print_color "$BLUE" "Starting container..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -p 3000:3000 \
        --env-file "$DEPLOYMENT_DIR/.env" \
        -v "$DATA_DIR:/config" \
        "$IMAGE_NAME:$IMAGE_TAG"
    
    if [ $? -eq 0 ]; then
        echo ""
        print_color "$GREEN" "✅ Container restarted successfully!"
        echo ""
        print_color "$BLUE" "Container is now running with the latest image"
        docker ps --filter "name=$CONTAINER_NAME"
    else
        print_color "$RED" "❌ Failed to restart container"
        echo ""
        print_color "$YELLOW" "💡 If using Portainer, restart the stack there instead"
    fi
}

# Function to do full update (pull + build + restart)
full_update() {
    print_header
    print_color "$YELLOW" "🚀 Full Update & Redeploy"
    echo ""
    
    print_color "$BLUE" "This will:"
    echo "  1. Pull latest code from Git"
    echo "  2. Build new Docker image"
    echo "  3. Restart container with new image"
    echo ""
    
    read -p "Continue? (Y/n): " confirm
    if [[ $confirm =~ ^[Nn]$ ]]; then
        print_color "$YELLOW" "Cancelled"
        return
    fi
    
    # Step 1: Pull latest code
    print_color "$BLUE" "━━━ Step 1/3: Pulling latest code ━━━"
    cd "$PROJECT_ROOT"
    git fetch origin
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    
    if [ $LOCAL = $REMOTE ]; then
        print_color "$GREEN" "✅ Already up to date"
    else
        print_color "$BLUE" "Pulling changes..."
        git pull
        if [ $? -ne 0 ]; then
            print_color "$RED" "❌ Git pull failed"
            return
        fi
        print_color "$GREEN" "✅ Code updated"
    fi
    echo ""
    
    # Step 2: Build image
    print_color "$BLUE" "━━━ Step 2/3: Building Docker image ━━━"
    cd "$DEPLOYMENT_DIR"
    docker build -t "$IMAGE_NAME:$IMAGE_TAG" -f Dockerfile "$PROJECT_ROOT"
    
    if [ $? -ne 0 ]; then
        print_color "$RED" "❌ Build failed"
        return
    fi
    print_color "$GREEN" "✅ Image built successfully"
    echo ""
    
    # Step 3: Restart container
    print_color "$BLUE" "━━━ Step 3/3: Restarting container ━━━"
    CONTAINER_NAME="stripe-view"
    
    if docker ps -a --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
        print_color "$BLUE" "Stopping and removing old container..."
        docker stop "$CONTAINER_NAME" 2>/dev/null
        docker rm "$CONTAINER_NAME" 2>/dev/null
        
        print_color "$BLUE" "Starting container with new image..."
        docker run -d \
            --name "$CONTAINER_NAME" \
            --restart unless-stopped \
            -p 3000:3000 \
            --env-file "$DEPLOYMENT_DIR/.env" \
            -v "$DATA_DIR:/config" \
            "$IMAGE_NAME:$IMAGE_TAG"
        
        if [ $? -eq 0 ]; then
            echo ""
            print_color "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            print_color "$GREEN" "✅ Update complete! Container is running with latest code"
            print_color "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            docker ps --filter "name=$CONTAINER_NAME"
        else
            print_color "$RED" "❌ Failed to start container"
        fi
    else
        echo ""
        print_color "$YELLOW" "⚠️  Container not found locally"
        print_color "$BLUE" "💡 If using Portainer stack, restart it there:"
        echo "   1. Go to Stacks → stripe-view"
        echo "   2. Click 'Stop' then 'Start'"
        echo "   Or use 'Recreate' button in Containers view"
    fi
}

# Function to cleanup old images
cleanup_images() {
    print_header
    print_color "$YELLOW" "🧹 Cleanup Old Images"
    echo ""
    
    print_color "$BLUE" "Current images:"
    docker images "$IMAGE_NAME"
    echo ""
    
    read -p "Remove untagged/dangling images? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        print_color "$BLUE" "Cleaning up..."
        docker image prune -f
        print_color "$GREEN" "✅ Cleanup complete"
    else
        print_color "$YELLOW" "Cancelled"
    fi
}

# Function to show deployment info
show_info() {
    print_header
    print_color "$YELLOW" "ℹ️  Deployment Information"
    echo ""
    
    print_color "$BLUE" "📁 Directories:"
    echo "   Deployment: $DEPLOYMENT_DIR"
    echo "   Data:       $DATA_DIR"
    echo "   Project:    $PROJECT_ROOT"
    echo ""
    
    print_color "$BLUE" "🐳 Docker Image:"
    if docker images "$IMAGE_NAME:$IMAGE_TAG" | grep -q "$IMAGE_NAME"; then
        docker images "$IMAGE_NAME:$IMAGE_TAG" | grep -v REPOSITORY
        echo ""
    else
        echo "   Not built yet"
        echo ""
    fi
    
    print_color "$BLUE" "📋 Configuration:"
    if [ -f "$DEPLOYMENT_DIR/.env" ]; then
        echo "   ✅ .env file exists"
    else
        echo "   ❌ .env file missing"
    fi
    
    if [ -f "$DATA_DIR/config.json" ]; then
        echo "   ✅ config.json exists"
        NUM_PROJECTS=$(grep -o '"id"' "$DATA_DIR/config.json" | wc -l | tr -d ' ')
        echo "   📊 Projects configured: $NUM_PROJECTS"
    else
        echo "   ❌ config.json missing"
    fi
    echo ""
    
    print_color "$BLUE" "🌐 Portainer Deployment:"
    echo "   Stack name:  stripe-view"
    echo "   Compose file: $DEPLOYMENT_DIR/docker-compose.yml"
    echo "   Port:        3000"
    echo ""
}

# Function to show Portainer deployment instructions
show_portainer_help() {
    print_header
    print_color "$YELLOW" "📄 Portainer Deployment Instructions"
    echo ""
    
    print_color "$BLUE" "Your docker-compose.yml is ready at:"
    echo "   $DEPLOYMENT_DIR/docker-compose.yml"
    echo ""
    
    print_color "$YELLOW" "⚠️  Before uploading to Portainer:"
    echo ""
    echo "Edit docker-compose.yml and update the volume path:"
    print_color "$BLUE" "   FROM: ./data:/config"
    print_color "$GREEN" "   TO:   $DATA_DIR:/config"
    echo ""
    print_color "$BLUE" "(Use the absolute path on your server, not './data')"
    echo ""
    
    print_color "$YELLOW" "💡 Steps in Portainer:"
    echo "   1. Go to Stacks → Add Stack"
    echo "   2. Name it 'stripe-view'"
    echo "   3. Upload: $DEPLOYMENT_DIR/docker-compose.yml"
    echo "   4. Upload: $DEPLOYMENT_DIR/.env (or set env vars manually)"
    echo "   5. Click 'Deploy the stack'"
    echo ""
    
    print_color "$GREEN" "Files ready for Portainer:"
    echo "   📄 docker-compose.yml"
    if [ -f "$DEPLOYMENT_DIR/.env" ]; then
        echo "   ✅ .env"
    else
        echo "   ❌ .env (run initial setup first)"
    fi
    if [ -f "$DATA_DIR/config.json" ]; then
        echo "   ✅ data/config.json"
    else
        echo "   ❌ data/config.json (create this first)"
    fi
    echo ""
}

# Main menu
show_menu() {
    print_header
    print_color "$GREEN" "What would you like to do?"
    echo ""
    echo "  1) Initial setup (first time)"
    echo "  2) Build Docker image"
    echo "  3) Pull latest code from Git"
    echo "  4) 🚀 Full update & redeploy (pull + build + restart)"
    echo "  5) Restart container only"
    echo "  6) Push image to registry (optional)"
    echo "  7) Portainer deployment help"
    echo "  8) View deployment info"
    echo "  9) View container logs"
    echo " 10) Cleanup old images"
    echo " 11) Exit"
    echo ""
}

# Main script
main() {
    check_docker
    
    while true; do
        show_menu
        read -p "Enter your choice (1-11): " choice
        
        case $choice in
            1) setup_config ;;
            2) build_image ;;
            3) pull_latest ;;
            4) full_update ;;
            5) restart_container ;;
            6) push_image ;;
            7) show_portainer_help ;;
            8) show_info ;;
            9) view_logs ;;
            10) cleanup_images ;;
            11)
                print_color "$GREEN" "👋 Goodbye!"
                exit 0
                ;;
            *)
                print_color "$RED" "❌ Invalid choice. Please enter 1-11."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main

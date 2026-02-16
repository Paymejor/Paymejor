#!/bin/bash

# PayMejor Pre-Deployment Verification Script
# Run this before deploying to verify everything is ready

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=================================================="
echo "PayMejor Pre-Deployment Verification"
echo "=================================================="
echo "Timestamp: $(date)"
echo "=================================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check if command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to show warning
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to show info
show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🔍 Running Pre-Deployment Checks..."
echo ""

# 1. Check if we're in the frontend directory
echo "1. Checking directory structure..."
if [ -f "package.json" ] && [ -f "next.config.mjs" ]; then
    check_result "In correct directory (frontend)"
else
    echo -e "${RED}❌ Not in frontend directory${NC}"
    echo "Please run this script from the frontend directory"
    exit 1
fi
echo ""

# 2. Check if dependencies are installed
echo "2. Checking dependencies..."
if [ -d "node_modules" ]; then
    check_result "Dependencies installed"
else
    echo -e "${RED}❌ Dependencies not installed${NC}"
    echo "Run: pnpm install"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Check if .env.local exists
echo "3. Checking environment configuration..."
if [ -f ".env.local" ]; then
    check_result ".env.local file exists"
    
    # Check for required variables
    if grep -q "NEXT_PUBLIC_DEFAULT_NETWORK" .env.local; then
        check_result "NEXT_PUBLIC_DEFAULT_NETWORK is set"
    else
        show_warning "NEXT_PUBLIC_DEFAULT_NETWORK not found in .env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_SEPOLIA_RPC_URL" .env.local; then
        check_result "NEXT_PUBLIC_SEPOLIA_RPC_URL is set"
    else
        show_warning "NEXT_PUBLIC_SEPOLIA_RPC_URL not found in .env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_MAINNET_RPC_URL" .env.local; then
        check_result "NEXT_PUBLIC_MAINNET_RPC_URL is set"
    else
        show_warning "NEXT_PUBLIC_MAINNET_RPC_URL not found in .env.local"
    fi
else
    show_warning ".env.local file not found (OK for Vercel deployment)"
    show_info "Ensure environment variables are set in Vercel dashboard"
fi
echo ""

# 4. Check TypeScript compilation
echo "4. Checking TypeScript..."
if command -v pnpm &> /dev/null; then
    if pnpm tsc --noEmit > /dev/null 2>&1; then
        check_result "TypeScript compilation successful"
    else
        echo -e "${RED}❌ TypeScript compilation failed${NC}"
        echo "Run: pnpm tsc --noEmit"
        echo "Fix TypeScript errors before deploying"
        ERRORS=$((ERRORS + 1))
    fi
else
    show_warning "pnpm not found, skipping TypeScript check"
fi
echo ""

# 5. Check if build succeeds
echo "5. Checking build..."
if command -v pnpm &> /dev/null; then
    show_info "Running production build (this may take a minute)..."
    if pnpm build > /dev/null 2>&1; then
        check_result "Production build successful"
    else
        echo -e "${RED}❌ Production build failed${NC}"
        echo "Run: pnpm build"
        echo "Fix build errors before deploying"
        ERRORS=$((ERRORS + 1))
    fi
else
    show_warning "pnpm not found, skipping build check"
fi
echo ""

# 6. Check for common issues
echo "6. Checking for common issues..."

# Check for console.log statements (warning only)
if grep -r "console\.log" app/ components/ hooks/ lib/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    show_warning "Found console.log statements (consider removing for production)"
else
    check_result "No console.log statements found"
fi

# Check for TODO comments
if grep -r "TODO\|FIXME" app/ components/ hooks/ lib/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    show_warning "Found TODO/FIXME comments"
else
    check_result "No TODO/FIXME comments found"
fi

# Check for hardcoded addresses (basic check)
if grep -r "0x[0-9a-fA-F]\{40,\}" app/ components/ hooks/ lib/ 2>/dev/null | grep -v "node_modules" | grep -v "NEXT_PUBLIC" > /dev/null; then
    show_warning "Found potential hardcoded addresses (verify they're intentional)"
else
    check_result "No hardcoded addresses found"
fi
echo ""

# 7. Check Git status
echo "7. Checking Git status..."
if command -v git &> /dev/null; then
    if [ -d ".git" ]; then
        # Check if there are uncommitted changes
        if git diff-index --quiet HEAD --; then
            check_result "No uncommitted changes"
        else
            show_warning "Uncommitted changes detected"
            show_info "Consider committing changes before deploying"
        fi
        
        # Check current branch
        BRANCH=$(git branch --show-current)
        show_info "Current branch: $BRANCH"
        
        # Check if branch is up to date with remote
        if git fetch origin &> /dev/null; then
            LOCAL=$(git rev-parse @)
            REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
            if [ "$LOCAL" = "$REMOTE" ]; then
                check_result "Branch is up to date with remote"
            elif [ -z "$REMOTE" ]; then
                show_warning "No remote tracking branch"
            else
                show_warning "Branch is not up to date with remote"
                show_info "Consider pulling latest changes"
            fi
        fi
    else
        show_warning "Not a Git repository"
    fi
else
    show_warning "Git not found, skipping Git checks"
fi
echo ""

# 8. Check documentation
echo "8. Checking documentation..."
if [ -f "DEPLOYMENT.md" ]; then
    check_result "DEPLOYMENT.md exists"
else
    show_warning "DEPLOYMENT.md not found"
fi

if [ -f "ENVIRONMENT_SETUP.md" ]; then
    check_result "ENVIRONMENT_SETUP.md exists"
else
    show_warning "ENVIRONMENT_SETUP.md not found"
fi

if [ -f ".env.example" ]; then
    check_result ".env.example exists"
else
    show_warning ".env.example not found"
fi
echo ""

# 9. Check Vercel configuration
echo "9. Checking Vercel configuration..."
if [ -f "vercel.json" ]; then
    check_result "vercel.json exists"
else
    show_warning "vercel.json not found (optional)"
fi
echo ""

# Summary
echo "=================================================="
echo "Pre-Deployment Check Summary"
echo "=================================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure environment variables are set in Vercel"
    echo "2. Deploy: vercel --prod"
    echo "3. Run post-deployment verification"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Warnings are non-critical but should be reviewed."
    echo "You can proceed with deployment if warnings are acceptable."
    echo ""
    echo "Next steps:"
    echo "1. Review warnings above"
    echo "2. Ensure environment variables are set in Vercel"
    echo "3. Deploy: vercel --prod"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Please fix errors before deploying."
    echo "Review the output above for details."
    echo ""
    exit 1
fi

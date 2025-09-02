#!/bin/bash

# GQR Data Fetcher using cURL and Supabase
# Usage: ./fetch_gqr_data.sh

# Configuration - Replace with your actual values
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
API_ENDPOINT="/rest/v1/gqr_entry"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}GQR Data Fetcher - Direct Supabase Access${NC}"
echo "=================================================="

# Check if credentials are set
if [ "$SUPABASE_URL" = "https://your-project.supabase.co" ] || [ "$SUPABASE_ANON_KEY" = "your-anon-key-here" ]; then
    echo -e "${RED}Error: Please update the script with your actual Supabase credentials${NC}"
    echo "Edit this script and set:"
    echo "  SUPABASE_URL=your-actual-supabase-url"
    echo "  SUPABASE_ANON_KEY=your-actual-anon-key"
    exit 1
fi

# Function to fetch data
fetch_gqr_data() {
    local filter_status="$1"
    local limit="$2"
    
    echo -e "${YELLOW}Fetching GQR data...${NC}"
    echo "Filter: ${filter_status:-"All records"}"
    echo "Limit: ${limit:-100}"
    echo ""
    
    # Build the query
    local query_params="select=*,pre_gr_entry(id,vouchernumber,net_wt,ladden_wt,empty_wt,date,purchase_orders(id,vouchernumber,date,rate,podi_rate,quantity,damage_allowed_kgs_ton,cargo,suppliers(id,name),item_master(id,item_name,hsn_code,item_unit))&gqr_status=eq.Closed&order=created_at.desc&limit=${limit}"
    
    # Add filter if specified
    if [ "$filter_status" = "false" ]; then
        query_params="${query_params}&is_tally_posted=eq.false"
    elif [ "$filter_status" = "true" ]; then
        query_params="${query_params}&is_tally_posted=eq.true"
    fi
    
    # Make the request
    local response=$(curl -s -X GET \
        "${SUPABASE_URL}${API_ENDPOINT}?${query_params}" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json")
    
    # Check if request was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Data fetched successfully${NC}"
        echo ""
        
        # Pretty print JSON (requires jq)
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.'
        else
            echo "$response"
        fi
        
        # Save to file
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        local filename="gqr_data_${timestamp}.json"
        echo "$response" > "$filename"
        echo ""
        echo -e "${GREEN}Data saved to: ${filename}${NC}"
        
    else
        echo -e "${RED}✗ Error fetching data${NC}"
        echo "$response"
    fi
}

# Function to update tally posted status
update_tally_status() {
    local gqr_id="$1"
    local status="$2"
    
    if [ -z "$gqr_id" ] || [ -z "$status" ]; then
        echo -e "${RED}Error: GQR ID and status are required${NC}"
        echo "Usage: update_tally_status <gqr_id> <true|false>"
        return 1
    fi
    
    echo -e "${YELLOW}Updating GQR ${gqr_id} tally posted status to ${status}...${NC}"
    
    local response=$(curl -s -X PATCH \
        "${SUPABASE_URL}${API_ENDPOINT}?id=eq.${gqr_id}" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"is_tally_posted\": ${status}, \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Status updated successfully${NC}"
    else
        echo -e "${RED}✗ Error updating status${NC}"
        echo "$response"
    fi
}

# Main menu
while true; do
    echo ""
    echo "Choose an option:"
    echo "1) Fetch all GQR records"
    echo "2) Fetch unposted GQR records (not in Tally)"
    echo "3) Fetch posted GQR records (already in Tally)"
    echo "4) Update tally posted status"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            read -p "Enter record limit (default 100): " limit
            limit=${limit:-100}
            fetch_gqr_data "" "$limit"
            ;;
        2)
            read -p "Enter record limit (default 100): " limit
            limit=${limit:-100}
            fetch_gqr_data "false" "$limit"
            ;;
        3)
            read -p "Enter record limit (default 100): " limit
            limit=${limit:-100}
            fetch_gqr_data "true" "$limit"
            ;;
        4)
            read -p "Enter GQR ID: " gqr_id
            read -p "Enter status (true/false): " status
            update_tally_status "$gqr_id" "$status"
            ;;
        5)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please enter 1-5.${NC}"
            ;;
    esac
done

#!/bin/bash

OUTPUT_FILE="galleries_patch_body.txt"
BASE_DIR="/home/silasfelinus/code/kindrobots"
GALLERIES_DIR="$BASE_DIR/public/images/"

# Initializing/emptying the file with a starting bracket
echo "[" > "$OUTPUT_FILE"

echo "🚀 Engage hyperdrive! Our intergalactic expedition begins!"

# A flag to know if we need to add a comma before the next gallery's data
add_comma=false

# Looping over all directories directly under /public/images/
for gallery_dir in "$GALLERIES_DIR"*/; do
    if [ -d "$gallery_dir" ]; then
        gallery_name=$(basename "$gallery_dir")
        echo "🪐 Exploring Galaxy: $gallery_name"
        
        # Gathering the list of images
        star_list=($(ls "$gallery_dir" | grep -E "\.(jpg|jpeg|png|webp)$"))
        if [ ${#star_list[@]} -gt 0 ]; then
            # If this isn't the first gallery, add a comma
            if $add_comma; then
                echo "," >> "$OUTPUT_FILE"
            fi
            echo "{ \"name\": \"$gallery_name\"," >> "$OUTPUT_FILE"
            imagePaths_string=$(echo "${star_list[@]}" | tr ' ' ', ')
            echo "\"imagePaths\": \"$imagePaths_string\"" >> "$OUTPUT_FILE"
            echo "}" >> "$OUTPUT_FILE"
            add_comma=true
        fi
    fi
done

# Closing the JSON array
echo "]" >> "$OUTPUT_FILE"

echo "🌌 Our journey concludes. Until the next cosmic adventure!"

#!/bin/bash

## Iterates through directories and makes a gallery.json with all image filename contained inside.
# Loop through each directory
for dir in ./*/; do
    # Check if the path is a directory
    if [ -d "${dir}" ]; then
        # Go into the directory
        cd "${dir}"
        # Initialize an array
        imagesArray="["
        # Loop through webp files
        for file in *.webp; do
            # Add to array
            imagesArray+="\"${file%.*}\", "
        done
        # Remove trailing comma and space
        imagesArray=${imagesArray%??}
        imagesArray+="]"
        # Write to Gallery.json
        echo $imagesArray > gallery.json
        # Go back to the main directory
        cd ..
    fi
done

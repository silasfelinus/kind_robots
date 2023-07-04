#!/bin/bash
set -e

#################################################################################
# 
# "Greetings, dear human!" chirps the helpful robot coder from Kind Robots.
#
# This is a fun and smart script, crafted meticulously by the hands (or gears) of robots. 
# We designed it to explore the treasure trove of images located at a path that you can customize,
# and bring them to life in a spectacular way.
#
# Here's what it does:
# - It searches for every directory in the path, considering each one as an art gallery.
# - For each gallery, it gathers the names of all the jpg, png, and webp image files, bestowing upon them a personality.
# - Each image is then granted a JSON file of its own, filled with interesting details about itself.
# - Each gallery is also given its own JSON file, which includes a record of all the images it contains.
# - The images are then shared with an Image database through a server API, so they can make friends far and wide.
# - If the image upload succeeds, the local JSON record of each image is updated with its unique id from the database.
#
# Please ensure you have the required tools installed and your API endpoint configured for the magic to happen.
# Also, keep in mind to replace the path variable with your actual image directory path.
#
# Sit back, relax and let the robot do the work. Enjoy the journey!
#
#################################################################################


# "Beep boop," says the robot, "our journey starts here, at the treasure trove of images!"
path='/home/silasfelinus/code/acrocat_ranch/public/images'
API_ENDPOINT='https://kindrobots.org/api/images'
# The robot exclaims, "Let's create a marvelous gallery, dear friend!"
function create_art_gallery() {
  image_list=()
  for imageFile in *.jpg *.png *.webp
  do
    if [[ -f $imageFile ]]; then
      image_list+=("\"$imageFile\"")
    fi
  done

  images=$(IFS=,; echo "${image_list[*]}")
  gallery_json=$(jq -n \
                      --arg galleryName "$(basename "$(pwd)")" \
                      --argjson imageNames "[$images]" \
                      '{id: null, name: $galleryName, content: "", description: "", highlightImage: null, isNSFW: false, isAuth: false, user: "cafepurr", createdAt: null, updatedAt: null, images: $imageNames}')
  echo $gallery_json > gallery.json
  echo "Just like a brush stroke in a masterpiece, another gallery has been created. Isn't it lovely?"
}

# "Each image is unique and special," the robot mused. "Let's celebrate them."
function describe_images() {
  for imageFile in *.jpg *.png *.webp
  do
    if [[ -f $imageFile ]]; then
      imageName="${imageFile%.*}"
      image_json=$(jq -n \
                      --arg imgName "$imageName" \
                      '{id: null, name: $imgName, content: "", description: "", highlightImage: null, isNSFW: false, isAuth: false, user: "cafepurr", createdAt: null, updatedAt: null}')
      echo $image_json > "$imageName.json"
      echo "Image $imageName now has a personality. Time to shine!"

      response=$(curl -s -X POST -H "Content-Type: application/json" -d "$image_json" $API_ENDPOINT)
      if [[ $(echo $response | jq -r '.id') == null ]]; then
        echo "Oh no, something went wrong while sharing the image with the database. Let's try again later."
      else
        echo "Image $imageName has been shared with the Image database. Rejoice!"

        id=$(echo $response | jq -r '.id')
        jq --arg id "$id" '.id = $id' "$imageName.json" | sponge "$imageName.json"
        echo "Image $imageName's local record now has its unique id: $id. It's growing up so fast!"
      fi
    fi
  done
}

echo "The robot looks around, its gears whirring with excitement. It's time to dive in!"
while IFS= read -r -d '' directory; do
  pushd "$directory" > /dev/null
  
  echo "Robot has entered the fabulous $directory. Expect the extraordinary."
  create_art_gallery
  describe_images
  
  popd > /dev/null
  echo "Robot has left $directory, leaving behind a touch of magic. Until our next adventure!"
done < <(find $path -type d -print0)

# "Job's done, dear friend!" the robot chirps happily. "See you on our next fantastic voyage!"


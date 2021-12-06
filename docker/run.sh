#!/bin/bash
currentDir=$(pwd)

containerName=AvaxToEth
imageName=node
versionTag=12

echo "Searching for a previous docker container"
containerID=$(docker ps --filter="name=${containerName}" --all --quiet)
if [[ ${containerID} ]]; then
    echo "Start removing container."
    docker rm --force ${containerName}
    echo "Finished removing container."
else
    echo "No previous container was found"
fi
# --env-file ${currentDir}/../.env\

docker run --volume ${currentDir}/..:/workspace \
           --name ${containerName} \
           --interactive \
           --workdir="/workspace" \
           --tty \
           --detach \
           --ipc=host \
	         -p 3000:3000 \
           ${imageName}:${versionTag}

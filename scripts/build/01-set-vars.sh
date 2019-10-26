#!/bin/bash
export ROOT_FOLDER="$DIR/../.."
export DIST_FOLDER="$ROOT_FOLDER/dist"
export SRC_FOLDER="$ROOT_FOLDER/src"
export MAIN_CSPROJ_PATH="$SRC_FOLDER/Ducode.Wolk.Api/Ducode.Wolk.Api.csproj"
export GUI_SRC_FOLDER="$ROOT_FOLDER/ui"

echo "Determining version"
YEAR="$(date +%Y)"
MONTH="$(date +%m)"
DAY="$(date +%d)"
export VERSION="$YEAR.$MONTH.$DAY.$TRAVIS_BUILD_NUMBER"
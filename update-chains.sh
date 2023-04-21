#!/bin/bash

echo "----------------------------------------"
echo "updating submodule 'chains' in '/sketch/assets/'"
git submodule update

echo "refreshing file lists"
# https://askubuntu.com/a/811236
ls -p sketch/assets/chains/chains  | grep -v / > sketch/assets/filenames.english.txt
ls -p sketch/assets/chains/chaînes | grep -v / > sketch/assets/filenames.french.txt

echo "done"
echo "----------------------------------------"

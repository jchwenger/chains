#!/bin/bash

echo "----------------------------------------"
echo "updating submodule 'chains' in 'sketch/assets/'"
echo
cd sketch/assets/chains
git pull
cd -

echo
echo "refreshing file lists"
# https://askubuntu.com/a/811236
ls -p sketch/assets/chains/chains  | grep -v / > sketch/assets/filenames.english.txt
ls -p sketch/assets/chains/chaînes | grep -v / > sketch/assets/filenames.french.txt

echo "----------------------------------------"
echo "Commit changes? [Y/n] "
read answer
echo "Your answer: $answer"
if [[ "${answer,,}" =~ ^y*$  ]]
then
  git add "sketch/assets/chains"
  git status
  echo "----------------------------------------"
  echo "Everything ok? [Y/n] "
  read second_answer
  if [[ "${second_answer,,}" =~ ^y*$  ]]
  then
    git commit -m "chains | submodule updated"
  else
    git restore --staged "sketch/assets/chains"
    echo "---------"
    echo "Aborting update."
    git status
    echo "----------------------------------------"
    exit 2
  fi
else
  echo "---------"
  echo "Aborting update."
  exit 2
fi


echo "done"
echo "----------------------------------------"

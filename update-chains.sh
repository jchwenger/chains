#!/bin/bash

echo "----------------------------------------"
echo "updating submodule 'chains.writing' in 'assets/'"
echo
cd assets/chains.writing
git pull origin master
cd -

echo
echo "refreshing file lists"
# https://askubuntu.com/a/811236
ls -p assets/chains.writing/chains  | grep -v / > assets/filenames.english.txt
ls -p assets/chains.writing/chaînes | grep -v / > assets/filenames.french.txt

echo "----------------------------------------"
echo "Commit changes? [Y/n] "
read answer
echo "Your answer: $answer"
if [[ "${answer,,}" =~ ^y*$  ]]
then
  git add "assets/chains.writing"
  git add "assets/filenames.english.txt"
  git add "assets/filenames.french.txt"
  git status
  echo "----------------------------------------"
  echo "Everything ok? [Y/n] "
  read second_answer
  if [[ "${second_answer,,}" =~ ^y*$  ]]
  then
    git commit -m "chains | submodule updated"
  else
    git restore --staged "assets/chains.writing"
    git restore --staged "assets/filenames.english.txt"
    git restore --staged "assets/filenames.french.txt"
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

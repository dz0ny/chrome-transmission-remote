#!/bin/bash

rm -rf ./dist 
mkdir ./dist 
cp -R ./source ./dist/source

for f in source/js/*.js
do
  echo "Compiling $f file..."
  java -jar compiler.jar --js $f --js_output_file dist/$f --summary_detail_level 3 --compilation_level SIMPLE_OPTIMIZATIONS
done

for f in ./dist/source/css/*.css
do
  echo "Minimizing $f file..."
  java -jar css.jar $f -o $f -v --charset utf-8
done

7z -tzip -mx=9 a ./dist/source-compiled.zip ./dist/source/*
google-chrome --pack-extension-key=./source.pem --pack-extension=./dist/source --no-message-box 



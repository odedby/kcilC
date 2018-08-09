#!/bin/bash
export REDIS_HOST='127.0.0.1'
export DATA_SRC='./test/test_data.xml'
nyc mocha --exit
unset REDIS_HOST
unset DATA_SRC

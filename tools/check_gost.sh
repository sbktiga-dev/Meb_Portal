#!/bin/bash
sudo -u postgres psql -d mebportal -c "SELECT id, title, substring(content from 1 for 200) as content_preview FROM \"Reference\" WHERE category = 'ГОСТ';"

# Readytolearn - Current Status

## Live site
https://readytolearn.onrender.com

## Goal
Show 1000+ generated courses on /courses with pagination.

## Courses data file (auto-generated)
apps/web/app/courses/courses.data.ts

## Generator
apps/web/scripts/generate-courses.mjs

## GitHub Action
.github/workflows/generate-courses.yml

## Known issue
/courses page needs pagination + must work with static export on Render.

## What to check if courses don't show
1) courses.data.ts contains 1000+ courses (file is huge)
2) Render deployed latest commit
3) /courses page.tsx uses pagination and renders only 24 items per page

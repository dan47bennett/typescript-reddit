# typescript-reddit

A project to build a Reddit style site using Next.js, Typescript, postGreSQL and Graphql. Based on [this tutorial](https://youtu.be/I6ypD7qv3Z8).

## The repo

The repo is a monorepo structure containing both the front-end and back-end code in the web and server folders, respectively.

### Web

The frontend web folder contains code using Next.js, GraphQL and the UI library Chakra to build out the site.

To develop in the web folder run

`npm run dev`

and the development server will start up

### Server

The server folder contains code using PostgreSQL, GraphQL, redis and TypeORM to build out the backend.

To develop in the server folder run

`npm run watch`

to rebuild to the dist folder each time a change is made. Also run

`npm run dev`

to run a local server using the current dist folder.

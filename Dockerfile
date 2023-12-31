FROM node:lts as build

# Install dumb-init
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

# Install dependencies with yarn
RUN yarn install

COPY . .
RUN ["cp", "config.example.json", "config.json"]


# Build the app
RUN yarn build

#### Build Time Finished ####

FROM node:lts-bullseye-slim

USER node
ENV NODE_ENV production
WORKDIR /usr/src/app

COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "dumb-init", "node", "dist/index.js" ]

FROM node:boron

# see https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
# https://semaphoreci.com/community/tutorials/dockerizing-a-node-js-web-application

# set up app
RUN mkdir -p /usr/src/app
WORKDIR /usr/src

# install dependencies
COPY package.json package-lock.json /usr/src/
RUN npm install --production

# add app files
COPY lib/ /usr/src/lib
COPY app/ /usr/src/app

# TODO - user shouldn't be root by default
# RUN useradd app
# RUN chown -R app:app /usr/src/
# USER app

EXPOSE 3000

# TODO - seeding DB should be decoupled from launching container
# CMD ["node", "app/index.js"]
CMD ["npm", "run", "seedDBAndStart"]

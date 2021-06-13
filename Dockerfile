FROM node:12-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

ENV MEDIA_PATH=/media
ENV OUTPUT_PATH=/output

# Bundle app source
COPY . .

EXPOSE 1337
CMD [ "node", "index.js" ]
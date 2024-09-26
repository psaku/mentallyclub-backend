FROM node:20

# Create app directory
WORKDIR /user/mentally/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install
RUN npm install nodemon

# Bundle app source
COPY . .

CMD [ "npm", "start" ]
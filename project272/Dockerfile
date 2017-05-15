
FROM node


ADD . /app


WORKDIR /app

RUN npm install
RUN npm install -g nodemon

#expose a port to allow external access
EXPOSE 8080

# Start mean application
CMD ["nodemon", "server.js"]

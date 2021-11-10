FROM node:14.15.4-alpine3.11

WORKDIR /home/Descargas/apichat4

COPY ["package.json", "package-lock.json*", "./"]
COPY . .
EXPOSE 8006
CMD npm start

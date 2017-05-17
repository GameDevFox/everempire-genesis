FROM node

ADD /dist/index.js /app/index.js

CMD node /app/index.js

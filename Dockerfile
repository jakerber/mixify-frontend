# build environment
FROM node:16.15.1 as react-build
WORKDIR /mixify
COPY . ./
RUN npm install --force
RUN npm run build

# server environment
FROM nginx:1.19
COPY nginx.conf /etc/nginx/conf.d/configfile.template

COPY --from=react-build /mixify/build /usr/share/nginx/html

ENV PORT 8080
ENV HOST 0.0.0.0
EXPOSE 8080
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/configfile.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
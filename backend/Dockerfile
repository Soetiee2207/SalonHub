FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Hugging Face yêu cầu dùng cổng 7860
ENV PORT=7860
EXPOSE 7860
CMD ["node", "server.js"]
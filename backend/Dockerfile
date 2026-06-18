FROM node:22-alpine
WORKDIR /app

# 安装 CJK 字体，用于 PDF 中文/符号渲染
RUN apk add --no-cache font-noto-cjk && \
    CJK_FILE=$(find /usr/share/fonts -name "NotoSans*CJK*" -o -name "NotoSans*SC*" 2>/dev/null | head -1) && \
    mkdir -p /app/fonts && \
    if [ -n "$CJK_FILE" ]; then \
      ln -sf "$CJK_FILE" /app/fonts/cjk-font.ttf; \
    else \
      CJK_FILE=$(find /usr/share/fonts -name "*.ttc" -o -name "*.ttf" -o -name "*.otf" 2>/dev/null | head -1) && \
      [ -n "$CJK_FILE" ] && ln -sf "$CJK_FILE" /app/fonts/cjk-font.ttf; \
    fi

ENV PDF_CJK_FONT_PATH=/app/fonts/cjk-font.ttf

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001
CMD ["npm", "start"]
